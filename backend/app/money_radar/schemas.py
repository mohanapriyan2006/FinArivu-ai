"""Typed contracts for Money Radar (Phase 3).

Two layers of models:

* ``RadarFinding`` — the internal detector output (never persisted raw;
  the service validates + fingerprints it before upserting).
* Wire models — ``RadarInsight`` / ``RadarSummary`` / coverage + filter
  schemas returned by ``/v1/money-radar/*``.

Every numeric value in ``evidence`` is produced by a stored record or a
deterministic engine — the LLM layer may only rephrase, never compute.
All models serialise camelCase via ``BaseSchema``.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import Field

from app.money_radar.radar_types import (
    DataAvailability,
    FreshnessStatus,
    InsightActionKind,
    InsightCategory,
    InsightSeverity,
    InsightStatus,
    InsightType,
)
from app.schemas.base import BaseSchema


# ── Evidence / explanation primitives ─────────────────────────────────────


class EvidenceItem(BaseSchema):
    """One labelled, sourced number or fact supporting an insight."""

    key: str
    label: str
    value: Any = None
    unit: str | None = None          # "currency" | "percent" | "months" | "date" | "count"
    source: str | None = None        # e.g. "ExpenseRepository", "BudgetEngine"


class DataFreshness(BaseSchema):
    """When the underlying source data was last updated."""

    updated_at: datetime | None = None
    age_days: int | None = None
    status: FreshnessStatus = FreshnessStatus.UNKNOWN


class InsightSource(BaseSchema):
    """Provenance — which deterministic systems produced this insight."""

    detector: str                    # detector key, e.g. "spending_spike"
    detector_version: str
    engines: list[str] = Field(default_factory=list)      # e.g. ["BudgetEngine"]
    repositories: list[str] = Field(default_factory=list)  # e.g. ["ExpenseRepository"]


class InsightImpact(BaseSchema):
    """Headline metric for an insight card — before/after/change."""

    metric_label: str = ""
    before: Any = None
    after: Any = None
    change: Any = None
    unit: str | None = None
    description: str = ""


# ── Typed next-step actions ────────────────────────────────────────────────


class ScenarioPreset(BaseSchema):
    """Phase 2 handoff — posted verbatim to ``/v1/scenarios/run``."""

    scenario_type: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    title: str = ""
    source_insight_id: str | None = None


class ActionIntent(BaseSchema):
    """Phase 1 handoff — posted verbatim to ``/v1/copilot/actions/preview``."""

    operation: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class InsightAction(BaseSchema):
    """A contextual next step attached to an insight."""

    kind: InsightActionKind
    label: str
    # VIEW → canonical navigation target key (see actionRoutes.ts).
    route: str | None = None
    scenario: ScenarioPreset | None = None     # RUN_SCENARIO
    action: ActionIntent | None = None         # PREVIEW_ACTION


# ── Internal detector output ───────────────────────────────────────────────


@dataclass
class RadarFinding:
    """What a detector emits before persistence/dedup.

    ``state_key`` is a coarse quantisation of the dominant metric — it feeds
    the fingerprint so a materially changed condition produces a new insight
    while identical conditions deduplicate onto the same row.
    """

    insight_type: InsightType
    severity: InsightSeverity
    title: str
    summary: str
    category: InsightCategory
    entity_type: str | None = None       # "category" | "budget" | "goal" | "loan" | "user"
    entity_id: str | None = None
    entity_name: str = ""
    evidence: list[EvidenceItem] = field(default_factory=list)
    impact: InsightImpact = field(default_factory=InsightImpact)
    explanation: list[str] = field(default_factory=list)
    actions: list[InsightAction] = field(default_factory=list)
    source: InsightSource | None = None
    data_quality: DataAvailability = DataAvailability.AVAILABLE
    freshness: DataFreshness = field(default_factory=DataFreshness)
    state_key: str = ""                  # quantized dominant metric
    fingerprint: str = ""                # filled by the service


# ── Wire models ────────────────────────────────────────────────────────────


class RadarInsight(BaseSchema):
    """Canonical persisted insight returned by the API."""

    id: UUID
    insight_type: InsightType
    status: InsightStatus
    severity: InsightSeverity
    category: InsightCategory | None = None
    title: str = ""
    summary: str = ""
    entity_type: str | None = None
    entity_id: str | None = None
    entity_name: str = ""
    evidence: list[EvidenceItem] = Field(default_factory=list)
    impact: InsightImpact = Field(default_factory=InsightImpact)
    explanation: list[str] = Field(default_factory=list)
    actions: list[InsightAction] = Field(default_factory=list)
    source: InsightSource | None = None
    data_quality: DataAvailability = DataAvailability.AVAILABLE
    freshness: DataFreshness = Field(default_factory=DataFreshness)
    detector_version: str = ""
    generated_at: datetime | None = None
    updated_at: datetime | None = None
    seen_at: datetime | None = None
    dismissed_at: datetime | None = None
    resolved_at: datetime | None = None


class DomainCoverage(BaseSchema):
    """Per-domain availability reported to the UI — honest coverage."""

    domain: str                        # e.g. "expenses", "budgets"
    availability: DataAvailability
    detectors: list[str] = Field(default_factory=list)
    updated_at: datetime | None = None
    freshness: FreshnessStatus = FreshnessStatus.UNKNOWN
    note: str = ""


class RadarSummary(BaseSchema):
    """Result of a radar scan / the persisted summary surface."""

    generated_at: datetime
    never_scanned: bool = False
    active_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    resolved_count: int = 0
    attention_count: int = 0            # HIGH+MEDIUM
    opportunity_count: int = 0
    coverage: list[DomainCoverage] = Field(default_factory=list)
    insights: list[RadarInsight] = Field(default_factory=list)
    radar_version: str = ""


class RadarInsightListResponse(BaseSchema):
    """Paginated insight history."""

    items: list[RadarInsight] = Field(default_factory=list)
    total: int = 0
    skip: int = 0
    limit: int = 50


# Filters accepted by GET /insights — all optional, all validated.
InsightStatusFilter = InsightStatus
InsightSeverityFilter = InsightSeverity
InsightTypeFilter = InsightType
InsightCategoryFilter = InsightCategory
SortOrder = Literal["severity", "recent"]
