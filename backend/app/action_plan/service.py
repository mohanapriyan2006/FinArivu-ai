"""FinancialActionPlanService — Phase 4 orchestration.

Pipeline per generation:

    MoneyRadarService.scan()          (reuses Phase 3 — one context load)
      → CandidateBuilder              (insight → PlanCandidate)
      → PriorityPolicy                (deterministic score)
      → PlanSelector                  (top ≤5, category-diverse)
      → reconcile against persisted items (dedup / refresh / expire)
      → FinancialActionPlan

The plan is READ-ONLY with respect to financial records (§52) — the only
writes are to ``financial_action_plans`` / ``financial_action_plan_items``.
Mutations happen exclusively through Phase 1 Action Copilot previews.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger
from app.money_radar.service import MoneyRadarService
from app.money_radar.schemas import RadarInsight
from app.action_plan.errors import PlanError
from app.action_plan.pipeline import (
    CandidateBuilder,
    PlanSelector,
    current_period,
    resolve_snooze,
)
from app.action_plan.plan_types import (
    OPEN_ITEM_STATUSES,
    CompletionSource,
    PlanItemStatus,
    PlanStatus,
    PLAN_VERSION,
    SnoozeOption,
    can_transition,
)
from app.action_plan.schemas import (
    FinancialActionPlanOut,
    FinancialPlanItemOut,
    PlanCandidate,
    PlanHistoryEntry,
)
from app.models.action_plan import (
    FinancialActionPlan,
    FinancialPlanItem as PlanItemRow,
)
from app.repositories.action_plan import (
    FinancialActionPlanRepository,
    FinancialPlanItemRepository,
)
from app.repositories.copilot_action_executions import (
    CopilotActionExecutionRepository,
)

_PRIORITY_ORDER = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}


class FinancialActionPlanService:
    """Orchestrates plan generation, lifecycle and reconciliation."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._radar = MoneyRadarService(session)
        self._plans = FinancialActionPlanRepository(session)
        self._items = FinancialPlanItemRepository(session)
        self._executions = CopilotActionExecutionRepository(session)

    # ── Generation / retrieval ──────────────────────────────────────

    async def get_or_generate_current(
        self, user_id: uuid.UUID, *, force_rescan: bool = False
    ) -> FinancialActionPlanOut:
        """Return the current-period plan, generating if absent.

        ``force_rescan=True`` runs a fresh Money Radar scan; otherwise the
        persisted radar summary is used so opening the screen is cheap.
        """
        period_key, start, end = current_period()
        plan = await self._plans.get_current_for_user(user_id, period_key)

        summary = (
            await self._radar.scan(user_id)
            if force_rescan
            else await self._radar.get_summary(user_id)
        )
        dismissed = await self._dismissal_memory(user_id)
        candidates = CandidateBuilder.from_insights(
            user_id, summary.insights, dismissed
        )
        selected = PlanSelector.select(candidates)

        if plan is None:
            plan = await self._create_plan(user_id, period_key, start, end)

        await self._reconcile(plan, user_id, selected, summary.insights)
        plan.summary = self._plan_summary(plan, selected)
        plan.updated_at = datetime.now(timezone.utc)
        await self._session.flush()

        return await self._to_out(plan)

    async def get_plan(
        self, user_id: uuid.UUID, plan_id: uuid.UUID
    ) -> FinancialActionPlanOut:
        plan = await self._plans.get_for_user(user_id, plan_id)
        if plan is None:
            raise PlanError.plan_not_found(plan_id)
        return await self._to_out(plan)

    async def get_history(
        self, user_id: uuid.UUID, *, skip: int = 0, limit: int = 12
    ) -> list[PlanHistoryEntry]:
        period_key, _, _ = current_period()
        rows, _ = await self._plans.list_history_for_user(
            user_id, exclude_period_key=period_key, skip=skip, limit=limit
        )
        out: list[PlanHistoryEntry] = []
        for row in rows:
            counts = row.counts or {}
            out.append(
                PlanHistoryEntry(
                    id=row.id,
                    period_start=row.period_start,
                    period_end=row.period_end,
                    status=PlanStatus(row.status),
                    generated_at=row.generated_at,
                    active_count=counts.get("active", 0),
                    completed_count=counts.get("completed", 0),
                    dismissed_count=counts.get("dismissed", 0),
                )
            )
        return out

    # ── Item lifecycle ───────────────────────────────────────────────

    async def get_item(
        self, user_id: uuid.UUID, item_id: uuid.UUID
    ) -> FinancialPlanItemOut:
        row = await self._require_item(user_id, item_id)
        return self._item_out(row)

    async def accept_item(
        self, user_id: uuid.UUID, item_id: uuid.UUID
    ) -> FinancialPlanItemOut:
        """PENDING → IN_PROGRESS (§23 — accept ≠ mutate)."""
        row = await self._require_item(user_id, item_id)
        self._ensure_transition(row.status, PlanItemStatus.IN_PROGRESS)
        row.status = PlanItemStatus.IN_PROGRESS.value
        row.updated_at = datetime.now(timezone.utc)
        await self._session.flush()
        await self._sync_counts(row.plan_id)
        return self._item_out(row)

    async def snooze_item(
        self, user_id: uuid.UUID, item_id: uuid.UUID, option: str
    ) -> FinancialPlanItemOut:
        """PENDING/IN_PROGRESS → SNOOZED until the resolved window (§27)."""
        try:
            SnoozeOption(option)
        except ValueError:
            raise PlanError.invalid_snooze(f"Unknown snooze option '{option}'.")

        row = await self._require_item(user_id, item_id)
        self._ensure_transition(row.status, PlanItemStatus.SNOOZED)
        row.status = PlanItemStatus.SNOOZED.value
        row.snoozed_until = resolve_snooze(option)
        row.updated_at = datetime.now(timezone.utc)
        await self._session.flush()
        await self._sync_counts(row.plan_id)
        return self._item_out(row)

    async def dismiss_item(
        self, user_id: uuid.UUID, item_id: uuid.UUID
    ) -> FinancialPlanItemOut:
        """Open → DISMISSED. The source Radar insight is untouched (§28)."""
        row = await self._require_item(user_id, item_id)
        if row.status == PlanItemStatus.DISMISSED.value:
            raise PlanError.already_dismissed()
        self._ensure_transition(row.status, PlanItemStatus.DISMISSED)
        row.status = PlanItemStatus.DISMISSED.value
        row.dismissed_at = datetime.now(timezone.utc)
        row.dismissed_count += 1
        row.updated_at = row.dismissed_at
        await self._session.flush()
        await self._sync_counts(row.plan_id)
        return self._item_out(row)

    async def complete_item(
        self,
        user_id: uuid.UUID,
        item_id: uuid.UUID,
        *,
        execution_id: uuid.UUID | None = None,
    ) -> FinancialPlanItemOut:
        """Open → COMPLETED (§29).

        ``execution_id`` links a Phase 1 execution — completion_source is
        ACTION_EXECUTION only when that row is actually EXECUTED for this
        user; a FAILED/pending execution never completes the item.
        """
        row = await self._require_item(user_id, item_id)
        if row.status == PlanItemStatus.COMPLETED.value:
            raise PlanError.already_completed()
        self._ensure_transition(row.status, PlanItemStatus.COMPLETED)

        source = CompletionSource.USER.value
        if execution_id is not None:
            execution = await self._executions.get_for_user(
                user_id, execution_id
            )
            if execution is not None:
                row.linked_action_execution_id = execution.id
                source = (
                    CompletionSource.ACTION_EXECUTION.value
                    if execution.status == "EXECUTED"
                    else CompletionSource.USER.value
                )

        row.status = PlanItemStatus.COMPLETED.value
        row.completion_source = source
        row.completed_at = datetime.now(timezone.utc)
        row.updated_at = row.completed_at
        await self._session.flush()
        await self._sync_counts(row.plan_id)
        return self._item_out(row)

    async def add_insight_item(
        self, user_id: uuid.UUID, insight_id: uuid.UUID
    ) -> FinancialPlanItemOut:
        """Radar → Plan bridge — create a plan item from a live insight."""
        insight = await self._radar.get_insight(user_id, insight_id)
        if insight.status not in ("ACTIVE", "SEEN"):
            raise PlanError.source_not_found()

        period_key, start, end = current_period()
        plan = await self._plans.get_current_for_user(user_id, period_key)
        if plan is None:
            plan = await self._create_plan(user_id, period_key, start, end)

        dismissed = await self._dismissal_memory(user_id)
        candidates = CandidateBuilder.from_insights(user_id, [insight], dismissed)
        if not candidates:
            raise PlanError.source_not_found()
        cand = candidates[0]

        existing = await self._items.get_by_fingerprint(
            user_id, cand.fingerprint
        )
        if existing is not None:
            # Already in plan — return it rather than duplicating (§75).
            return self._item_out(existing)

        row = PlanItemRow(
            plan_id=plan.id, user_id=user_id, **self._row_payload(cand)
        )
        await self._items.create(row)
        await self._sync_counts(plan.id)
        return self._item_out(row)

    # ── Reconciliation ───────────────────────────────────────────────

    async def _reconcile(
        self,
        plan: FinancialActionPlan,
        user_id: uuid.UUID,
        selected: list[PlanCandidate],
        active_insights: list[RadarInsight],
    ) -> None:
        """Merge candidates into the persisted plan (§30–§36)."""
        now = datetime.now(timezone.utc)
        existing = await self._items.list_for_plan(plan.id)
        by_fp = {row.fingerprint: row for row in existing}
        active_insight_ids = {str(i.id) for i in active_insights}
        selected_fps = {c.fingerprint for c in selected}

        # 1. Reconcile existing rows.
        for row in existing:
            cand = next(
                (c for c in selected if c.fingerprint == row.fingerprint),
                None,
            )
            open_ = row.status in OPEN_ITEM_STATUSES
            source_alive = (
                row.source_insight_id is None
                or str(row.source_insight_id) in active_insight_ids
            )

            if row.status == PlanItemStatus.SNOOZED.value:
                until = row.snoozed_until
                if until is not None and until.tzinfo is None:
                    until = until.replace(tzinfo=timezone.utc)
                if until is not None and until <= now:
                    # Snooze elapsed — revive only if the condition persists.
                    if source_alive and cand is not None:
                        row.status = PlanItemStatus.PENDING.value
                        row.snoozed_until = None
                        self._refresh(row, cand, now)
                    elif not source_alive:
                        row.status = PlanItemStatus.EXPIRED.value
                        row.updated_at = now
                continue

            if not open_:
                continue  # terminal states are never touched

            if not source_alive:
                # Underlying condition resolved → the work is done (§135).
                row.status = PlanItemStatus.COMPLETED.value
                row.completion_source = (
                    CompletionSource.SYSTEM_RECONCILIATION.value
                )
                row.completed_at = now
                row.updated_at = now
                continue

            if cand is None:
                # Still open but fell out of the top-N — keep it, don't
                # churn the plan; a genuinely resolved case is handled above.
                continue

            self._refresh(row, cand, now)

        # 2. Insert genuinely new selected candidates.
        for cand in selected:
            if cand.fingerprint in by_fp:
                continue
            row = PlanItemRow(
                plan_id=plan.id, user_id=user_id, **self._row_payload(cand)
            )
            await self._items.create(row)

        await self._sync_counts(plan.id)

    def _refresh(
        self, row: PlanItemRow, cand: PlanCandidate, now: datetime
    ) -> None:
        """Refresh evidence/score on an open row without touching status."""
        row.score = cand.score
        row.priority = cand.priority.value
        row.evidence = [e.model_dump(mode="json") for e in cand.evidence]
        row.impact = cand.impact.model_dump(mode="json")
        row.why = list(cand.why)
        row.summary = cand.summary
        row.freshness = cand.freshness.model_dump(mode="json")
        row.data_quality = cand.data_quality
        row.actions = [a.value for a in cand.actions]
        row.scenario_preset = (
            cand.scenario_preset.model_dump(mode="json")
            if cand.scenario_preset
            else None
        )
        row.action_preset = (
            cand.action_preset.model_dump(mode="json")
            if cand.action_preset
            else None
        )
        row.due_window = cand.due_window
        row.updated_at = now

    # ── Internals ────────────────────────────────────────────────────

    async def _create_plan(
        self,
        user_id: uuid.UUID,
        period_key: str,
        start,
        end,
    ) -> FinancialActionPlan:
        plan = FinancialActionPlan(
            user_id=user_id,
            period_key=period_key,
            period_start=start,
            period_end=end,
            status=PlanStatus.ACTIVE.value,
            generated_at=datetime.now(timezone.utc),
            plan_version=PLAN_VERSION,
        )
        return await self._plans.create(plan)

    async def _dismissal_memory(self, user_id: uuid.UUID) -> dict[str, int]:
        """Anti-noise: how often each state signature was dismissed (§95)."""
        rows = await self._items.list(user_id=user_id, status="DISMISSED")
        memory: dict[str, int] = {}
        for row in rows:
            if row.state_signature:
                memory[row.state_signature] = (
                    memory.get(row.state_signature, 0) + row.dismissed_count
                )
        return memory

    async def _sync_counts(self, plan_id: uuid.UUID) -> None:
        items = await self._items.list_for_plan(plan_id)
        counts = {"active": 0, "completed": 0, "snoozed": 0, "dismissed": 0}
        for item in items:
            if item.status in (
                PlanItemStatus.PENDING.value,
                PlanItemStatus.IN_PROGRESS.value,
            ):
                counts["active"] += 1
            elif item.status == PlanItemStatus.SNOOZED.value:
                counts["snoozed"] += 1
            elif item.status == PlanItemStatus.COMPLETED.value:
                counts["completed"] += 1
            elif item.status == PlanItemStatus.DISMISSED.value:
                counts["dismissed"] += 1
        plan = await self._plans.get_by_id(plan_id)
        if plan is not None:
            plan.counts = counts
            plan.updated_at = datetime.now(timezone.utc)
            await self._session.flush()

    def _plan_summary(
        self, plan: FinancialActionPlan, selected: list[PlanCandidate]
    ) -> str:
        """Deterministic summary text (§62) — structured values only."""
        if not selected:
            return "You're on track — no high-priority actions right now."
        by_category: dict[str, int] = {}
        for cand in selected:
            by_category[cand.category.value] = (
                by_category.get(cand.category.value, 0) + 1
            )
        parts = ", ".join(
            f"{n} {k.replace('_', ' ').lower()}"
            for k, n in sorted(by_category.items())
        )
        return f"{len(selected)} priorities this week: {parts}."

    async def _require_item(
        self, user_id: uuid.UUID, item_id: uuid.UUID
    ) -> PlanItemRow:
        row = await self._items.get_for_user(user_id, item_id)
        if row is None:
            raise PlanError.item_not_found(item_id)
        return row

    @staticmethod
    def _ensure_transition(current: str, target: PlanItemStatus) -> None:
        if not can_transition(current, target.value):
            raise PlanError.invalid_transition(current, target.value)

    # ── Serialisation ────────────────────────────────────────────────

    @staticmethod
    def _row_payload(cand: PlanCandidate) -> dict[str, Any]:
        return {
            "fingerprint": cand.fingerprint,
            "title": cand.title,
            "summary": cand.summary,
            "category": cand.category.value,
            "priority": cand.priority.value,
            "status": PlanItemStatus.PENDING.value,
            "score": cand.score,
            "source_type": cand.source_type.value,
            "source_insight_id": uuid.UUID(cand.source_insight_id)
            if cand.source_insight_id
            else None,
            "source_insight_type": cand.source_insight_type,
            "source_id": cand.source_id,
            "entity_type": cand.entity_type,
            "entity_id": cand.entity_id,
            "entity_name": cand.entity_name,
            "evidence": [e.model_dump(mode="json") for e in cand.evidence],
            "impact": cand.impact.model_dump(mode="json"),
            "why": list(cand.why),
            "actions": [a.value for a in cand.actions],
            "route": cand.route,
            "scenario_preset": (
                cand.scenario_preset.model_dump(mode="json")
                if cand.scenario_preset
                else None
            ),
            "action_preset": (
                cand.action_preset.model_dump(mode="json")
                if cand.action_preset
                else None
            ),
            "due_window": cand.due_window,
            "data_quality": cand.data_quality,
            "freshness": cand.freshness.model_dump(mode="json"),
            "state_signature": cand.state_signature,
        }

    @staticmethod
    def _item_out(row: PlanItemRow) -> FinancialPlanItemOut:
        return FinancialPlanItemOut.model_validate(
            {
                "id": row.id,
                "plan_id": row.plan_id,
                "title": row.title,
                "summary": row.summary,
                "category": row.category,
                "priority": row.priority,
                "status": row.status,
                "source_type": row.source_type,
                "source_insight_id": row.source_insight_id,
                "source_insight_type": row.source_insight_type,
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "entity_name": row.entity_name,
                "evidence": row.evidence or [],
                "impact": row.impact or {},
                "why": row.why or [],
                "actions": row.actions or [],
                "route": row.route,
                "scenario_preset": row.scenario_preset,
                "action_preset": row.action_preset,
                "due_window": row.due_window,
                "data_quality": row.data_quality,
                "freshness": row.freshness or {},
                "score": row.score,
                "completion_source": row.completion_source,
                "linked_action_execution_id": row.linked_action_execution_id,
                "linked_scenario_run_id": row.linked_scenario_run_id,
                "dismissed_count": row.dismissed_count,
                "snoozed_until": row.snoozed_until,
                "completed_at": row.completed_at,
                "dismissed_at": row.dismissed_at,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            }
        )

    async def _to_out(
        self, plan: FinancialActionPlan
    ) -> FinancialActionPlanOut:
        items = await self._items.list_for_plan(plan.id)
        # Priority ordering, stable by score then creation.
        items.sort(
            key=lambda r: (
                _PRIORITY_ORDER.get(r.priority, 3),
                -r.score,
                r.created_at.timestamp() if r.created_at else 0,
            )
        )
        counts = plan.counts or {}
        return FinancialActionPlanOut(
            id=plan.id,
            period_start=plan.period_start,
            period_end=plan.period_end,
            status=PlanStatus(plan.status),
            generated_at=plan.generated_at,
            updated_at=plan.updated_at,
            generation_version=plan.generation_version,
            summary=plan.summary,
            items=[self._item_out(i) for i in items],
            completed_count=counts.get("completed", 0),
            active_count=counts.get("active", 0),
            deferred_count=counts.get("snoozed", 0),
            dismissed_count=counts.get("dismissed", 0),
            plan_version=plan.plan_version,
        )
