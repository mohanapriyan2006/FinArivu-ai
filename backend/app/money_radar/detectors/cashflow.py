"""CASHFLOW_RISK — spending outpacing income, or a dangerously thin surplus.

Uses monthly income vs the trailing expense baseline. It does NOT pretend
to know upcoming salary-cycle obligations — that would require dated
commitments the data model does not store.
"""

from __future__ import annotations

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
    ScenarioPreset,
)


def detect(ctx: RadarContext) -> list[RadarFinding]:
    income = ctx.monthly_income
    expenses = ctx.avg_monthly_expenses or ctx.monthly_estimate
    if income is None or income <= 0 or expenses is None:
        return []

    surplus = income - expenses
    ratio = surplus / income

    if surplus < 0:
        deficit = -surplus
        severity = (
            InsightSeverity.HIGH
            if deficit / income > T.CASHFLOW_DEFICIT_MEDIUM_RATIO
            else InsightSeverity.MEDIUM
        )
        summary = (
            f"Your average monthly spend ({inr(expenses)}) exceeds your "
            f"monthly income ({inr(income)}) by {inr(deficit)}."
        )
        headline = f"Spending exceeds income by {inr(deficit)}/month"
    elif ratio < T.CASHFLOW_THIN_SURPLUS_RATIO:
        severity = InsightSeverity.LOW
        summary = (
            f"Your monthly surplus is only {inr(surplus)} "
            f"({pct(ratio)} of income) — little room for surprises."
        )
        headline = f"Thin monthly surplus: {inr(surplus)}"
    else:
        return []

    finding = base_finding(
        InsightType.CASHFLOW_RISK,
        severity=severity,
        title="Cash flow risk",
        summary=summary,
        evidence=[
            EvidenceItem(
                key="monthly_income",
                label="Monthly income",
                value=float(income),
                unit="currency",
                source="IncomeRepository",
            ),
            EvidenceItem(
                key="avg_expenses",
                label="Avg monthly expenses",
                value=float(expenses),
                unit="currency",
                source="ExpenseRepository",
            ),
            EvidenceItem(
                key="monthly_surplus",
                label="Monthly surplus",
                value=float(surplus),
                unit="currency",
                source="CashFlowEngine",
            ),
            EvidenceItem(
                key="surplus_ratio",
                label="Surplus ratio",
                value=float(ratio),
                unit="percent",
            ),
        ],
        explanation=[
            headline + ".",
            "Based on recorded income and your trailing expense average — "
            "upcoming dated obligations are not modelled.",
        ],
        state_key=f"{severity.value}:{int(surplus / 1000)}",
    )
    finding.impact = InsightImpact(
        metric_label="Monthly surplus",
        before=float(income),
        after=float(expenses),
        change=float(surplus),
        unit="currency",
        description=headline,
    )
    finding.actions = [
        InsightAction(
            kind=InsightActionKind.RUN_SCENARIO,
            label="Simulate −10% expenses",
            scenario=ScenarioPreset(
                scenario_type="EXPENSE_CHANGE",
                parameters={"change_type": "percent", "change_value": -10},
                title="Expenses −10%",
            ),
        ),
        InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
    ]
    finding.freshness = ctx.freshness_for("expenses")
    return [finding]
