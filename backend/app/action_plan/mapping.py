"""Authoritative insight → plan-item mapping (Phase 4 §13).

ONE mapping layer — detectors never produce plan items directly and the
LLM never invents categories. ``None`` in this table means the insight
type never generates a plan item (purely informational for Radar).
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.money_radar.radar_types import InsightActionKind, InsightType
from app.action_plan.plan_types import PlanItemCategory


@dataclass(frozen=True)
class PlanItemBlueprint:
    """How a radar insight type becomes a plan item."""

    insight_type: InsightType
    category: PlanItemCategory
    # Priority floor — deterministic baseline before scoring adjustments.
    default_title_template: str          # "{entity}" placeholder allowed
    action_kinds: tuple[InsightActionKind, ...] = field(default_factory=tuple)


INSIGHT_TO_PLAN: dict[InsightType, PlanItemBlueprint] = {
    InsightType.SPENDING_SPIKE: PlanItemBlueprint(
        insight_type=InsightType.SPENDING_SPIKE,
        category=PlanItemCategory.REVIEW_SPENDING,
        default_title_template="Review {entity} spending",
        action_kinds=(InsightActionKind.RUN_SCENARIO, InsightActionKind.VIEW),
    ),
    InsightType.BUDGET_RISK: PlanItemBlueprint(
        insight_type=InsightType.BUDGET_RISK,
        category=PlanItemCategory.REVIEW_BUDGET,
        default_title_template="Review {entity} budget",
        action_kinds=(
            InsightActionKind.RUN_SCENARIO,
            InsightActionKind.PREVIEW_ACTION,
            InsightActionKind.VIEW,
        ),
    ),
    InsightType.CASHFLOW_RISK: PlanItemBlueprint(
        insight_type=InsightType.CASHFLOW_RISK,
        category=PlanItemCategory.IMPROVE_CASHFLOW,
        default_title_template="Improve monthly cash flow",
        action_kinds=(InsightActionKind.RUN_SCENARIO, InsightActionKind.VIEW),
    ),
    InsightType.GOAL_DELAY: PlanItemBlueprint(
        insight_type=InsightType.GOAL_DELAY,
        category=PlanItemCategory.REPLAN_GOAL,
        default_title_template="Get {entity} back on track",
        action_kinds=(InsightActionKind.RUN_SCENARIO, InsightActionKind.VIEW),
    ),
    InsightType.DEBT_OPPORTUNITY: PlanItemBlueprint(
        insight_type=InsightType.DEBT_OPPORTUNITY,
        category=PlanItemCategory.REVIEW_DEBT,
        default_title_template="Review {entity} prepayment",
        action_kinds=(InsightActionKind.RUN_SCENARIO, InsightActionKind.VIEW),
    ),
    InsightType.EMERGENCY_FUND_RISK: PlanItemBlueprint(
        insight_type=InsightType.EMERGENCY_FUND_RISK,
        category=PlanItemCategory.BUILD_RESERVE,
        default_title_template="Build your emergency reserve",
        action_kinds=(InsightActionKind.RUN_SCENARIO, InsightActionKind.VIEW),
    ),
    InsightType.TAX_OPPORTUNITY: PlanItemBlueprint(
        insight_type=InsightType.TAX_OPPORTUNITY,
        category=PlanItemCategory.REVIEW_TAX,
        default_title_template="Review your tax regime",
        action_kinds=(InsightActionKind.VIEW,),
    ),
    # RECURRING_COST / NETWORTH_CHANGE stay informational — they enter the
    # plan only when the detector attached an actionable next step.
    InsightType.RECURRING_COST: PlanItemBlueprint(
        insight_type=InsightType.RECURRING_COST,
        category=PlanItemCategory.REVIEW_RECURRING_COST,
        default_title_template="Review {entity} recurring cost",
        action_kinds=(InsightActionKind.VIEW,),
    ),
    InsightType.NETWORTH_CHANGE: PlanItemBlueprint(
        insight_type=InsightType.NETWORTH_CHANGE,
        category=PlanItemCategory.REVIEW_NETWORTH,
        default_title_template="Review your net worth change",
        action_kinds=(InsightActionKind.VIEW,),
    ),
}


def blueprint_for(insight_type: InsightType | str) -> PlanItemBlueprint | None:
    """Resolve the plan blueprint for an insight type — None if unmappable."""
    try:
        return INSIGHT_TO_PLAN.get(InsightType(insight_type))
    except ValueError:
        return None
