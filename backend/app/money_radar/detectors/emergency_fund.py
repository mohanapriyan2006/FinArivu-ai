"""EMERGENCY_FUND_RISK — recorded reserve below the target runway.

Only runs when real savings assets exist (``savings`` domain) AND a
monthly expense figure exists to measure runway against. A missing
reserve is reported as a coverage gap, never as ₹0.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_CEILING

from app.money_radar import thresholds as T
from app.money_radar.context import RadarContext
from app.money_radar.detectors.base import base_finding, inr
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
    ScenarioPreset,
)


def detect(ctx: RadarContext) -> list[RadarFinding]:
    monthly_need = ctx.avg_monthly_expenses or ctx.monthly_estimate
    if ctx.emergency_fund is None or monthly_need is None or monthly_need <= 0:
        return []

    reserve = ctx.emergency_fund
    runway = reserve / monthly_need
    target = T.EMERGENCY_FUND_TARGET_MONTHS

    if runway >= target:
        return []

    severity = (
        InsightSeverity.HIGH
        if runway < T.EMERGENCY_FUND_MEDIUM_MONTHS
        else InsightSeverity.MEDIUM
    )
    gap = target * monthly_need - reserve
    monthly_top_up = (gap / 12).to_integral_value(rounding=ROUND_CEILING)

    evidence = [
        EvidenceItem(
            key="reserve",
            label="Emergency reserve",
            value=float(reserve),
            unit="currency",
            source="AssetRepository",
        ),
        EvidenceItem(
            key="monthly_need",
            label="Monthly expense estimate",
            value=float(monthly_need),
            unit="currency",
            source="ExpenseRepository",
        ),
        EvidenceItem(
            key="runway",
            label="Runway",
            value=float(runway),
            unit="months",
        ),
        EvidenceItem(
            key="target",
            label="Target runway",
            value=float(target),
            unit="months",
        ),
    ]
    if ctx.savings_total is not None and ctx.savings_total > reserve:
        evidence.append(
            EvidenceItem(
                key="other_savings",
                label="Other recorded savings",
                value=float(ctx.savings_total - reserve),
                unit="currency",
                source="AssetRepository",
            )
        )

    finding = base_finding(
        InsightType.EMERGENCY_FUND_RISK,
        severity=severity,
        title="Emergency reserve below target",
        summary=(
            f"Your emergency reserve covers {runway:.1f} months of expenses "
            f"— below the {int(target)}-month target."
        ),
        evidence=evidence,
        explanation=[
            f"Recorded emergency savings of {inr(reserve)} against ~{inr(monthly_need)} monthly expenses gives a {runway:.1f}-month runway.",
            "Closing the gap matters more than its label — simulate a monthly contribution that reaches the target in a year.",
        ],
        state_key=f"{severity.value}:{int(runway * 10)}",
    )
    finding.impact = InsightImpact(
        metric_label="Runway",
        before=float(target),
        after=float(runway),
        change=float(runway - target),
        unit="months",
        description=f"{runway:.1f} months vs {int(target)}-month target",
    )
    finding.actions = [
        InsightAction(
            kind=InsightActionKind.RUN_SCENARIO,
            label=f"Simulate +{inr(monthly_top_up)}/month",
            scenario=ScenarioPreset(
                scenario_type="EMERGENCY_FUND_TARGET_CHANGE",
                parameters={
                    "target_months": int(target),
                    "monthly_contribution": float(monthly_top_up),
                },
                title="Emergency fund to 6 months",
            ),
        ),
        InsightAction(
            kind=InsightActionKind.VIEW, label="View savings", route="savings"
        ),
        InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
    ]
    finding.freshness = ctx.freshness_for("savings")
    return [finding]
