"""NETWORTH_CHANGE — material movement between real persisted snapshots.

Requires at least two ``net_worth_history`` snapshots on different dates
(≥ ``NETWORTH_MIN_SNAPSHOT_GAP_DAYS`` apart). History is accumulated by
scans themselves — if only one snapshot exists the detector reports no
trend rather than fabricating one.
"""

from __future__ import annotations

from decimal import Decimal

from app.money_radar import thresholds as T
from app.money_radar.context import RadarContext
from app.money_radar.detectors.base import base_finding, inr, pct
from app.money_radar.radar_types import (
    InsightActionKind,
    InsightSeverity,
    InsightType,
)
from app.money_radar.schemas import (
    EvidenceItem,
    InsightAction,
    InsightImpact,
    RadarFinding,
)


def detect(ctx: RadarContext) -> list[RadarFinding]:
    history = ctx.net_worth_history  # newest first
    if len(history) < 2:
        return []

    latest = history[0]
    previous = next(
        (
            h
            for h in history[1:]
            if (latest["snapshot_date"] - h["snapshot_date"]).days
            >= T.NETWORTH_MIN_SNAPSHOT_GAP_DAYS
        ),
        None,
    )
    if previous is None:
        return []

    change = latest["net_worth"] - previous["net_worth"]
    prev_nw = previous["net_worth"]
    rel = change / abs(prev_nw) if prev_nw != 0 else None

    if abs(change) < T.NETWORTH_MIN_ABSOLUTE_CHANGE and (
        rel is None or abs(rel) < T.NETWORTH_MIN_RELATIVE_CHANGE
    ):
        return []

    delta_assets = latest["total_assets"] - previous["total_assets"]
    delta_liabilities = latest["total_liabilities"] - previous["total_liabilities"]

    if change < 0:
        severity = (
            InsightSeverity.MEDIUM
            if rel is not None and abs(rel) >= Decimal("0.05")
            else InsightSeverity.LOW
        )
    else:
        severity = InsightSeverity.INFO

    direction = "up" if change > 0 else "down"
    days = (latest["snapshot_date"] - previous["snapshot_date"]).days

    finding = base_finding(
        InsightType.NETWORTH_CHANGE,
        severity=severity,
        title=f"Net worth {direction} {inr(abs(change))}",
        summary=(
            f"Net worth moved from {inr(prev_nw)} to {inr(latest['net_worth'])} "
            f"over {days} days ({pct(rel) if rel is not None else '—'})."
        ),
        evidence=[
            EvidenceItem(
                key="previous",
                label=f"{previous['snapshot_date'].isoformat()}",
                value=float(prev_nw),
                unit="currency",
                source="NetWorthEngine",
            ),
            EvidenceItem(
                key="latest",
                label=f"{latest['snapshot_date'].isoformat()}",
                value=float(latest["net_worth"]),
                unit="currency",
                source="NetWorthEngine",
            ),
            EvidenceItem(
                key="change",
                label="Change",
                value=float(change),
                unit="currency",
            ),
            EvidenceItem(
                key="delta_assets",
                label="Assets Δ",
                value=float(delta_assets),
                unit="currency",
                source="AssetRepository",
            ),
            EvidenceItem(
                key="delta_liabilities",
                label="Liabilities Δ",
                value=float(delta_liabilities),
                unit="currency",
                source="LiabilityRepository",
            ),
        ],
        explanation=[
            f"Computed from two recorded snapshots {days} days apart — not a projected trend.",
            (
                f"Drivers: assets {inr(delta_assets)}, liabilities {inr(delta_liabilities)}."
            ),
        ],
        state_key=f"{direction}:{int(abs(change) / 10000)}",
    )
    finding.impact = InsightImpact(
        metric_label="Net worth",
        before=float(prev_nw),
        after=float(latest["net_worth"]),
        change=float(change),
        unit="currency",
        description=f"{inr(change)} over {days} days",
    )
    finding.actions = [
        InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
    ]
    finding.freshness = ctx.freshness_for("net_worth")
    return [finding]
