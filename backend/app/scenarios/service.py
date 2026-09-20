"""ScenarioService — orchestrates Scenario Lab runs.

Flow: validate type → typed params → resolve entities → check required
inputs → build real ScenarioContext → deterministic engine → response.
Runs never mutate financial data; saved scenarios store inputs,
assumptions and the result snapshot for history/re-run.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.scenario_runs import ScenarioRunRepository
from app.scenarios.context import ScenarioContext, ScenarioContextBuilder
from app.scenarios.engine import ScenarioComputation, ScenarioEngine
from app.scenarios.errors import ScenarioError
from app.scenarios.registry import ScenarioDefinition, get_definition
from app.scenarios.scenario_types import (
    ENGINE_VERSION,
    DataQuality,
    ScenarioRunStatus,
    ScenarioType,
)
from app.scenarios import schemas as S


def _jsonable(value: Any) -> Any:
    """Convert Decimals/dates/UUIDs into JSON-compatible values."""
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


class ScenarioService:
    """Orchestrates scenario runs against real user data."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ScenarioRunRepository(session)
        self._engine = ScenarioEngine()
        self._context_builder = ScenarioContextBuilder(session)

    # ── Public API ─────────────────────────────────────────────────────

    async def run(
        self,
        user_id: uuid.UUID,
        scenario_type: str,
        parameters: dict[str, Any],
        *,
        title: str | None = None,
        session_id: str | None = None,
        save: bool = False,
        missing_fields: list[str] | None = None,
    ) -> S.ScenarioRunResponse:
        """Validate and compute a scenario. Never mutates financial data."""
        definition = get_definition(scenario_type)
        if definition is None:
            raise ScenarioError.invalid_scenario(scenario_type)

        params, missing = self._validate_params(definition, parameters)
        missing = sorted(set(missing) | set(missing_fields or []))
        if missing:
            return self._needs_input(definition, missing)

        assert params is not None
        ctx = await self._context_builder.build(user_id)
        computation = self._engine.run(definition, params, ctx)
        response = self._to_response(definition, params, computation, ctx, title)

        if save and computation.status == ScenarioRunStatus.COMPUTED:
            record = await self._persist(
                user_id, session_id, definition, params, response
            )
            response.scenario_id = record.id

        return response

    async def save_scenario(
        self,
        user_id: uuid.UUID,
        request: S.ScenarioSaveRequest,
        *,
        session_id: str | None = None,
    ) -> S.ScenarioRunResponse:
        """Run and persist a scenario in one step."""
        return await self.run(
            user_id,
            request.scenario_type,
            request.parameters,
            title=request.title,
            session_id=session_id,
            save=True,
        )

    async def list_scenarios(
        self,
        user_id: uuid.UUID,
        *,
        skip: int = 0,
        limit: int = 50,
    ) -> list[S.ScenarioHistoryItem]:
        rows = await self._repo.list_for_user(user_id, skip=skip, limit=limit)
        return [self._history_item(r) for r in rows]

    async def get_scenario(
        self, user_id: uuid.UUID, scenario_id: uuid.UUID
    ) -> S.ScenarioRunResponse:
        row = await self._repo.get_for_user(user_id, scenario_id)
        if row is None:
            raise ScenarioError.not_found(str(scenario_id))
        return self._response_from_record(row)

    async def rerun(
        self, user_id: uuid.UUID, scenario_id: uuid.UUID
    ) -> S.ScenarioRunResponse:
        """Re-run a saved scenario against the user's CURRENT data.

        The historical record is preserved untouched — the re-run returns
        a fresh response (with the original inputs) that callers may save
        again or compare with the stored snapshot.
        """
        row = await self._repo.get_for_user(user_id, scenario_id)
        if row is None:
            raise ScenarioError.not_found(str(scenario_id))
        response = await self.run(
            user_id,
            row.scenario_type,
            dict(row.input_payload or {}),
            title=row.title or None,
        )
        # Attach the historical result so the UI can show "previously…".
        previous = (row.result_snapshot or {}).get("metrics")
        if previous:
            response.scenario_id = row.id
            response.alternatives = response.alternatives or []
            response.scenario = {
                **response.scenario,
                "previousRunAt": row.created_at.isoformat()
                if row.created_at else None,
            }
        return response

    async def compare(
        self, user_id: uuid.UUID, request: S.ScenarioCompareRequest
    ) -> S.ScenarioCompareResponse:
        """Run up to ``scenario_max_compare`` scenarios and align metrics."""
        specs: list[tuple[str, dict[str, Any], str]] = []
        for item in request.scenarios:
            specs.append((item.scenario_type, item.parameters, item.title or ""))
        for sid in request.scenario_ids:
            row = await self._repo.get_for_user(user_id, sid)
            if row is None:
                raise ScenarioError.not_found(str(sid))
            specs.append((row.scenario_type, dict(row.input_payload or {}), row.title))

        limit = settings.scenario_max_compare
        if len(specs) > limit:
            raise ScenarioError.comparison_limit(limit)
        if not specs:
            raise ScenarioError.invalid_parameters(
                "Provide at least one scenario to compare."
            )

        ctx = await self._context_builder.build(user_id)
        titles: list[str] = []
        results: list[S.ScenarioRunResponse] = []
        for stype, params, custom_title in specs:
            definition = get_definition(stype)
            if definition is None:
                raise ScenarioError.invalid_scenario(stype)
            validated, missing = self._validate_params(definition, params)
            if missing or validated is None:
                raise ScenarioError.invalid_parameters(
                    f"Scenario '{stype}' is missing required inputs.",
                    missing_fields=missing,
                )
            computation = self._engine.run(definition, validated, ctx)
            results.append(
                self._to_response(definition, validated, computation, ctx, custom_title)
            )
            titles.append(results[-1].title or definition.short_label or stype)

        rows = self._compare_rows(results)
        return S.ScenarioCompareResponse(
            titles=titles,
            rows=rows,
            engine_version=ENGINE_VERSION,
            generated_at=datetime.now(timezone.utc),
        )

    async def delete_scenario(
        self, user_id: uuid.UUID, scenario_id: uuid.UUID
    ) -> None:
        row = await self._repo.get_for_user(user_id, scenario_id)
        if row is None:
            raise ScenarioError.not_found(str(scenario_id))
        row.soft_delete()
        await self._session.flush()

    # ── Internals ──────────────────────────────────────────────────────

    @staticmethod
    def _validate_params(
        definition: ScenarioDefinition,
        parameters: dict[str, Any],
    ) -> tuple[S.BaseSchema | None, list[str]]:
        """Validate the parameter dict into the typed model."""
        try:
            params = definition.param_model.model_validate(parameters)
        except Exception:
            # Fall back to reporting which required fields are absent.
            missing = [
                f for f in definition.required_params
                if parameters.get(f) is None
                and parameters.get(_camel(f)) is None
            ]
            if not missing:
                missing = list(definition.required_params) or ["parameters"]
            return None, missing

        missing = [
            f for f in definition.required_params
            if getattr(params, f, None) is None
        ]
        return params, missing

    @staticmethod
    def _needs_input(
        definition: ScenarioDefinition, missing: list[str]
    ) -> S.ScenarioRunResponse:
        labels = [
            definition.param_labels.get(f, f.replace("_", " ")) for f in missing
        ]
        question = (
            "To simulate this, I need "
            + ", ".join(labels)
            + ". What should I use?"
        )
        return S.ScenarioRunResponse(
            scenario_type=definition.type,
            status=ScenarioRunStatus.NEEDS_INPUT,
            title=definition.short_label or definition.type.value,
            missing_fields=missing,
            clarification_question=question,
            engine_version=ENGINE_VERSION,
            generated_at=datetime.now(timezone.utc),
        )

    def _to_response(
        self,
        definition: ScenarioDefinition,
        params: S.BaseSchema,
        computation: ScenarioComputation,
        ctx: ScenarioContext,
        title: str | None,
    ) -> S.ScenarioRunResponse:
        data_missing = sorted(
            set(computation.missing_data)
            | {k for k in definition.required_context if not self._engine._has(ctx, k)}
        )
        if computation.status == ScenarioRunStatus.COMPUTED:
            quality = (
                DataQuality.COMPLETE
                if not data_missing and not computation.missing_data
                else DataQuality.PARTIAL
            )
        else:
            quality = DataQuality.INSUFFICIENT

        return S.ScenarioRunResponse(
            scenario_type=definition.type,
            title=title or self._default_title(definition, params),
            status=computation.status,
            baseline={k: _jsonable(v) for k, v in computation.baseline.items()},
            scenario={k: _jsonable(v) for k, v in computation.scenario.items()},
            metrics=computation.metrics,
            assumptions=computation.assumptions,
            affected_domains=list(definition.affected_domains),
            data_available=sorted(set(ctx.data_available)),
            data_missing=data_missing,
            data_quality=quality,
            summary=computation.summary,
            explanation=computation.explanation,
            apply_action=computation.apply,
            alternatives=computation.alternatives,
            engine_version=ENGINE_VERSION,
            generated_at=datetime.now(timezone.utc),
        )

    @staticmethod
    def _default_title(
        definition: ScenarioDefinition, params: S.BaseSchema
    ) -> str:
        data = params.model_dump(by_alias=False)
        st = definition.type
        if st == ScenarioType.PURCHASE:
            name = data.get("item_name") or "Purchase"
            amount = data.get("purchase_amount")
            return f"Buy {name} — ₹{float(amount):,.0f}" if amount else f"Buy {name}"
        if st == ScenarioType.RETIREMENT_AGE_CHANGE:
            return f"Retire at {data.get('new_retirement_age')}"
        if st == ScenarioType.MONTHLY_SAVINGS_CHANGE:
            amt = data.get("change_amount")
            sign = "more" if (amt or 0) >= 0 else "less"
            return f"Save ₹{abs(float(amt or 0)):,.0f} {sign}/month"
        if st == ScenarioType.INCOME_CHANGE:
            return "Income change"
        return definition.short_label or st.value.replace("_", " ").title()

    async def _persist(
        self,
        user_id: uuid.UUID,
        session_id: str | None,
        definition: ScenarioDefinition,
        params: S.BaseSchema,
        response: S.ScenarioRunResponse,
    ):
        from app.models.scenario_runs import ScenarioRun

        record = ScenarioRun(
            user_id=user_id,
            session_id=session_id,
            scenario_type=definition.type.value,
            title=response.title,
            status=response.status.value,
            headline=response.summary[:500],
            input_payload=params.model_dump(mode="json", by_alias=False),
            assumptions=[a.model_dump(mode="json") for a in response.assumptions],
            baseline_snapshot=response.baseline,
            result_snapshot={
                "scenario": response.scenario,
                "metrics": [
                    m.model_dump(mode="json") for m in response.metrics
                ],
                "summary": response.summary,
                "dataQuality": response.data_quality.value,
            },
            affected_domains=response.affected_domains,
            engine_version=ENGINE_VERSION,
            simulated_at=datetime.now(timezone.utc),
        )
        self._session.add(record)
        await self._session.flush()
        await self._session.refresh(record)
        return record

    @staticmethod
    def _history_item(row) -> S.ScenarioHistoryItem:
        return S.ScenarioHistoryItem(
            id=row.id,
            scenario_type=ScenarioType(row.scenario_type),
            title=row.title,
            status=ScenarioRunStatus(row.status),
            headline=row.headline,
            created_at=row.created_at,
            engine_version=row.engine_version,
        )

    @staticmethod
    def _response_from_record(row) -> S.ScenarioRunResponse:
        snapshot = row.result_snapshot or {}
        metrics = [
            S.ScenarioMetric.model_validate(m)
            for m in snapshot.get("metrics", [])
        ]
        assumptions = [
            S.ScenarioAssumption.model_validate(a)
            for a in (row.assumptions or [])
        ]
        return S.ScenarioRunResponse(
            scenario_id=row.id,
            scenario_type=ScenarioType(row.scenario_type),
            title=row.title,
            status=ScenarioRunStatus(row.status),
            baseline=row.baseline_snapshot or {},
            scenario=snapshot.get("scenario") or {},
            metrics=metrics,
            assumptions=assumptions,
            affected_domains=row.affected_domains or [],
            summary=snapshot.get("summary", ""),
            data_quality=DataQuality(
                snapshot.get("dataQuality", DataQuality.COMPLETE.value)
            ),
            engine_version=row.engine_version,
            generated_at=row.created_at,
            simulated_at=row.simulated_at or row.created_at,
        )

    @staticmethod
    def _compare_rows(
        results: list[S.ScenarioRunResponse],
    ) -> list[S.ScenarioCompareRow]:
        """Align metrics across scenarios into comparison rows."""
        keys: list[str] = []
        for r in results:
            for m in r.metrics:
                if m.key not in keys:
                    keys.append(m.key)

        rows: list[S.ScenarioCompareRow] = []
        for key in keys:
            label = ""
            unit = None
            before = None
            cells: list[S.ScenarioCompareCell] = []
            for r in results:
                match = next((m for m in r.metrics if m.key == key), None)
                if match is None:
                    cells.append(S.ScenarioCompareCell())
                    continue
                label = match.label
                unit = match.unit
                if before is None:
                    before = match.before
                cells.append(
                    S.ScenarioCompareCell(
                        after=match.after,
                        change=match.change,
                        direction=match.direction,
                    )
                )
            rows.append(
                S.ScenarioCompareRow(
                    key=key,
                    label=label,
                    unit=unit or next(
                        m.unit for r in results for m in r.metrics if m.key == key
                    ),
                    before=before,
                    cells=cells,
                )
            )
        return rows


def _camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])
