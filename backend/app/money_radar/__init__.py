"""Money Radar — deterministic proactive financial intelligence (Phase 3).

Composes existing repositories and engines into evidence-backed insights.
The detection layer never mutates financial records; the only mutation
path is the Phase 1 Action Copilot, and the only simulation path is the
Phase 2 Scenario Lab.
"""

from app.money_radar.radar_types import (
    DataAvailability,
    FreshnessStatus,
    InsightActionKind,
    InsightCategory,
    InsightSeverity,
    InsightStatus,
    InsightType,
    RADAR_VERSION,
)
from app.money_radar.registry import INSIGHT_REGISTRY, get_insight_definition
from app.money_radar.service import MoneyRadarService

__all__ = [
    "DataAvailability",
    "FreshnessStatus",
    "InsightActionKind",
    "InsightCategory",
    "InsightSeverity",
    "InsightStatus",
    "InsightType",
    "RADAR_VERSION",
    "INSIGHT_REGISTRY",
    "get_insight_definition",
    "MoneyRadarService",
]
