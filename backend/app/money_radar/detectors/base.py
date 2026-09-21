"""Shared detector primitives.

A detector is a pure function ``detect(ctx) -> list[RadarFinding]`` — it
reads only the pre-loaded ``RadarContext`` and never touches the database.
Thresholds come from ``app.money_radar.thresholds``; provenance metadata
from ``INSIGHT_REGISTRY``.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Callable, Protocol

from app.money_radar.context import RadarContext
from app.money_radar.radar_types import InsightType
from app.money_radar.registry import INSIGHT_REGISTRY
from app.money_radar.schemas import (
    EvidenceItem,
    InsightSource,
    RadarFinding,
)


class Detector(Protocol):
    """Detector contract — deterministic, side-effect free."""

    def __call__(self, ctx: RadarContext) -> list[RadarFinding]: ...


def base_finding(
    insight_type: InsightType,
    *,
    severity,
    title: str,
    summary: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    entity_name: str = "",
    evidence: list[EvidenceItem] | None = None,
    explanation: list[str] | None = None,
    state_key: str = "",
) -> RadarFinding:
    """Build a finding pre-populated with registry metadata."""
    definition = INSIGHT_REGISTRY[insight_type]
    return RadarFinding(
        insight_type=insight_type,
        severity=severity,
        title=title,
        summary=summary,
        category=definition.category,
        entity_type=entity_type if entity_type is not None else definition.entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        evidence=evidence or [],
        explanation=explanation or [],
        source=InsightSource(
            detector=definition.detector,
            detector_version=definition.detector_version,
            engines=list(definition.source_engines),
            repositories=list(definition.source_repositories),
        ),
        state_key=state_key,
    )


def pct_change(current: Decimal, baseline: Decimal) -> Decimal | None:
    """Relative change (current − baseline)/baseline — None if no baseline."""
    if baseline <= 0:
        return None
    return (current - baseline) / baseline


def inr(amount: Decimal | float | int | None) -> str:
    """Compact INR rendering for evidence text (₹1,25,000 style)."""
    if amount is None:
        return "—"
    value = float(amount)
    sign = "-" if value < 0 else ""
    value = abs(value)
    if value >= 1_00_00_000:
        return f"{sign}₹{value / 1_00_00_000:.1f}Cr"
    if value >= 1_00_000:
        return f"{sign}₹{value / 1_00_000:.1f}L"
    return f"{sign}₹{value:,.0f}"


def pct(value: Decimal | float | None) -> str:
    if value is None:
        return "—"
    return f"{float(value) * 100:.0f}%"


DETECTOR_FUNCS: dict[str, Callable[[RadarContext], list[RadarFinding]]] = {}
