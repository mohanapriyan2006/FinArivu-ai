"""Controlled vocabularies for Money Radar (Phase 3).

Every insight type, status, severity, data-quality and error code used by
the radar layer lives here — no free-form strings elsewhere. Money Radar is
a deterministic detection layer: the LLM never decides whether an insight
exists, its severity, or any number shown in evidence.
"""

from __future__ import annotations

from enum import Enum


class InsightType(str, Enum):
    """Canonical Money Radar detector vocabulary.

    A type only produces insights when ``INSIGHT_REGISTRY`` declares it AND
    the underlying repository data can actually support the detection —
    missing data surfaces as coverage gaps, never as fabricated numbers.
    """

    SPENDING_SPIKE = "SPENDING_SPIKE"
    BUDGET_RISK = "BUDGET_RISK"
    CASHFLOW_RISK = "CASHFLOW_RISK"
    GOAL_DELAY = "GOAL_DELAY"
    DEBT_OPPORTUNITY = "DEBT_OPPORTUNITY"
    EMERGENCY_FUND_RISK = "EMERGENCY_FUND_RISK"
    TAX_OPPORTUNITY = "TAX_OPPORTUNITY"
    RECURRING_COST = "RECURRING_COST"
    NETWORTH_CHANGE = "NETWORTH_CHANGE"


class InsightStatus(str, Enum):
    """Persisted lifecycle of a Money Radar insight."""

    ACTIVE = "ACTIVE"
    SEEN = "SEEN"
    DISMISSED = "DISMISSED"
    RESOLVED = "RESOLVED"


class InsightSeverity(str, Enum):
    """Deterministic severity — computed from evidence, never by an LLM."""

    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class InsightCategory(str, Enum):
    """Display grouping for the radar surface."""

    SPENDING = "spending"
    BUDGET = "budget"
    CASH_FLOW = "cash_flow"
    GOALS = "goals"
    DEBT = "debt"
    SAVINGS = "savings"
    TAX = "tax"
    NET_WORTH = "net_worth"


class InsightActionKind(str, Enum):
    """Typed next-step actions an insight may expose.

    ``RUN_SCENARIO`` hands off to Phase 2 (Scenario Lab) via a typed
    ``ScenarioPreset``. ``PREVIEW_ACTION`` hands off to Phase 1 (Action
    Copilot) via a typed ``ActionIntent`` — insights never mutate directly.
    """

    VIEW = "VIEW"
    EXPLAIN = "EXPLAIN"
    RUN_SCENARIO = "RUN_SCENARIO"
    PREVIEW_ACTION = "PREVIEW_ACTION"


class DataAvailability(str, Enum):
    """Whether the data behind an insight/domain exists and is usable.

    ``MISSING`` means "not recorded" — never render it as a zero value.
    """

    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    STALE = "STALE"
    MISSING = "MISSING"
    UNSUPPORTED = "UNSUPPORTED"


class FreshnessStatus(str, Enum):
    """How fresh the underlying source data is."""

    FRESH = "FRESH"
    RECENT = "RECENT"
    STALE = "STALE"
    UNKNOWN = "UNKNOWN"


class RadarErrorCode(str, Enum):
    """Controlled error categories — never expose raw stack traces."""

    INSIGHT_NOT_FOUND = "INSIGHT_NOT_FOUND"
    INVALID_INSIGHT = "INVALID_INSIGHT"
    INVALID_FILTER = "INVALID_FILTER"
    RADAR_SCAN_FAILED = "RADAR_SCAN_FAILED"


# Detector versions — bump when a detector's logic/thresholds change so
# historical insights stay interpretable.
DETECTOR_VERSIONS: dict[InsightType, str] = {
    InsightType.SPENDING_SPIKE: "spending_spike_v1",
    InsightType.BUDGET_RISK: "budget_risk_v1",
    InsightType.CASHFLOW_RISK: "cashflow_risk_v1",
    InsightType.GOAL_DELAY: "goal_delay_v1",
    InsightType.DEBT_OPPORTUNITY: "debt_opportunity_v1",
    InsightType.EMERGENCY_FUND_RISK: "emergency_fund_v1",
    InsightType.TAX_OPPORTUNITY: "tax_opportunity_v1",
    InsightType.RECURRING_COST: "recurring_cost_v1",
    InsightType.NETWORTH_CHANGE: "networth_change_v1",
}

RADAR_VERSION = "money_radar_v1"
