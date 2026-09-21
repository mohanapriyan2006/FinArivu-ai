"""Typed contracts for the Financial Action Plan (Phase 4).

Two layers, matching the Money Radar pattern:

* ``PlanCandidate`` — internal candidate produced by CandidateBuilder
  (never persisted raw; the service fingerprints + dedups it first).
* Wire models — ``FinancialPlanItemOut`` / ``FinancialActionPlanOut``
  returned by ``/v1/action-plan/*``.

Every evidence/impact number comes from a persisted Money Radar insight or
a deterministic engine — the plan layer only organises them. All models
serialise camelCase via ``BaseSchema``.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from uuid import UUID

from pydantic import Field

from app.money_radar.schemas import (
    ActionIntent,
    DataFreshness,
    EvidenceItem,
    InsightImpact,
    ScenarioPreset,
)
from app.schemas.base import BaseSchema
from app.action_plan.plan_types import (
    CompletionSource,
    PlanItemCategory,
    PlanItemPriority,
    PlanItemSource,
    PlanItemStatus,
    PlanStatus,
    SnoozeOption,
)


# ── Actions a plan item may expose ─────────────────────────────────────────


class PlanItemAction(str, Enum):
    """Contextual operations available on a plan item (§22)."""

    DO_NOW = "DO_NOW"                # navigate to the review screen
    SIMULATE = "SIMULATE"            # → Scenario Lab preset
    PREVIEW_ACTION = "PREVIEW_ACTION"  # → Phase 1 action preview
    COMPLETE = "COMPLETE"
    SNOOZE = "SNOOZE"
    DISMISS = "DISMISS"


# ── Internal candidate (detector output → selector input) ──────────────────


@dataclass
class PlanCandidate:
    """A proposed plan item before persistence.

    ``fingerprint`` encodes user + source + category + entity + state key so
    repeated generation updates the same row instead of duplicating.
    """

    category: PlanItemCategory
    source_type: PlanItemSource
    title: str
    summary: str
    priority: PlanItemPriority = PlanItemPriority.LOW
    score: float = 0.0               # deterministic ranking score
    source_insight_id: str | None = None
    source_insight_type: str | None = None
    source_id: str | None = None     # e.g. radar insight id / goal id
    entity_type: str | None = None
    entity_id: str | None = None
    entity_name: str = ""
    evidence: list[EvidenceItem] = field(default_factory=list)
    impact: InsightImpact = field(default_factory=InsightImpact)
    why: list[str] = field(default_factory=list)   # "why is this in my plan"
    actions: list[PlanItemAction] = field(default_factory=list)
    route: str | None = None                       # DO_NOW navigation target
    scenario_preset: ScenarioPreset | None = None  # SIMULATE payload
    action_preset: ActionIntent | None = None      # PREVIEW_ACTION payload
    due_window: str = "THIS_WEEK"                  # TODAY | THIS_WEEK | NEXT_WEEK
    data_quality: str = "AVAILABLE"
    freshness: DataFreshness = field(default_factory=DataFreshness)
    state_signature: str = ""        # dominant-metric bucket (anti-noise)
    fingerprint: str = ""            # filled by the service


# ── Wire models ────────────────────────────────────────────────────────────


class FinancialPlanItemOut(BaseSchema):
    """Canonical persisted plan item returned by the API."""

    id: UUID
    plan_id: UUID
    title: str = ""
    summary: str = ""
    category: PlanItemCategory
    priority: PlanItemPriority
    status: PlanItemStatus
    source_type: PlanItemSource = PlanItemSource.SYSTEM
    source_insight_id: UUID | None = None
    source_insight_type: str | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    entity_name: str = ""
    evidence: list[EvidenceItem] = Field(default_factory=list)
    impact: InsightImpact = Field(default_factory=InsightImpact)
    why: list[str] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)
    route: str | None = None
    scenario_preset: ScenarioPreset | None = None
    action_preset: ActionIntent | None = None
    due_window: str | None = None
    data_quality: str = "AVAILABLE"
    freshness: DataFreshness = Field(default_factory=DataFreshness)
    score: float = 0.0
    completion_source: CompletionSource | None = None
    linked_action_execution_id: UUID | None = None
    linked_scenario_run_id: UUID | None = None
    dismissed_count: int = 0
    snoozed_until: datetime | None = None
    completed_at: datetime | None = None
    dismissed_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class FinancialActionPlanOut(BaseSchema):
    """The weekly plan container returned to the client."""

    id: UUID
    period_start: date
    period_end: date
    status: PlanStatus
    generated_at: datetime
    updated_at: datetime
    generation_version: int = 1
    summary: str = ""
    items: list[FinancialPlanItemOut] = Field(default_factory=list)
    completed_count: int = 0
    active_count: int = 0
    deferred_count: int = 0          # snoozed
    dismissed_count: int = 0
    plan_version: str = ""           # deterministic plan engine version


class PlanHistoryEntry(BaseSchema):
    """Compact historical plan row."""

    id: UUID
    period_start: date
    period_end: date
    status: PlanStatus
    generated_at: datetime
    active_count: int = 0
    completed_count: int = 0
    dismissed_count: int = 0


class SnoozeItemRequest(BaseSchema):
    """Snooze payload — a fixed option resolved server-side."""

    option: SnoozeOption


class CompleteItemRequest(BaseSchema):
    """Complete payload — optional Phase 1 execution link for audit."""

    execution_id: UUID | None = None


class AddInsightRequest(BaseSchema):
    """Radar → Plan bridge — add a radar insight as a plan item."""

    insight_id: UUID
