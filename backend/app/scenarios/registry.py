"""Authoritative Scenario Registry — one declaration per scenario type.

Each definition declares its typed parameter model, the baseline data the
calculation requires, the affected domains, clarification questions for
missing inputs, and the Phase 1 action it may bridge to. Scenario type
strings must never be scattered through the codebase — everything reads
from this registry.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Type

from app.actions.action_types import ActionOperation
from app.schemas.base import BaseSchema
from app.scenarios import schemas as S
from app.scenarios.scenario_types import ScenarioType


@dataclass(frozen=True)
class ScenarioDefinition:
    """Registry entry for one scenario type."""

    type: ScenarioType
    param_model: Type[BaseSchema]
    # Parameter fields required before a run — missing → NEEDS_INPUT.
    required_params: tuple[str, ...]
    # Human label per parameter, used to build clarification questions.
    param_labels: dict[str, str] = field(default_factory=dict)
    # ScenarioContext data keys the calculation depends on.
    required_context: tuple[str, ...] = ()
    affected_domains: tuple[str, ...] = ()
    # Phase 1 bridge — the operation an applied change maps to, if any.
    apply_operation: ActionOperation | None = None
    apply_label: str = "Apply this change"
    short_label: str = ""


SCENARIO_REGISTRY: dict[ScenarioType, ScenarioDefinition] = {
    ScenarioType.INCOME_CHANGE: ScenarioDefinition(
        type=ScenarioType.INCOME_CHANGE,
        param_model=S.IncomeChangeParams,
        required_params=("change_value",),
        param_labels={
            "change_value": "the new income or the change",
        },
        required_context=("monthly_income", "monthly_expenses"),
        affected_domains=("cash_flow", "savings", "goals", "retirement"),
        apply_operation=ActionOperation.UPDATE_INCOME,
        apply_label="Apply new income",
        short_label="Income",
    ),
    ScenarioType.EXPENSE_CHANGE: ScenarioDefinition(
        type=ScenarioType.EXPENSE_CHANGE,
        param_model=S.ExpenseChangeParams,
        required_params=("change_value",),
        param_labels={"change_value": "the expense change"},
        required_context=("monthly_income", "monthly_expenses"),
        affected_domains=("cash_flow", "savings", "goals", "health"),
        short_label="Expenses",
    ),
    ScenarioType.CATEGORY_SPENDING_CHANGE: ScenarioDefinition(
        type=ScenarioType.CATEGORY_SPENDING_CHANGE,
        param_model=S.CategorySpendingChangeParams,
        required_params=("change_value",),
        param_labels={
            "change_value": "the spending change",
            "category_name": "the spending category",
        },
        required_context=("monthly_income", "monthly_expenses"),
        affected_domains=("cash_flow", "budgets", "savings", "goals"),
        apply_operation=ActionOperation.UPDATE_BUDGET,
        apply_label="Apply budget",
        short_label="Category spending",
    ),
    ScenarioType.BUDGET_CHANGE: ScenarioDefinition(
        type=ScenarioType.BUDGET_CHANGE,
        param_model=S.BudgetChangeParams,
        required_params=("new_monthly_limit",),
        param_labels={
            "new_monthly_limit": "the new monthly limit",
            "category_name": "the budget category",
        },
        required_context=("monthly_income", "monthly_expenses", "budgets"),
        affected_domains=("budgets", "cash_flow", "savings"),
        apply_operation=ActionOperation.UPDATE_BUDGET,
        apply_label="Apply budget",
        short_label="Budget",
    ),
    ScenarioType.MONTHLY_SAVINGS_CHANGE: ScenarioDefinition(
        type=ScenarioType.MONTHLY_SAVINGS_CHANGE,
        param_model=S.MonthlySavingsChangeParams,
        required_params=("change_amount",),
        param_labels={"change_amount": "the monthly savings change"},
        required_context=("monthly_income", "monthly_expenses"),
        affected_domains=("savings", "cash_flow", "goals", "retirement"),
        short_label="Savings",
    ),
    ScenarioType.GOAL_CONTRIBUTION_CHANGE: ScenarioDefinition(
        type=ScenarioType.GOAL_CONTRIBUTION_CHANGE,
        param_model=S.GoalContributionChangeParams,
        required_params=(),
        param_labels={
            "goal_name": "the goal",
            "additional_monthly": "the monthly change",
            "new_monthly_contribution": "the new monthly contribution",
        },
        required_context=("goals", "monthly_income", "monthly_expenses"),
        affected_domains=("goals", "cash_flow", "savings"),
        short_label="Goal contribution",
    ),
    ScenarioType.GOAL_TARGET_CHANGE: ScenarioDefinition(
        type=ScenarioType.GOAL_TARGET_CHANGE,
        param_model=S.GoalTargetChangeParams,
        required_params=("new_target_amount",),
        param_labels={
            "new_target_amount": "the new target amount",
            "goal_name": "the goal",
        },
        required_context=("goals",),
        affected_domains=("goals", "savings"),
        apply_operation=ActionOperation.UPDATE_GOAL,
        apply_label="Apply goal target",
        short_label="Goal target",
    ),
    ScenarioType.GOAL_DEADLINE_CHANGE: ScenarioDefinition(
        type=ScenarioType.GOAL_DEADLINE_CHANGE,
        param_model=S.GoalDeadlineChangeParams,
        required_params=("new_target_date",),
        param_labels={
            "new_target_date": "the new target date",
            "goal_name": "the goal",
        },
        required_context=("goals", "monthly_income", "monthly_expenses"),
        affected_domains=("goals", "cash_flow"),
        apply_operation=ActionOperation.UPDATE_GOAL,
        apply_label="Apply goal date",
        short_label="Goal deadline",
    ),
    ScenarioType.PURCHASE: ScenarioDefinition(
        type=ScenarioType.PURCHASE,
        param_model=S.PurchaseParams,
        required_params=("purchase_amount",),
        param_labels={
            "purchase_amount": "the purchase amount",
            "item_name": "what you want to buy",
        },
        required_context=("monthly_income", "monthly_expenses"),
        affected_domains=("cash_flow", "savings", "goals", "health"),
        apply_operation=ActionOperation.CREATE_GOAL,
        apply_label="Create a savings goal",
        short_label="Purchase",
    ),
    ScenarioType.RETIREMENT_AGE_CHANGE: ScenarioDefinition(
        type=ScenarioType.RETIREMENT_AGE_CHANGE,
        param_model=S.RetirementAgeChangeParams,
        required_params=("new_retirement_age",),
        param_labels={"new_retirement_age": "the retirement age"},
        required_context=("age", "monthly_expenses"),
        affected_domains=("retirement", "savings"),
        short_label="Retirement age",
    ),
    ScenarioType.INFLATION_CHANGE: ScenarioDefinition(
        type=ScenarioType.INFLATION_CHANGE,
        param_model=S.InflationChangeParams,
        required_params=("new_inflation_rate",),
        param_labels={"new_inflation_rate": "the inflation rate"},
        required_context=("age", "monthly_expenses"),
        affected_domains=("retirement", "expenses"),
        short_label="Inflation",
    ),
    ScenarioType.LOAN_PREPAYMENT: ScenarioDefinition(
        type=ScenarioType.LOAN_PREPAYMENT,
        param_model=S.LoanPrepaymentParams,
        required_params=("prepayment_amount",),
        param_labels={
            "prepayment_amount": "the prepayment amount",
            "loan_name": "the loan",
        },
        required_context=("loans",),
        affected_domains=("loans", "cash_flow", "net_worth"),
        short_label="Loan prepayment",
    ),
    ScenarioType.LOAN_EMI_CHANGE: ScenarioDefinition(
        type=ScenarioType.LOAN_EMI_CHANGE,
        param_model=S.LoanEmiChangeParams,
        required_params=("new_emi",),
        param_labels={
            "new_emi": "the new EMI",
            "loan_name": "the loan",
        },
        required_context=("loans",),
        affected_domains=("loans", "cash_flow"),
        short_label="Loan EMI",
    ),
    ScenarioType.EMERGENCY_FUND_TARGET_CHANGE: ScenarioDefinition(
        type=ScenarioType.EMERGENCY_FUND_TARGET_CHANGE,
        param_model=S.EmergencyFundTargetChangeParams,
        required_params=("target_months",),
        param_labels={"target_months": "the target months of cover"},
        required_context=("monthly_expenses",),
        affected_domains=("savings", "health"),
        short_label="Emergency fund",
    ),
}


def get_definition(
    scenario_type: str | ScenarioType,
) -> ScenarioDefinition | None:
    """Return the registry definition for a type string, or None."""
    if isinstance(scenario_type, ScenarioType):
        return SCENARIO_REGISTRY.get(scenario_type)
    try:
        st = ScenarioType(str(scenario_type).strip().upper())
    except ValueError:
        return None
    return SCENARIO_REGISTRY.get(st)
