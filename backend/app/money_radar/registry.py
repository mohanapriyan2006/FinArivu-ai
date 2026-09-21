"""Authoritative Money Radar Insight Registry.

One ``InsightDefinition`` per ``InsightType`` declares: which data domains
must be available for the detector to run, its category grouping, the
canonical source (engine/repositories), the entity it describes, the
action kinds it may expose, and its detector version.

Business rules (thresholds) live in ``thresholds.py``; detection logic in
``detectors/`` — this module only declares wiring, never numbers.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.money_radar.radar_types import (
    DETECTOR_VERSIONS,
    InsightActionKind,
    InsightCategory,
    InsightType,
)


@dataclass(frozen=True)
class InsightDefinition:
    """Metadata contract for one insight type."""

    type: InsightType
    # Radar domains that must be AVAILABLE before the detector runs.
    # Missing → detector skipped, gap surfaced in coverage.
    required_domains: tuple[str, ...]
    category: InsightCategory
    detector: str                     # detector key / module name
    detector_version: str
    entity_type: str | None           # "category" | "budget" | "goal" | "loan" | None(user)
    source_engines: tuple[str, ...] = ()
    source_repositories: tuple[str, ...] = ()
    action_kinds: tuple[InsightActionKind, ...] = field(default_factory=tuple)
    # Grouping for the radar surface: attention | opportunity | info
    group: str = "attention"


INSIGHT_REGISTRY: dict[InsightType, InsightDefinition] = {
    InsightType.SPENDING_SPIKE: InsightDefinition(
        type=InsightType.SPENDING_SPIKE,
        required_domains=("expenses",),
        category=InsightCategory.SPENDING,
        detector="spending_spike",
        detector_version=DETECTOR_VERSIONS[InsightType.SPENDING_SPIKE],
        entity_type="category",
        source_engines=(),
        source_repositories=("ExpenseRepository", "ExpenseCategoryRepository"),
        action_kinds=(
            InsightActionKind.VIEW,
            InsightActionKind.EXPLAIN,
            InsightActionKind.RUN_SCENARIO,
        ),
        group="attention",
    ),
    InsightType.BUDGET_RISK: InsightDefinition(
        type=InsightType.BUDGET_RISK,
        required_domains=("budgets", "expenses"),
        category=InsightCategory.BUDGET,
        detector="budget_risk",
        detector_version=DETECTOR_VERSIONS[InsightType.BUDGET_RISK],
        entity_type="budget",
        source_engines=("BudgetEngine",),
        source_repositories=("BudgetRepository", "ExpenseRepository"),
        action_kinds=(
            InsightActionKind.VIEW,
            InsightActionKind.EXPLAIN,
            InsightActionKind.RUN_SCENARIO,
            InsightActionKind.PREVIEW_ACTION,
        ),
        group="attention",
    ),
    InsightType.CASHFLOW_RISK: InsightDefinition(
        type=InsightType.CASHFLOW_RISK,
        required_domains=("income", "expenses"),
        category=InsightCategory.CASH_FLOW,
        detector="cashflow_risk",
        detector_version=DETECTOR_VERSIONS[InsightType.CASHFLOW_RISK],
        entity_type=None,
        source_engines=("CashFlowEngine",),
        source_repositories=("IncomeRepository", "ExpenseRepository"),
        action_kinds=(InsightActionKind.EXPLAIN, InsightActionKind.RUN_SCENARIO),
        group="attention",
    ),
    InsightType.GOAL_DELAY: InsightDefinition(
        type=InsightType.GOAL_DELAY,
        required_domains=("goals", "income", "expenses"),
        category=InsightCategory.GOALS,
        detector="goal_delay",
        detector_version=DETECTOR_VERSIONS[InsightType.GOAL_DELAY],
        entity_type="goal",
        source_engines=("GoalEngine",),
        source_repositories=("GoalRepository",),
        action_kinds=(
            InsightActionKind.VIEW,
            InsightActionKind.EXPLAIN,
            InsightActionKind.RUN_SCENARIO,
        ),
        group="attention",
    ),
    InsightType.DEBT_OPPORTUNITY: InsightDefinition(
        type=InsightType.DEBT_OPPORTUNITY,
        required_domains=("liabilities",),
        category=InsightCategory.DEBT,
        detector="debt_opportunity",
        detector_version=DETECTOR_VERSIONS[InsightType.DEBT_OPPORTUNITY],
        entity_type="loan",
        source_engines=("ScenarioEngine",),
        source_repositories=("LiabilityRepository",),
        action_kinds=(
            InsightActionKind.VIEW,
            InsightActionKind.EXPLAIN,
            InsightActionKind.RUN_SCENARIO,
        ),
        group="opportunity",
    ),
    InsightType.EMERGENCY_FUND_RISK: InsightDefinition(
        type=InsightType.EMERGENCY_FUND_RISK,
        required_domains=("savings", "expenses"),
        category=InsightCategory.SAVINGS,
        detector="emergency_fund",
        detector_version=DETECTOR_VERSIONS[InsightType.EMERGENCY_FUND_RISK],
        entity_type=None,
        source_engines=("HealthScoreEngine",),
        source_repositories=("AssetRepository", "ExpenseRepository"),
        action_kinds=(
            InsightActionKind.VIEW,
            InsightActionKind.EXPLAIN,
            InsightActionKind.RUN_SCENARIO,
        ),
        group="attention",
    ),
    InsightType.TAX_OPPORTUNITY: InsightDefinition(
        type=InsightType.TAX_OPPORTUNITY,
        required_domains=("income",),
        category=InsightCategory.TAX,
        detector="tax_opportunity",
        detector_version=DETECTOR_VERSIONS[InsightType.TAX_OPPORTUNITY],
        entity_type=None,
        source_engines=("TaxEngine",),
        source_repositories=("TaxProfileRepository",),
        action_kinds=(InsightActionKind.EXPLAIN,),
        group="opportunity",
    ),
    InsightType.RECURRING_COST: InsightDefinition(
        type=InsightType.RECURRING_COST,
        required_domains=("expenses",),
        category=InsightCategory.SPENDING,
        detector="recurring_cost",
        detector_version=DETECTOR_VERSIONS[InsightType.RECURRING_COST],
        entity_type="category",
        source_engines=(),
        source_repositories=("ExpenseRepository",),
        action_kinds=(InsightActionKind.VIEW, InsightActionKind.EXPLAIN),
        group="info",
    ),
    InsightType.NETWORTH_CHANGE: InsightDefinition(
        type=InsightType.NETWORTH_CHANGE,
        required_domains=("net_worth", "net_worth_history"),
        category=InsightCategory.NET_WORTH,
        detector="networth_change",
        detector_version=DETECTOR_VERSIONS[InsightType.NETWORTH_CHANGE],
        entity_type=None,
        source_engines=("NetWorthEngine",),
        source_repositories=("AssetRepository", "LiabilityRepository"),
        action_kinds=(InsightActionKind.VIEW, InsightActionKind.EXPLAIN),
        group="info",
    ),
}


def get_insight_definition(
    value: str | InsightType,
) -> InsightDefinition | None:
    """Resolve a registry definition — ``None`` for unknown types."""
    if isinstance(value, InsightType):
        return INSIGHT_REGISTRY.get(value)
    try:
        return INSIGHT_REGISTRY.get(InsightType(value))
    except ValueError:
        return None


def domains_for_detectors() -> dict[str, list[str]]:
    """Detector key → required radar domains (for coverage reporting)."""
    return {
        definition.detector: list(definition.required_domains)
        for definition in INSIGHT_REGISTRY.values()
    }
