"""BUDGET_RISK — budgets nearing or past their monthly limit.

Month-end projection is only computed once enough of the month has
elapsed (``BUDGET_PROJECTION_MIN_ELAPSED``) — a linear projection from a
few days of data would be noise, so early-month findings report
utilisation only.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_CEILING

from app.money_radar import thresholds as T
from app.money_radar.context import RadarContext
from app.money_radar.detectors.base import base_finding, inr, pct
from app.money_radar.radar_types import (
    InsightActionKind,
    InsightSeverity,
    InsightType,
)
from app.money_radar.schemas import (
    ActionIntent,
    EvidenceItem,
    InsightAction,
    InsightImpact,
    RadarFinding,
    ScenarioPreset,
)


def _suggest_limit(current_spend: Decimal, projected: Decimal | None) -> Decimal:
    """A budget limit that covers the observed pace, rounded up to ₹500."""
    target = max(current_spend, projected or Decimal("0"))
    if target <= 0:
        return Decimal("500")
    return (target / 500).to_integral_value(rounding=ROUND_CEILING) * 500


def detect(ctx: RadarContext) -> list[RadarFinding]:
    current = ctx.current_month
    if current is None:
        return []

    findings: list[RadarFinding] = []
    for budget in ctx.budgets:
        limit = budget["monthly_limit"]
        if limit <= 0 or budget.get("period") not in (None, "monthly"):
            continue
        cat_id = budget["category_id"]
        name = budget.get("category_name") or ctx.category_names.get(cat_id, "Budget")
        spent = current.by_category.get(cat_id, Decimal("0"))
        util = spent / limit

        projected: Decimal | None = None
        if current.elapsed_ratio >= T.BUDGET_PROJECTION_MIN_ELAPSED:
            projected = spent / current.elapsed_ratio

        if util < T.BUDGET_UTIL_LOW:
            # Below the alert band — only flag when projection still
            # overshoots the limit meaningfully.
            if projected is None or projected <= limit:
                continue
            severity = InsightSeverity.LOW
        elif util < T.BUDGET_UTIL_MEDIUM:
            severity = InsightSeverity.LOW
        elif util < T.BUDGET_UTIL_OVER:
            severity = InsightSeverity.MEDIUM
        else:
            severity = InsightSeverity.HIGH

        over_by = spent - limit
        projected_over = (projected - limit) if projected is not None else None
        suggested_limit = _suggest_limit(spent, projected)

        evidence = [
            EvidenceItem(
                key="spent",
                label="Spent this month",
                value=float(spent),
                unit="currency",
                source="ExpenseRepository",
            ),
            EvidenceItem(
                key="limit",
                label="Monthly limit",
                value=float(limit),
                unit="currency",
                source="BudgetRepository",
            ),
            EvidenceItem(
                key="utilization",
                label="Utilisation",
                value=float(util),
                unit="percent",
                source="BudgetEngine",
            ),
        ]
        if projected is not None:
            evidence.append(
                EvidenceItem(
                    key="projected_month_end",
                    label="Projected month-end",
                    value=float(projected),
                    unit="currency",
                    source="BudgetEngine",
                )
            )
        if projected_over is not None and projected_over > 0:
            evidence.append(
                EvidenceItem(
                    key="projected_overage",
                    label="Projected overage",
                    value=float(projected_over),
                    unit="currency",
                )
            )

        if util >= T.BUDGET_UTIL_OVER:
            headline = f"{name} budget exceeded by {inr(over_by)}"
        elif projected_over is not None and projected_over > 0:
            headline = f"{name} budget is on pace to exceed by {inr(projected_over)}"
        else:
            headline = f"{name} budget is {pct(util)} used"

        finding = base_finding(
            InsightType.BUDGET_RISK,
            severity=severity,
            title=f"{name} budget risk",
            summary=(
                f"{inr(spent)} of {inr(limit)} used ({pct(util)})"
                + (
                    f"; on pace for {inr(projected)} by month-end."
                    if projected is not None
                    else "."
                )
            ),
            entity_id=budget["id"],
            entity_name=name,
            evidence=evidence,
            explanation=[
                f"Month-to-date spending in {name} is {inr(spent)} against a {inr(limit)} budget.",
                (
                    "A linear projection is shown because "
                    f"{current.elapsed_ratio:.0%} of the month has elapsed."
                    if projected is not None
                    else "Too early in the month to project — showing current utilisation only."
                ),
            ],
            state_key=f"{budget['id']}:{severity.value}:{int(util * 20)}",
        )
        finding.impact = InsightImpact(
            metric_label="Budget used",
            before=float(limit),
            after=float(spent),
            change=float(over_by),
            unit="currency",
            description=headline,
        )
        finding.actions = [
            InsightAction(
                kind=InsightActionKind.RUN_SCENARIO,
                label=f"Simulate {inr(suggested_limit)} budget",
                scenario=ScenarioPreset(
                    scenario_type="BUDGET_CHANGE",
                    parameters={
                        "category_name": name,
                        "new_monthly_limit": float(suggested_limit),
                    },
                    title=f"{name} budget → {inr(suggested_limit)}",
                ),
            ),
            InsightAction(
                kind=InsightActionKind.PREVIEW_ACTION,
                label=f"Set budget to {inr(suggested_limit)}",
                action=ActionIntent(
                    operation="UPDATE_BUDGET",
                    arguments={
                        "category_name": name,
                        "monthly_limit": float(suggested_limit),
                    },
                ),
            ),
            InsightAction(
                kind=InsightActionKind.VIEW, label="View budget", route="budget"
            ),
            InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
        ]
        finding.freshness = ctx.freshness_for("budgets")
        findings.append(finding)

    return findings
