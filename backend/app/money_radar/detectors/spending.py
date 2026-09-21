"""SPENDING_SPIKE — unusual month-to-date spend vs the trailing baseline.

Comparison is pro-rated: month-to-date spend is compared against the
baseline scaled by the fraction of the month elapsed, so early-month
scans are not penalised and late-month scans are not flattered.
"""

from __future__ import annotations

from decimal import Decimal

from app.money_radar import thresholds as T
from app.money_radar.context import RadarContext
from app.money_radar.detectors.base import base_finding, inr, pct, pct_change
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

# Minimum month progress before comparing — first week is too noisy.
_MIN_ELAPSED = Decimal("0.25")


def detect(ctx: RadarContext) -> list[RadarFinding]:
    current = ctx.current_month
    if current is None or not ctx.baseline_months:
        return []
    if current.elapsed_ratio < _MIN_ELAPSED:
        return []

    findings: list[RadarFinding] = []
    n_baseline = Decimal(len(ctx.baseline_months))
    categories = set(current.by_category)

    for cat_id in categories:
        name = ctx.category_names.get(cat_id, "This category")
        current_spend = current.by_category[cat_id]
        baseline_total = sum(
            (m.by_category.get(cat_id, Decimal("0")) for m in ctx.baseline_months),
            Decimal("0"),
        )
        if baseline_total <= 0:
            continue  # no history for this category — nothing to compare
        baseline_avg = baseline_total / n_baseline
        expected_to_date = baseline_avg * current.elapsed_ratio
        if expected_to_date <= 0:
            continue

        rel = pct_change(current_spend, expected_to_date)
        abs_change = current_spend - expected_to_date
        if rel is None:
            continue
        if rel < T.SPENDING_SPIKE_MIN_RELATIVE or abs_change < T.SPENDING_SPIKE_MIN_ABSOLUTE:
            continue

        if rel >= T.SPENDING_SPIKE_HIGH_RELATIVE:
            severity = InsightSeverity.HIGH
        elif rel >= T.SPENDING_SPIKE_MEDIUM_RELATIVE:
            severity = InsightSeverity.MEDIUM
        else:
            severity = InsightSeverity.LOW

        finding = base_finding(
            InsightType.SPENDING_SPIKE,
            severity=severity,
            title=f"{name} spending spike",
            summary=(
                f"{name} spend is {inr(current_spend)} so far this month — "
                f"{pct(rel)} above the expected {inr(expected_to_date)} "
                f"based on your {len(ctx.baseline_months)}-month average."
            ),
            entity_id=cat_id,
            entity_name=name,
            evidence=[
                EvidenceItem(
                    key="current_spend",
                    label="This month so far",
                    value=float(current_spend),
                    unit="currency",
                    source="ExpenseRepository",
                ),
                EvidenceItem(
                    key="expected_to_date",
                    label="Expected by now",
                    value=float(expected_to_date),
                    unit="currency",
                    source="ExpenseRepository",
                ),
                EvidenceItem(
                    key="baseline_avg",
                    label=f"{len(ctx.baseline_months)}-month average",
                    value=float(baseline_avg),
                    unit="currency",
                    source="ExpenseRepository",
                ),
                EvidenceItem(
                    key="relative_change",
                    label="Above expected",
                    value=float(rel),
                    unit="percent",
                ),
                EvidenceItem(
                    key="window",
                    label="Comparison window",
                    value=f"{current.elapsed_ratio:.0%} of month vs {len(ctx.baseline_months)}-month baseline",
                ),
            ],
            explanation=[
                f"{name} spending is {pct(rel)} above what your recent history predicts for this point in the month.",
                f"Baseline is the average of your last {len(ctx.baseline_months)} complete months, scaled to {current.elapsed_ratio:.0%} of the current month.",
            ],
            state_key=f"{cat_id}:{severity.value}:{int(rel * 10)}",
        )
        finding.impact = InsightImpact(
            metric_label="Month-to-date spend",
            before=float(expected_to_date),
            after=float(current_spend),
            change=float(abs_change),
            unit="currency",
            description=f"{pct(rel)} above expected",
        )
        finding.actions = [
            InsightAction(
                kind=InsightActionKind.RUN_SCENARIO,
                label=f"Simulate {inr(baseline_avg)} spend",
                scenario=ScenarioPreset(
                    scenario_type="CATEGORY_SPENDING_CHANGE",
                    parameters={
                        "category_name": name,
                        "change_type": "set",
                        "change_value": float(baseline_avg),
                    },
                    title=f"{name} back to baseline",
                ),
            ),
            InsightAction(
                kind=InsightActionKind.VIEW,
                label="View expenses",
                route="expenses",
            ),
            InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
        ]
        finding.freshness = ctx.freshness_for("expenses")
        findings.append(finding)

    return findings
