"""MoneyRadarService — orchestrates a deterministic scan.

Pipeline per scan:

    RadarContextBuilder (one context load)
      → enabled detectors (required domains only)
      → validate findings against the registry
      → fingerprint + dedup / upsert
      → resolve open insights whose condition disappeared
      → persist scan state (coverage + counts)
      → RadarSummary

The service is READ-ONLY with respect to financial records — it never
mutates expenses, budgets, goals, income, liabilities or assets. The only
writes are to ``money_radar_insights``, ``money_radar_scans`` and a daily
``net_worth_history`` snapshot used solely for change detection.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger
from app.money_radar.context import RadarContext, RadarContextBuilder
from app.money_radar.detectors import DETECTOR_FUNCS
from app.money_radar.errors import RadarError
from app.money_radar.radar_types import (
    RADAR_VERSION,
    InsightSeverity,
    InsightStatus,
    InsightType,
)
from app.money_radar.registry import (
    INSIGHT_REGISTRY,
    domains_for_detectors,
)
from app.money_radar.schemas import (
    DomainCoverage,
    RadarFinding,
    RadarInsight,
    RadarInsightListResponse,
    RadarSummary,
)
from app.models.money_radar import RadarInsight as RadarInsightRow
from app.repositories.money_radar import (
    RadarInsightRepository,
    RadarScanRepository,
)

_SEVERITY_ORDER = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "INFO": 3}
_OPPORTUNITY_GROUPS = {"opportunity"}
_INFO_GROUPS = {"info"}


class MoneyRadarService:
    """Orchestrates scans and the insight lifecycle."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._context_builder = RadarContextBuilder(session)
        self._insights = RadarInsightRepository(session)
        self._scans = RadarScanRepository(session)

    # ── Scan ─────────────────────────────────────────────────────────

    async def scan(self, user_id: uuid.UUID) -> RadarSummary:
        """Run every supported detector and reconcile persisted insights."""
        ctx = await self._context_builder.build(user_id)
        findings, ran_types = self._run_detectors(ctx)

        now = ctx.now
        found_fingerprints: set[str] = set()
        for finding in findings:
            row = await self._upsert_finding(user_id, finding, now)
            if row is not None:
                found_fingerprints.add(row.fingerprint)

        await self._resolve_stale(user_id, found_fingerprints, ran_types, now)

        active, _ = await self._insights.list_for_user(
            user_id, statuses=["ACTIVE", "SEEN"], limit=100
        )
        resolved_count = await self._insights.count_resolved_for_user(user_id)
        coverage = ctx.coverage(domains_for_detectors())
        counts = self._counts(active)

        await self._scans.upsert_for_user(
            user_id,
            generated_at=now,
            coverage=[c.model_dump(mode="json") for c in coverage],
            counts={**counts, "resolved": resolved_count},
            radar_version=RADAR_VERSION,
        )

        return RadarSummary(
            generated_at=now,
            active_count=counts["active"],
            high_count=counts["high"],
            medium_count=counts["medium"],
            low_count=counts["low"],
            info_count=counts["info"],
            resolved_count=resolved_count,
            attention_count=counts["high"] + counts["medium"],
            opportunity_count=counts["opportunities"],
            coverage=coverage,
            insights=[self._to_schema(r) for r in active],
            radar_version=RADAR_VERSION,
        )

    async def get_summary(self, user_id: uuid.UUID) -> RadarSummary:
        """Persisted summary — auto-scans on first use (never scanned)."""
        state = await self._scans.get_for_user(user_id)
        if state is None:
            return await self.scan(user_id)

        active, _ = await self._insights.list_for_user(
            user_id, statuses=["ACTIVE", "SEEN"], limit=100
        )
        counts = state.counts or {}
        return RadarSummary(
            generated_at=state.generated_at,
            active_count=len(active),
            high_count=counts.get("high", 0),
            medium_count=counts.get("medium", 0),
            low_count=counts.get("low", 0),
            info_count=counts.get("info", 0),
            resolved_count=counts.get("resolved", 0),
            attention_count=counts.get("high", 0) + counts.get("medium", 0),
            opportunity_count=counts.get("opportunities", 0),
            coverage=[
                DomainCoverage.model_validate(c) for c in (state.coverage or [])
            ],
            insights=[self._to_schema(r) for r in active],
            radar_version=state.radar_version,
        )

    # ── Insight lifecycle ────────────────────────────────────────────

    async def list_insights(
        self,
        user_id: uuid.UUID,
        *,
        statuses: Sequence[str] | None = None,
        severities: Sequence[str] | None = None,
        insight_types: Sequence[str] | None = None,
        categories: Sequence[str] | None = None,
        entity_type: str | None = None,
        created_after: datetime | None = None,
        created_before: datetime | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> RadarInsightListResponse:
        self._validate_filters(statuses, severities, insight_types, categories)
        rows, total = await self._insights.list_for_user(
            user_id,
            statuses=statuses,
            severities=severities,
            insight_types=insight_types,
            categories=categories,
            entity_type=entity_type,
            created_after=created_after,
            created_before=created_before,
            skip=skip,
            limit=limit,
        )
        return RadarInsightListResponse(
            items=[self._to_schema(r) for r in rows],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def get_insight(
        self, user_id: uuid.UUID, insight_id: uuid.UUID
    ) -> RadarInsight:
        row = await self._insights.get_for_user(user_id, insight_id)
        if row is None:
            raise RadarError.not_found(insight_id)
        return self._to_schema(row)

    async def mark_seen(
        self, user_id: uuid.UUID, insight_id: uuid.UUID
    ) -> RadarInsight:
        row = await self._require(user_id, insight_id)
        if row.status == InsightStatus.ACTIVE.value:
            row.status = InsightStatus.SEEN.value
            row.seen_at = datetime.now(timezone.utc)
            await self._session.flush()
        return self._to_schema(row)

    async def dismiss(
        self, user_id: uuid.UUID, insight_id: uuid.UUID
    ) -> RadarInsight:
        row = await self._require(user_id, insight_id)
        if row.status in (InsightStatus.ACTIVE.value, InsightStatus.SEEN.value):
            row.status = InsightStatus.DISMISSED.value
            row.dismissed_at = datetime.now(timezone.utc)
            await self._session.flush()
        return self._to_schema(row)

    # ── Internals ────────────────────────────────────────────────────

    def _run_detectors(
        self, ctx: RadarContext
    ) -> tuple[list[RadarFinding], set[InsightType]]:
        """Run detectors whose required domains are available."""
        findings: list[RadarFinding] = []
        ran: set[InsightType] = set()
        for insight_type, definition in INSIGHT_REGISTRY.items():
            if not set(definition.required_domains) <= ctx.data_available:
                continue
            detector = DETECTOR_FUNCS.get(definition.detector)
            if detector is None:
                continue
            ran.add(insight_type)
            try:
                findings.extend(detector(ctx))
            except Exception:
                logger.exception(
                    "Radar detector failed",
                    extra={"detector": definition.detector},
                )
        return findings, ran

    async def _upsert_finding(
        self,
        user_id: uuid.UUID,
        finding: RadarFinding,
        now: datetime,
    ) -> RadarInsightRow | None:
        """Dedup by fingerprint; update, reopen, or insert."""
        finding.fingerprint = self._fingerprint(user_id, finding)
        row = await self._insights.get_by_fingerprint(user_id, finding.fingerprint)

        payload = self._row_payload(finding)
        if row is None:
            row = RadarInsightRow(user_id=user_id, **payload)
            await self._insights.create(row)
            return row

        # Existing row — refresh fields; status transitions stay owned by
        # the lifecycle (a persisted DISMISSED/RESOLVED must not be clobbered
        # by the detector's default "ACTIVE").
        for key, value in payload.items():
            if key in {"fingerprint", "status"}:
                continue
            setattr(row, key, value)
        if row.status == InsightStatus.RESOLVED.value:
            # The same condition returned — reopen as a fresh ACTIVE row.
            row.status = InsightStatus.ACTIVE.value
            row.resolved_at = None
            row.seen_at = None
            row.dismissed_at = None
        # ACTIVE/SEEN keep their state; DISMISSED stays dismissed.
        row.updated_at = now
        await self._session.flush()
        return row

    async def _resolve_stale(
        self,
        user_id: uuid.UUID,
        found_fingerprints: set[str],
        ran_types: set[InsightType],
        now: datetime,
    ) -> None:
        """Resolve open insights whose condition no longer holds.

        Only insights from detectors that actually ran this scan are
        eligible — a detector skipped for missing data must not resolve
        its historical rows.
        """
        for insight_type in ran_types:
            open_rows = await self._insights.list_open_for_user(
                user_id, insight_type=insight_type.value
            )
            for row in open_rows:
                if row.fingerprint not in found_fingerprints:
                    row.status = InsightStatus.RESOLVED.value
                    row.resolved_at = now
                    row.updated_at = now
        await self._session.flush()

    async def _require(
        self, user_id: uuid.UUID, insight_id: uuid.UUID
    ) -> RadarInsightRow:
        row = await self._insights.get_for_user(user_id, insight_id)
        if row is None:
            raise RadarError.not_found(insight_id)
        return row

    # ── Fingerprint / serialisation ─────────────────────────────────

    @staticmethod
    def _fingerprint(user_id: uuid.UUID, finding: RadarFinding) -> str:
        """Stable dedup key: identity + detector version + quantized state.

        The ``state_key`` bucket means a materially changed condition
        hashes differently → a fresh insight instance, while an identical
        condition lands on the same row.
        """
        material = "|".join(
            [
                str(user_id),
                finding.insight_type.value,
                finding.entity_type or "",
                finding.entity_id or "",
                (finding.source.detector_version if finding.source else ""),
                finding.state_key,
            ]
        )
        return hashlib.sha256(material.encode("utf-8")).hexdigest()

    @staticmethod
    def _row_payload(finding: RadarFinding) -> dict[str, Any]:
        return {
            "insight_type": finding.insight_type.value,
            "status": InsightStatus.ACTIVE.value,
            "severity": finding.severity.value,
            "category": finding.category.value,
            "title": finding.title,
            "summary": finding.summary,
            "entity_type": finding.entity_type,
            "entity_id": finding.entity_id,
            "entity_name": finding.entity_name,
            "evidence": [e.model_dump(mode="json") for e in finding.evidence],
            "impact": finding.impact.model_dump(mode="json"),
            "explanation": list(finding.explanation),
            "actions": [a.model_dump(mode="json") for a in finding.actions],
            "source": (
                finding.source.model_dump(mode="json") if finding.source else {}
            ),
            "data_quality": finding.data_quality.value,
            "freshness": finding.freshness.model_dump(mode="json"),
            "fingerprint": finding.fingerprint,
            "state_signature": finding.state_key,
            "detector_version": (
                finding.source.detector_version if finding.source else RADAR_VERSION
            ),
        }

    @staticmethod
    def _to_schema(row: RadarInsightRow) -> RadarInsight:
        return RadarInsight.model_validate(
            {
                "id": row.id,
                "insight_type": row.insight_type,
                "status": row.status,
                "severity": row.severity,
                "category": row.category,
                "title": row.title,
                "summary": row.summary,
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "entity_name": row.entity_name,
                "evidence": row.evidence or [],
                "impact": row.impact or {},
                "explanation": row.explanation or [],
                "actions": row.actions or [],
                "source": row.source or None,
                "data_quality": row.data_quality,
                "freshness": row.freshness or {},
                "detector_version": row.detector_version,
                "generated_at": row.created_at,
                "updated_at": row.updated_at,
                "seen_at": row.seen_at,
                "dismissed_at": row.dismissed_at,
                "resolved_at": row.resolved_at,
            }
        )

    @staticmethod
    def _counts(active: list[RadarInsightRow]) -> dict[str, int]:
        counts = {
            "active": len(active),
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0,
            "opportunities": 0,
        }
        for row in active:
            key = row.severity.lower()
            if key in counts:
                counts[key] += 1
            definition = INSIGHT_REGISTRY.get(_safe_type(row.insight_type))
            if definition and definition.group in _OPPORTUNITY_GROUPS:
                counts["opportunities"] += 1
        return counts

    @staticmethod
    def _validate_filters(
        statuses, severities, insight_types, categories
    ) -> None:
        valid = {
            "status": (statuses, {s.value for s in InsightStatus}),
            "severity": (severities, {s.value for s in InsightSeverity}),
            "insight_type": (insight_types, {t.value for t in InsightType}),
        }
        for field_name, (values, allowed) in valid.items():
            if values:
                invalid = [v for v in values if v not in allowed]
                if invalid:
                    raise RadarError.invalid_filter(field_name)


def _safe_type(value: str) -> InsightType | None:
    try:
        return InsightType(value)
    except ValueError:
        return None
