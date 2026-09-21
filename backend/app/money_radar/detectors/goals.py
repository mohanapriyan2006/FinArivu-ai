"""GOAL_DELAY — goals whose required contribution outpaces the savings rate.

Projection math delegates to the authoritative ``GoalEngine`` — the
detector only interprets its output. Pace = the user's monthly surplus
(income − trailing expenses); a negative pace means the goal cannot
progress at all.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_CEILING

from app.engines.goal_engine import project_goals
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
from app.scenarios.calculations import add_months


def detect(ctx: RadarContext) -> list[RadarFinding]:
    pace = ctx.monthly_surplus
    if pace is None or not ctx.goals:
        return []

    goal_rows = [
        {
            "id": g.get("id"),
            "goal_name": g.get("goal_name"),
            "target_amount": g.get("target_amount"),
            "current_amount": g.get("current_amount"),
            "target_date": (
                g.get("target_date").isoformat()
                if hasattr(g.get("target_date"), "isoformat")
                else g.get("target_date")
            ),
        }
        for g in ctx.goals
    ]
    projection = project_goals(goal_rows, monthly_savings_rate=pace)

    findings: list[RadarFinding] = []
    for proj in projection.goals:
        if proj.status != "needs_attention":
            continue
        required = proj.monthly_contribution
        if required <= 0:
            continue

        shortfall = required - pace
        shortfall_ratio = shortfall / required
        if shortfall_ratio < T.GOAL_DELAY_MIN_SHORTFALL_RATIO:
            continue

        months_to_target = proj.months_remaining
        if pace > 0:
            months_needed = int(
                (proj.remaining_amount / pace).to_integral_value(
                    rounding=ROUND_CEILING
                )
            )
            delay_months = max(0, months_needed - months_to_target)
            projected_date = add_months(ctx.today, months_needed)
        else:
            months_needed = None
            delay_months = None
            projected_date = None

        if pace <= 0 or shortfall_ratio >= T.GOAL_DELAY_HIGH_SHORTFALL_RATIO:
            severity = InsightSeverity.HIGH
        elif shortfall_ratio >= Decimal("0.25"):
            severity = InsightSeverity.MEDIUM
        else:
            severity = InsightSeverity.LOW

        name = proj.goal_name or "Goal"
        evidence = [
            EvidenceItem(
                key="required_monthly",
                label="Required monthly",
                value=float(required),
                unit="currency",
                source="GoalEngine",
            ),
            EvidenceItem(
                key="current_pace",
                label="Current monthly pace",
                value=float(pace),
                unit="currency",
                source="CashFlowEngine",
            ),
            EvidenceItem(
                key="remaining",
                label="Remaining",
                value=float(proj.remaining_amount),
                unit="currency",
                source="GoalEngine",
            ),
            EvidenceItem(
                key="target_date",
                label="Target date",
                value=proj.target_date.isoformat() if proj.target_date else None,
                unit="date",
                source="GoalEngine",
            ),
        ]
        if projected_date is not None:
            evidence.append(
                EvidenceItem(
                    key="projected_completion",
                    label="Projected completion",
                    value=projected_date.isoformat(),
                    unit="date",
                    source="GoalEngine",
                )
            )
        if delay_months is not None:
            evidence.append(
                EvidenceItem(
                    key="delay_months",
                    label="Estimated delay",
                    value=delay_months,
                    unit="months",
                )
            )

        if months_needed is None:
            headline = f"{name} cannot progress at the current pace"
        elif delay_months and delay_months > 0:
            headline = f"{name} is trending ~{delay_months} month(s) behind"
        else:
            headline = f"{name} needs {inr(required)}/month to stay on track"

        finding = base_finding(
            InsightType.GOAL_DELAY,
            severity=severity,
            title=f"{name} goal delay",
            summary=(
                f"{headline}. Required {inr(required)}/month vs current pace "
                f"{inr(pace)}/month."
            ),
            entity_id=str(proj.goal_id) or None,
            entity_name=name,
            evidence=evidence,
            explanation=[
                f"To finish by {proj.target_date}, {name} needs {inr(required)} per month; "
                f"your current monthly surplus is {inr(pace)}.",
                "Projection comes from the GoalEngine using your real goal balances and savings rate.",
            ],
            state_key=(
                f"{proj.goal_id}:{severity.value}:"
                f"{int(shortfall_ratio * 10)}:{delay_months if delay_months is not None else -1}"
            ),
        )
        finding.impact = InsightImpact(
            metric_label="Monthly contribution gap",
            before=float(required),
            after=float(pace),
            change=float(shortfall),
            unit="currency",
            description=headline,
        )
        top_up = max(Decimal("0"), shortfall).to_integral_value(
            rounding=ROUND_CEILING
        )
        finding.actions = [
            InsightAction(
                kind=InsightActionKind.RUN_SCENARIO,
                label=f"Simulate +{inr(top_up)}/month",
                scenario=ScenarioPreset(
                    scenario_type="GOAL_CONTRIBUTION_CHANGE",
                    parameters={
                        "goal_id": str(proj.goal_id),
                        "additional_monthly": float(top_up),
                    },
                    title=f"{name} +{inr(top_up)}/month",
                ),
            ),
            InsightAction(
                kind=InsightActionKind.VIEW, label="Open goal", route="goals"
            ),
            InsightAction(kind=InsightActionKind.EXPLAIN, label="Why this?"),
        ]
        finding.freshness = ctx.freshness_for("goals")
        findings.append(finding)

    return findings
