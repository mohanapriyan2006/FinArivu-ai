"""ScenarioEngine — the single authoritative simulation calculation layer.

Takes a validated scenario (typed params) + a real ``ScenarioContext`` and
produces a ``ScenarioComputation``: baseline state, scenario state, typed
metric diffs, explicit assumptions, and an optional Phase 1 action bridge.

Every compute_* method is deterministic — the LLM only ever explains
these numbers, it never produces them.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Callable

from app.core.config import settings
from app.engines.retirement_engine import project_retirement
from app.scenarios import calculations as calc
from app.scenarios.context import ScenarioContext
from app.scenarios.registry import ScenarioDefinition
from app.scenarios.scenario_types import (
    DataQuality,
    MetricDirection,
    MetricUnit,
    ScenarioRunStatus,
    ScenarioType,
)
from app.scenarios import schemas as S


@dataclass
class ScenarioComputation:
    """Internal result of a scenario calculation."""

    status: ScenarioRunStatus
    baseline: dict[str, Any] = field(default_factory=dict)
    scenario: dict[str, Any] = field(default_factory=dict)
    metrics: list[S.ScenarioMetric] = field(default_factory=list)
    assumptions: list[S.ScenarioAssumption] = field(default_factory=list)
    missing_data: list[str] = field(default_factory=list)
    summary: str = ""
    explanation: list[str] = field(default_factory=list)
    apply: S.ScenarioApplyAction | None = None
    alternatives: list[dict[str, Any]] = field(default_factory=list)


# ── Metric helpers ──────────────────────────────────────────────────────────


def _metric(
    key: str,
    label: str,
    before: Any,
    after: Any,
    unit: MetricUnit,
    *,
    higher_is_better: bool = True,
) -> S.ScenarioMetric:
    change, direction = calc.classify_change(
        before, after, higher_is_better=higher_is_better
    )
    return S.ScenarioMetric(
        key=key,
        label=label,
        before=before,
        after=after,
        change=change,
        unit=unit,
        direction=direction,
    )


def _assume(key: str, label: str, value: Any, source: str = "default") -> S.ScenarioAssumption:
    return S.ScenarioAssumption(key=key, label=label, value=value, source=source)


def _f(value: Any) -> float | None:
    """JSON-safe float for metrics (None passes through)."""
    if value is None:
        return None
    return float(value)


def _goal_dict(goal: dict[str, Any]) -> dict[str, Any]:
    """Normalise a goal row (dates may be date or str)."""
    g = dict(goal)
    td = g.get("target_date")
    if isinstance(td, str):
        g["target_date"] = date.fromisoformat(td)
    return g


class ScenarioEngine:
    """Deterministic per-type scenario calculations."""

    def __init__(self) -> None:
        self._handlers: dict[ScenarioType, Callable[..., ScenarioComputation]] = {
            ScenarioType.INCOME_CHANGE: self._income_change,
            ScenarioType.EXPENSE_CHANGE: self._expense_change,
            ScenarioType.CATEGORY_SPENDING_CHANGE: self._category_spending_change,
            ScenarioType.BUDGET_CHANGE: self._budget_change,
            ScenarioType.MONTHLY_SAVINGS_CHANGE: self._savings_change,
            ScenarioType.GOAL_CONTRIBUTION_CHANGE: self._goal_contribution_change,
            ScenarioType.GOAL_TARGET_CHANGE: self._goal_target_change,
            ScenarioType.GOAL_DEADLINE_CHANGE: self._goal_deadline_change,
            ScenarioType.PURCHASE: self._purchase,
            ScenarioType.RETIREMENT_AGE_CHANGE: self._retirement_age_change,
            ScenarioType.INFLATION_CHANGE: self._inflation_change,
            ScenarioType.LOAN_PREPAYMENT: self._loan_prepayment,
            ScenarioType.LOAN_EMI_CHANGE: self._loan_emi_change,
            ScenarioType.EMERGENCY_FUND_TARGET_CHANGE: self._emergency_fund_change,
        }

    def run(
        self,
        definition: ScenarioDefinition,
        params: S.BaseSchema,
        ctx: ScenarioContext,
    ) -> ScenarioComputation:
        """Dispatch to the type handler; check required context first."""
        missing_data = [
            key for key in definition.required_context
            if not self._has(ctx, key)
        ]
        if missing_data:
            return ScenarioComputation(
                status=ScenarioRunStatus.INSUFFICIENT_DATA,
                missing_data=missing_data,
                summary="I need more of your financial data to simulate this accurately.",
            )
        handler = self._handlers[definition.type]
        return handler(params, ctx)

    # ── Context checks ─────────────────────────────────────────────────

    @staticmethod
    def _has(ctx: ScenarioContext, key: str) -> bool:
        """Whether a required baseline datum is present."""
        checks: dict[str, Callable[[ScenarioContext], Any]] = {
            "monthly_income": lambda c: c.monthly_income,
            "monthly_expenses": lambda c: c.monthly_expenses,
            "expense_categories": lambda c: c.expense_by_category or None,
            "budgets": lambda c: c.budgets or None,
            "goals": lambda c: c.goals or None,
            "loans": lambda c: c.loans or None,
            "savings": lambda c: c.cash_savings,
            "emergency_fund": lambda c: c.emergency_fund,
            "age": lambda c: c.current_age,
            "retirement_age": lambda c: c.retirement_age,
            "net_worth": lambda c: c.net_worth,
        }
        check = checks.get(key)
        if check is None:
            return True
        value = check(ctx)
        return value is not None

    # ── Shared baseline metrics ────────────────────────────────────────

    @staticmethod
    def _cash_flow_metrics(
        income: Decimal,
        expenses: Decimal,
        new_income: Decimal,
        new_expenses: Decimal,
    ) -> list[S.ScenarioMetric]:
        surplus = income - expenses
        new_surplus = new_income - new_expenses
        rate = float(surplus / income) if income > 0 else None
        new_rate = float(new_surplus / new_income) if new_income > 0 else None
        metrics = [
            _metric("monthlyIncome", "Monthly income", _f(income), _f(new_income), MetricUnit.CURRENCY),
            _metric("monthlyExpenses", "Monthly expenses", _f(expenses), _f(new_expenses), MetricUnit.CURRENCY, higher_is_better=False),
            _metric("monthlySurplus", "Monthly surplus", _f(surplus), _f(new_surplus), MetricUnit.CURRENCY),
            _metric("savingsRate", "Savings rate", rate, new_rate, MetricUnit.PERCENT),
        ]
        return metrics

    def _goal_impact_metrics(
        self,
        ctx: ScenarioContext,
        surplus_before: Decimal,
        surplus_after: Decimal,
    ) -> list[S.ScenarioMetric]:
        """Projected months to finish the nearest incomplete goal."""
        goal = self._primary_goal(ctx)
        if goal is None:
            return []
        remaining = Decimal(str(goal["target_amount"])) - Decimal(
            str(goal.get("current_amount") or 0)
        )
        if remaining <= 0:
            return []
        before_m = self._months_at_capacity(remaining, surplus_before)
        after_m = self._months_at_capacity(remaining, surplus_after)
        return [
            _metric(
                "goalCompletionMonths",
                f"'{goal['goal_name']}' completion",
                before_m, after_m,
                MetricUnit.MONTHS,
                higher_is_better=False,
            )
        ]

    @staticmethod
    def _months_at_capacity(remaining: Decimal, monthly: Decimal) -> float | None:
        if monthly <= 0:
            return None
        return float((remaining / monthly).quantize(Decimal("0.1")))

    @staticmethod
    def _primary_goal(ctx: ScenarioContext) -> dict[str, Any] | None:
        """Nearest-deadline incomplete goal — the goal most affected."""
        candidates = [
            _goal_dict(g) for g in ctx.goals
            if Decimal(str(g.get("target_amount") or 0))
            > Decimal(str(g.get("current_amount") or 0))
        ]
        if not candidates:
            return None
        dated = [g for g in candidates if g.get("target_date")]
        if dated:
            return min(dated, key=lambda g: g["target_date"])
        return candidates[0]

    def _corpus_metric(
        self,
        surplus_before: Decimal,
        surplus_after: Decimal,
        assumptions: list[S.ScenarioAssumption],
    ) -> S.ScenarioMetric | None:
        """Projected corpus from investing the surplus — explicit assumption."""
        horizon = settings.scenario_projection_horizon_years
        rate = Decimal(str(settings.scenario_annual_return_rate))
        before = calc.annuity_future_value(surplus_before, rate, horizon)
        after = calc.annuity_future_value(surplus_after, rate, horizon)
        assumptions.append(_assume(
            "annualReturn", "Annual return assumption",
            float(rate), "default",
        ))
        assumptions.append(_assume(
            "horizonYears", "Projection horizon", horizon, "default",
        ))
        return _metric(
            "projectedCorpus",
            f"Projected savings in {horizon}y",
            _f(before), _f(after),
            MetricUnit.CURRENCY,
        )

    # ── Flow-change scenarios ──────────────────────────────────────────

    def _income_change(
        self, params: S.IncomeChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        income = ctx.monthly_income
        expenses = ctx.monthly_expenses
        assert income is not None and expenses is not None

        if params.change_type == "percent":
            new_income = income * (Decimal("1") + params.change_value / 100)
            desc = f"{params.change_value}% income change"
        elif params.change_type == "set":
            new_income = params.change_value
            desc = f"income set to ₹{float(new_income):,.0f}"
        else:
            new_income = income + params.change_value
            desc = f"income change of ₹{float(params.change_value):,.0f}"

        assumptions: list[S.ScenarioAssumption] = [
            _assume("expensesStable", "Expenses unchanged", _f(expenses), "engine"),
        ]
        metrics = self._cash_flow_metrics(income, expenses, new_income, expenses)
        metrics += self._goal_impact_metrics(ctx, income - expenses, new_income - expenses)
        corpus = self._corpus_metric(income - expenses, new_income - expenses, assumptions)
        if corpus:
            metrics.append(corpus)

        delta = new_income - income
        apply = None
        source = params.source or self._default_income_source(ctx)
        if source:
            apply = S.ScenarioApplyAction(
                operation="UPDATE_INCOME",
                arguments={"source": source, "amount": float(new_income)},
                label="Apply new income",
            )

        comp = ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"monthlyIncome": _f(income)},
            scenario={"monthlyIncome": _f(new_income)},
            metrics=metrics,
            assumptions=assumptions,
            summary=(
                f"With a {desc}, monthly surplus moves from "
                f"₹{float(income - expenses):,.0f} to "
                f"₹{float(new_income - expenses):,.0f}."
            ),
            explanation=[
                f"Monthly income changes by ₹{float(delta):,.0f}.",
                "Expenses are held at their current level in this simulation.",
            ],
            apply=apply,
        )
        return comp

    @staticmethod
    def _default_income_source(ctx: ScenarioContext) -> str | None:
        return "salary"

    def _expense_change(
        self, params: S.ExpenseChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        income = ctx.monthly_income
        expenses = ctx.monthly_expenses
        assert income is not None and expenses is not None

        if params.change_type == "percent":
            new_expenses = expenses * (Decimal("1") + params.change_value / 100)
        elif params.change_type == "set":
            new_expenses = params.change_value
        else:
            new_expenses = expenses + params.change_value

        metrics = self._cash_flow_metrics(income, expenses, income, new_expenses)
        metrics += self._goal_impact_metrics(ctx, income - expenses, income - new_expenses)

        delta = new_expenses - expenses
        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"monthlyExpenses": _f(expenses)},
            scenario={"monthlyExpenses": _f(new_expenses)},
            metrics=metrics,
            assumptions=[
                _assume("incomeStable", "Income unchanged", _f(income), "engine"),
            ],
            summary=(
                f"If monthly expenses move by ₹{float(delta):,.0f}, "
                f"surplus becomes ₹{float(income - new_expenses):,.0f}."
            ),
            explanation=[
                f"Monthly expenses: ₹{float(expenses):,.0f} → ₹{float(new_expenses):,.0f}.",
            ],
        )

    def _category_spending_change(
        self, params: S.CategorySpendingChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        income = ctx.monthly_income
        expenses = ctx.monthly_expenses
        assert income is not None and expenses is not None

        name = (params.category_name or "").strip().lower()
        current_cat = ctx.expense_by_category.get(name)

        if params.change_type == "percent" and current_cat is not None:
            new_cat = current_cat * (Decimal("1") + params.change_value / 100)
        elif params.change_type == "set":
            new_cat = params.change_value
        elif params.change_type == "amount" and current_cat is not None:
            new_cat = current_cat + params.change_value
        elif params.change_type == "amount":
            # No recorded spend for the category — treat value as the change.
            new_cat = params.change_value
            current_cat = Decimal("0")
        else:
            new_cat = params.change_value
            current_cat = Decimal("0")

        delta = new_cat - current_cat
        new_expenses = expenses + delta

        metrics = [
            _metric(
                "categorySpend", f"'{params.category_name or 'Category'}' spend",
                _f(current_cat), _f(new_cat), MetricUnit.CURRENCY,
                higher_is_better=False,
            ),
        ]
        metrics += self._cash_flow_metrics(income, expenses, income, new_expenses)
        metrics += self._goal_impact_metrics(ctx, income - expenses, income - new_expenses)

        apply = None
        cat_label = params.category_name or name.title()
        budget = self._budget_for(ctx, name)
        if budget:
            apply = S.ScenarioApplyAction(
                operation="UPDATE_BUDGET",
                arguments={
                    "categoryName": budget.get("category_name") or cat_label,
                    "monthlyLimit": float(new_cat),
                },
                label="Apply budget",
            )
        elif cat_label:
            apply = S.ScenarioApplyAction(
                operation="CREATE_BUDGET",
                arguments={
                    "categoryName": cat_label,
                    "monthlyLimit": float(new_cat),
                },
                label="Create budget",
            )

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"categorySpend": _f(current_cat), "monthlyExpenses": _f(expenses)},
            scenario={"categorySpend": _f(new_cat), "monthlyExpenses": _f(new_expenses)},
            metrics=metrics,
            assumptions=[
                _assume("categoryBaseline",
                        "Category spend baseline",
                        "3-month recorded average" if name in ctx.expense_by_category
                        else "no recorded spend — change applied to total",
                        "engine"),
            ],
            summary=(
                f"{cat_label}: ₹{float(current_cat):,.0f} → "
                f"₹{float(new_cat):,.0f} per month "
                f"(₹{float(-delta):,.0f} {'more' if delta < 0 else 'less'} "
                f"{'saved' if delta < 0 else 'spent'})."
            ),
            explanation=[
                f"Annualised difference: ₹{float(abs(delta) * 12):,.0f}.",
            ],
            apply=apply,
        )

    def _budget_change(
        self, params: S.BudgetChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        income = ctx.monthly_income
        expenses = ctx.monthly_expenses
        assert income is not None and expenses is not None

        name = (params.category_name or "").strip().lower()
        budget = self._budget_for(ctx, name)
        if budget is None and params.budget_id:
            budget = next(
                (b for b in ctx.budgets if b["id"] == str(params.budget_id)),
                None,
            )
        if budget is None:
            return ScenarioComputation(
                status=ScenarioRunStatus.INSUFFICIENT_DATA,
                missing_data=["matching budget"],
                summary="I couldn't find a budget for that category.",
            )

        old_limit = Decimal(str(budget["monthly_limit"]))
        new_limit = params.new_monthly_limit
        cat_name = (budget.get("category_name") or name or "Category")
        current_spend = ctx.expense_by_category.get(cat_name.lower(), old_limit)

        # Assumption: spend follows the cap when the cap is lower.
        assumed_spend = min(current_spend, new_limit)
        delta = assumed_spend - current_spend
        new_expenses = expenses + delta

        metrics = [
            _metric("budgetLimit", f"{cat_name} limit", _f(old_limit), _f(new_limit), MetricUnit.CURRENCY, higher_is_better=False),
            _metric("categorySpend", f"{cat_name} assumed spend", _f(current_spend), _f(assumed_spend), MetricUnit.CURRENCY, higher_is_better=False),
        ]
        metrics += self._cash_flow_metrics(income, expenses, income, new_expenses)

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"budgetLimit": _f(old_limit)},
            scenario={"budgetLimit": _f(new_limit)},
            metrics=metrics,
            assumptions=[
                _assume(
                    "spendFollowsCap",
                    "Spending assumed to follow a lower cap",
                    True, "default",
                ),
            ],
            summary=(
                f"{cat_name} budget ₹{float(old_limit):,.0f} → "
                f"₹{float(new_limit):,.0f}."
            ),
            apply=S.ScenarioApplyAction(
                operation="UPDATE_BUDGET",
                arguments={
                    "categoryName": cat_name,
                    "monthlyLimit": float(new_limit),
                },
                label="Apply budget",
            ),
        )

    @staticmethod
    def _budget_for(ctx: ScenarioContext, name: str) -> dict[str, Any] | None:
        if not name:
            return None
        for b in ctx.budgets:
            if (b.get("category_name") or "").strip().lower() == name:
                return b
        return None

    def _savings_change(
        self, params: S.MonthlySavingsChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        income = ctx.monthly_income
        expenses = ctx.monthly_expenses
        assert income is not None and expenses is not None

        surplus = income - expenses
        delta = params.change_amount
        new_surplus = surplus + delta

        assumptions: list[S.ScenarioAssumption] = []
        metrics = self._cash_flow_metrics(income, expenses, income, expenses - delta)
        metrics += self._goal_impact_metrics(ctx, surplus, new_surplus)
        corpus = self._corpus_metric(surplus, new_surplus, assumptions)
        if corpus:
            metrics.append(corpus)

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"monthlySurplus": _f(surplus)},
            scenario={"monthlySurplus": _f(new_surplus)},
            metrics=metrics,
            assumptions=assumptions + [
                _assume(
                    "discretionaryTradeoff",
                    "Trade-off",
                    f"₹{float(abs(delta)):,.0f} "
                    f"{'more' if delta > 0 else 'less'} discretionary capacity",
                    "engine",
                ),
            ],
            summary=(
                f"Saving ₹{float(delta):,.0f} "
                f"{'more' if delta > 0 else 'less'} each month moves your "
                f"surplus to ₹{float(new_surplus):,.0f}."
            ),
        )

    # ── Goal scenarios ─────────────────────────────────────────────────

    def _goal_contribution_change(
        self, params: S.GoalContributionChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        goal = self._resolve_goal(params.goal_id, params.goal_name, ctx)
        if goal is None:
            return self._no_goal(ctx)
        surplus = ctx.monthly_surplus
        assert surplus is not None

        remaining = Decimal(str(goal["target_amount"])) - Decimal(
            str(goal.get("current_amount") or 0)
        )
        remaining = max(remaining, Decimal("0"))

        # Baseline: what the current surplus capacity implies.
        base_months = self._months_at_capacity(remaining, surplus)
        base_monthly = (
            remaining / calc.months_between(date.today(), goal["target_date"])
            if goal.get("target_date") and remaining > 0
            else remaining
        )

        if params.new_monthly_contribution is not None:
            contribution = params.new_monthly_contribution
        else:
            contribution = (base_monthly if base_monthly > 0 else surplus) + (
                params.additional_monthly or Decimal("0")
            )
        contribution = max(contribution, Decimal("0.01"))

        new_months = float(
            (remaining / contribution).quantize(Decimal("0.1"))
        ) if remaining > 0 else 0.0
        new_completion = calc.add_months(date.today(), int(new_months + 0.999))
        base_completion = (
            calc.add_months(date.today(), int(base_months + 0.999))
            if base_months is not None
            else goal.get("target_date")
        )

        metrics = [
            _metric("goalMonthlyContribution",
                    "Monthly contribution",
                    _f(base_monthly), _f(contribution), MetricUnit.CURRENCY),
            _metric("goalCompletion",
                    f"'{goal['goal_name']}' completion",
                    base_completion, new_completion, MetricUnit.DATE,
                    higher_is_better=False),
            _metric("goalMonths",
                    "Months to goal",
                    base_months, new_months, MetricUnit.MONTHS,
                    higher_is_better=False),
            _metric("discretionaryCapacity",
                    "Discretionary capacity",
                    _f(surplus - base_monthly),
                    _f(surplus - contribution), MetricUnit.CURRENCY),
        ]

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={
                "goal": goal["goal_name"],
                "remaining": _f(remaining),
                "monthlyContribution": _f(base_monthly),
            },
            scenario={"monthlyContribution": _f(contribution)},
            metrics=metrics,
            assumptions=[
                _assume("levelContribution",
                        "Contribution stays level until completion",
                        True, "default"),
            ],
            summary=(
                f"At ₹{float(contribution):,.0f}/month, "
                f"'{goal['goal_name']}' completes in about "
                f"{new_months:.0f} months."
            ),
        )

    def _goal_target_change(
        self, params: S.GoalTargetChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        goal = self._resolve_goal(params.goal_id, params.goal_name, ctx)
        if goal is None:
            return self._no_goal(ctx)

        current = Decimal(str(goal.get("current_amount") or 0))
        old_target = Decimal(str(goal["target_amount"]))
        new_target = params.new_target_amount
        new_remaining = max(new_target - current, Decimal("0"))
        months = (
            calc.months_between(date.today(), goal["target_date"])
            if goal.get("target_date")
            else None
        )
        old_required = (
            max(old_target - current, Decimal("0")) / months
            if months and months > 0 else old_target - current
        )
        new_required = new_remaining / months if months and months > 0 else new_remaining

        metrics = [
            _metric("goalTarget", "Goal target", _f(old_target), _f(new_target), MetricUnit.CURRENCY),
            _metric("goalRemaining", "Amount remaining",
                    _f(max(old_target - current, Decimal("0"))),
                    _f(new_remaining), MetricUnit.CURRENCY, higher_is_better=False),
            _metric("requiredMonthly", "Required monthly contribution",
                    _f(old_required), _f(new_required), MetricUnit.CURRENCY,
                    higher_is_better=False),
        ]

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"goal": goal["goal_name"], "target": _f(old_target)},
            scenario={"target": _f(new_target)},
            metrics=metrics,
            assumptions=[
                _assume("targetDateStable",
                        "Target date unchanged",
                        str(goal.get("target_date") or "not set"), "engine"),
            ],
            summary=(
                f"'{goal['goal_name']}' target ₹{float(old_target):,.0f} → "
                f"₹{float(new_target):,.0f}; required monthly contribution "
                f"becomes ₹{float(new_required):,.0f}."
            ),
            apply=S.ScenarioApplyAction(
                operation="UPDATE_GOAL",
                arguments={
                    "goalName": goal["goal_name"],
                    "targetAmount": float(new_target),
                },
                label="Apply goal target",
            ),
        )

    def _goal_deadline_change(
        self, params: S.GoalDeadlineChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        goal = self._resolve_goal(params.goal_id, params.goal_name, ctx)
        if goal is None:
            return self._no_goal(ctx)
        surplus = ctx.monthly_surplus
        assert surplus is not None

        remaining = max(
            Decimal(str(goal["target_amount"]))
            - Decimal(str(goal.get("current_amount") or 0)),
            Decimal("0"),
        )
        old_date = goal.get("target_date")
        new_date = params.new_target_date
        old_months = (
            calc.months_between(date.today(), old_date) if old_date else None
        )
        new_months = calc.months_between(date.today(), new_date)
        old_required = remaining / old_months if old_months and old_months > 0 else remaining
        new_required = remaining / new_months if new_months > 0 else remaining

        metrics = [
            _metric("goalTargetDate", "Target date",
                    old_date, new_date, MetricUnit.DATE),
            _metric("goalMonths", "Months to deadline",
                    _f(Decimal(old_months)) if old_months is not None else None,
                    float(new_months), MetricUnit.MONTHS),
            _metric("requiredMonthly", "Required monthly contribution",
                    _f(old_required), _f(new_required), MetricUnit.CURRENCY,
                    higher_is_better=False),
            _metric("surplusShare", "Share of monthly surplus",
                    _f((old_required / surplus * 100) if surplus > 0 else None),
                    _f((new_required / surplus * 100) if surplus > 0 else None),
                    MetricUnit.PERCENT, higher_is_better=False),
        ]

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"goal": goal["goal_name"], "targetDate": str(old_date)},
            scenario={"targetDate": new_date.isoformat()},
            metrics=metrics,
            summary=(
                f"Moving '{goal['goal_name']}' to {new_date.isoformat()} "
                f"changes the required monthly contribution to "
                f"₹{float(new_required):,.0f}."
            ),
            apply=S.ScenarioApplyAction(
                operation="UPDATE_GOAL",
                arguments={
                    "goalName": goal["goal_name"],
                    "targetDate": new_date.isoformat(),
                },
                label="Apply goal date",
            ),
        )

    @staticmethod
    def _resolve_goal(
        goal_id: uuid.UUID | None,
        goal_name: str | None,
        ctx: ScenarioContext,
    ) -> dict[str, Any] | None:
        goals = [_goal_dict(g) for g in ctx.goals]
        if goal_id:
            for g in goals:
                if str(g.get("id")) == str(goal_id):
                    return g
            return None
        if goal_name:
            name = goal_name.strip().lower()
            exact = [g for g in goals if str(g.get("goal_name", "")).lower() == name]
            if len(exact) == 1:
                return exact[0]
            partial = [g for g in goals if name in str(g.get("goal_name", "")).lower()]
            if len(partial) == 1:
                return partial[0]
            return None
        # No reference → the primary goal (nearest incomplete deadline).
        return ScenarioEngine._primary_goal(ctx)

    @staticmethod
    def _no_goal(ctx: ScenarioContext) -> ScenarioComputation:
        return ScenarioComputation(
            status=ScenarioRunStatus.INSUFFICIENT_DATA,
            missing_data=["goals"],
            summary="I couldn't find that goal in your records.",
        )

    # ── Purchase ───────────────────────────────────────────────────────

    def _purchase(
        self, params: S.PurchaseParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        income = ctx.monthly_income
        expenses = ctx.monthly_expenses
        assert income is not None and expenses is not None

        surplus = income - expenses
        amount = params.purchase_amount
        months = params.months_from_now
        savings = ctx.cash_savings or Decimal("0")

        accumulated = surplus * months
        available = savings + max(accumulated, Decimal("0"))
        buffer_after = available - amount

        # Approximate delay: months of surplus needed to re-save the spend.
        delay = (
            float((amount / surplus).quantize(Decimal("0.1")))
            if surplus > 0 else None
        )

        metrics = [
            _metric("purchaseAmount", "Purchase amount",
                    None, _f(amount), MetricUnit.CURRENCY,
                    higher_is_better=False),
            _metric("availableBuffer",
                    f"Available buffer in {months}m",
                    _f(savings), _f(available), MetricUnit.CURRENCY),
            _metric("postPurchaseBuffer", "Buffer after purchase",
                    _f(available), _f(buffer_after), MetricUnit.CURRENCY,
                    higher_is_better=False),
            _metric("goalDelay", "Estimated plan delay",
                    0.0, delay, MetricUnit.MONTHS, higher_is_better=False),
        ]

        # Timing alternatives: now / +3m / +6m.
        alternatives: list[dict[str, Any]] = []
        for alt in sorted({0, 3, 6, months}):
            alt_available = savings + max(surplus * alt, Decimal("0"))
            alternatives.append({
                "label": "Now" if alt == 0 else f"In {alt} months",
                "monthsFromNow": alt,
                "availableBuffer": _f(alt_available),
                "postPurchaseBuffer": _f(alt_available - amount),
            })

        missing = [] if ctx.cash_savings is not None else ["savings"]
        assumptions = [
            _assume("funding", "Funding source",
                    "current savings + monthly surplus", "default"),
            _assume("goalDelayModel", "Plan delay estimate",
                    "purchase amount ÷ monthly surplus", "default"),
        ]

        name = params.item_name or "Purchase"
        target_date = calc.add_months(date.today(), months)
        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={
                "cashSavings": _f(ctx.cash_savings),
                "monthlySurplus": _f(surplus),
            },
            scenario={
                "purchaseAmount": _f(amount),
                "monthsFromNow": months,
                "bufferAfter": _f(buffer_after),
            },
            metrics=metrics,
            assumptions=assumptions,
            missing_data=missing,
            alternatives=alternatives,
            summary=(
                f"Buying {name} (₹{float(amount):,.0f}) in {months} month"
                f"{'s' if months != 1 else ''} leaves a projected buffer of "
                f"₹{float(buffer_after):,.0f}"
                + (f" and delays your plan by ~{delay:.0f} months." if delay else ".")
            ),
            apply=S.ScenarioApplyAction(
                operation="CREATE_GOAL",
                arguments={
                    "goalName": name,
                    "targetAmount": float(amount),
                    "targetDate": target_date.isoformat(),
                },
                label="Create a savings goal",
            ),
        )

    # ── Retirement ─────────────────────────────────────────────────────

    def _retirement_projection(
        self, ctx: ScenarioContext, retirement_age: int, inflation: Decimal
    ) -> Any:
        assert ctx.current_age is not None and ctx.monthly_expenses is not None
        return project_retirement(
            current_age=ctx.current_age,
            retirement_age=retirement_age,
            monthly_expenses=ctx.monthly_expenses,
            inflation_rate=inflation,
            safe_withdrawal_rate=Decimal(
                str(settings.scenario_safe_withdrawal_rate)
            ),
        )

    def _retirement_age_change(
        self, params: S.RetirementAgeChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        base_age = ctx.retirement_age or 60
        inflation = Decimal(str(settings.scenario_inflation_rate))
        base = self._retirement_projection(ctx, base_age, inflation)
        new_age = params.new_retirement_age
        if new_age <= (ctx.current_age or 0):
            return ScenarioComputation(
                status=ScenarioRunStatus.INSUFFICIENT_DATA,
                missing_data=["retirement age above current age"],
                summary="The retirement age must be above your current age.",
            )
        new = self._retirement_projection(ctx, new_age, inflation)

        assumptions = [
            _assume("inflation", "Inflation assumption",
                    float(inflation), "default"),
            _assume("withdrawalRate", "Safe withdrawal rate",
                    float(settings.scenario_safe_withdrawal_rate), "default"),
            _assume("baselineRetirementAge", "Current target retirement age",
                    base_age, "user" if ctx.retirement_age else "default"),
        ]
        metrics = [
            _metric("yearsToRetirement", "Years to retirement",
                    base.years_to_retirement, new.years_to_retirement,
                    MetricUnit.COUNT, higher_is_better=False),
            _metric("retirementCorpus", "Required corpus",
                    _f(base.retirement_corpus), _f(new.retirement_corpus),
                    MetricUnit.CURRENCY, higher_is_better=False),
            _metric("futureMonthlyExpenses", "Future monthly expenses",
                    _f(base.future_monthly_expenses),
                    _f(new.future_monthly_expenses),
                    MetricUnit.CURRENCY, higher_is_better=False),
        ]
        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"retirementAge": base_age,
                      "corpus": _f(base.retirement_corpus)},
            scenario={"retirementAge": new_age,
                      "corpus": _f(new.retirement_corpus)},
            metrics=metrics,
            assumptions=assumptions,
            summary=(
                f"Retiring at {new_age} instead of {base_age} changes the "
                f"projected required corpus to ₹{float(new.retirement_corpus):,.0f} "
                f"under the stated assumptions."
            ),
        )

    def _inflation_change(
        self, params: S.InflationChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        base_inflation = Decimal(str(settings.scenario_inflation_rate))
        base_age = ctx.retirement_age or 60
        base = self._retirement_projection(ctx, base_age, base_inflation)
        new = self._retirement_projection(
            ctx, base_age, params.new_inflation_rate
        )

        metrics = [
            _metric("inflationRate", "Inflation assumption",
                    float(base_inflation), float(params.new_inflation_rate),
                    MetricUnit.PERCENT, higher_is_better=False),
            _metric("futureMonthlyExpenses", "Future monthly expenses",
                    _f(base.future_monthly_expenses),
                    _f(new.future_monthly_expenses),
                    MetricUnit.CURRENCY, higher_is_better=False),
            _metric("retirementCorpus", "Required corpus",
                    _f(base.retirement_corpus), _f(new.retirement_corpus),
                    MetricUnit.CURRENCY, higher_is_better=False),
        ]
        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"inflation": float(base_inflation),
                      "corpus": _f(base.retirement_corpus)},
            scenario={"inflation": float(params.new_inflation_rate),
                      "corpus": _f(new.retirement_corpus)},
            metrics=metrics,
            assumptions=[
                _assume("retirementAge", "Retirement age", base_age,
                        "user" if ctx.retirement_age else "default"),
                _assume("withdrawalRate", "Safe withdrawal rate",
                        float(settings.scenario_safe_withdrawal_rate), "default"),
            ],
            summary=(
                f"At {float(params.new_inflation_rate):.0%} inflation, the "
                f"projected required corpus becomes "
                f"₹{float(new.retirement_corpus):,.0f}."
            ),
        )

    # ── Loans ──────────────────────────────────────────────────────────

    def _resolve_loan(
        self,
        loan_id: uuid.UUID | None,
        loan_name: str | None,
        ctx: ScenarioContext,
    ) -> dict[str, Any] | None:
        if loan_id:
            for l in ctx.loans:
                if str(l.get("id")) == str(loan_id):
                    return l
            return None
        if loan_name:
            name = loan_name.strip().lower()
            exact = [
                l for l in ctx.loans
                if name in str(l.get("name", "")).lower()
                or name in str(l.get("liability_type", "")).lower()
            ]
            if len(exact) == 1:
                return exact[0]
            return None
        return ctx.loans[0] if len(ctx.loans) == 1 else None

    def _loan_state(
        self, loan: dict[str, Any]
    ) -> tuple[Decimal, Decimal, Decimal | None, Decimal | None]:
        """(principal, emi, monthly_rate, months_to_close) or Nones."""
        principal = Decimal(str(loan.get("amount") or 0))
        emi = Decimal(str(loan.get("emi") or 0))
        annual_rate = loan.get("interest_rate")
        monthly_rate = (
            Decimal(str(annual_rate)) / 100 / 12
            if annual_rate is not None else None
        )
        tenure = loan.get("remaining_tenure_months")
        if monthly_rate is not None and emi > 0:
            months = calc.loan_months_to_close(principal, monthly_rate, emi)
            if months is None and tenure:
                months = Decimal(str(tenure))
        elif tenure:
            months = Decimal(str(tenure))
        else:
            months = None
        return principal, emi, monthly_rate, months

    def _loan_prepayment(
        self, params: S.LoanPrepaymentParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        loan = self._resolve_loan(params.loan_id, params.loan_name, ctx)
        if loan is None:
            return ScenarioComputation(
                status=ScenarioRunStatus.INSUFFICIENT_DATA,
                missing_data=["matching loan"],
                summary="I couldn't identify which loan you mean.",
            )

        principal, emi, rate, months = self._loan_state(loan)
        missing: list[str] = []
        if emi <= 0:
            missing.append("loan EMI")
        if rate is None and months is None:
            missing.append("interest rate or remaining tenure")
        if missing:
            return ScenarioComputation(
                status=ScenarioRunStatus.INSUFFICIENT_DATA,
                missing_data=missing,
                summary=(
                    "I need the loan's EMI and interest rate (or remaining "
                    "tenure) to estimate prepayment impact."
                ),
            )

        prepay = min(params.prepayment_amount, principal)
        name = loan.get("name") or loan.get("liability_type") or "Loan"

        base_total = calc.loan_total_cost(principal, rate or Decimal("0"), emi, months)
        base_interest = (base_total - principal) if base_total is not None else None

        new_principal = principal - prepay
        if new_principal <= 0:
            new_months: Decimal | None = Decimal("0")
            new_interest = Decimal("0")
        elif rate is not None and emi > 0:
            new_months = calc.loan_months_to_close(new_principal, rate, emi)
            new_interest = (
                (emi * new_months - new_principal) if new_months is not None else None
            )
        else:
            new_months = months  # tenure unchanged without a rate
            new_interest = None

        months_saved = (
            float(months - new_months)
            if months is not None and new_months is not None else None
        )
        interest_saved = (
            (base_interest - new_interest)
            if base_interest is not None and new_interest is not None else None
        )

        assumptions = [
            _assume("prepaymentTreatment", "Prepayment treatment",
                    "reduces principal; EMI unchanged", "default"),
            _assume("rateConstant", "Interest rate held constant",
                    _f(rate * 1200) if rate is not None else None, "engine"),
        ]

        metrics = [
            _metric("outstandingBalance", "Outstanding balance",
                    _f(principal), _f(new_principal), MetricUnit.CURRENCY,
                    higher_is_better=False),
            _metric("remainingMonths", "Months to close",
                    _f(months), _f(new_months), MetricUnit.MONTHS,
                    higher_is_better=False),
            _metric("interestCost", "Estimated interest cost",
                    _f(base_interest), _f(new_interest), MetricUnit.CURRENCY,
                    higher_is_better=False),
            _metric("monthlyEmi", "Monthly EMI",
                    _f(emi), _f(emi), MetricUnit.CURRENCY),
        ]

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={
                "loan": name,
                "outstanding": _f(principal),
                "monthsToClose": _f(months),
            },
            scenario={
                "outstanding": _f(new_principal),
                "monthsToClose": _f(new_months),
            },
            metrics=metrics,
            assumptions=assumptions,
            missing_data=["loan interest rate"] if rate is None else [],
            summary=(
                f"A ₹{float(prepay):,.0f} prepayment on '{name}' "
                + (
                    f"closes it ~{months_saved:.0f} months earlier and saves "
                    f"~₹{float(interest_saved):,.0f} in interest."
                    if months_saved and interest_saved is not None
                    else "reduces the outstanding balance."
                )
            ),
        )

    def _loan_emi_change(
        self, params: S.LoanEmiChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        loan = self._resolve_loan(params.loan_id, params.loan_name, ctx)
        if loan is None:
            return ScenarioComputation(
                status=ScenarioRunStatus.INSUFFICIENT_DATA,
                missing_data=["matching loan"],
                summary="I couldn't identify which loan you mean.",
            )

        principal, emi, rate, months = self._loan_state(loan)
        name = loan.get("name") or loan.get("liability_type") or "Loan"
        new_emi = params.new_emi

        missing: list[str] = []
        if rate is None:
            missing.append("loan interest rate")
        if missing:
            return ScenarioComputation(
                status=ScenarioRunStatus.INSUFFICIENT_DATA,
                missing_data=missing,
                summary=(
                    "I need the loan's interest rate to estimate an EMI change."
                ),
            )

        new_months = calc.loan_months_to_close(principal, rate, new_emi)
        if new_months is None:
            return ScenarioComputation(
                status=ScenarioRunStatus.INSUFFICIENT_DATA,
                missing_data=["EMI above monthly interest"],
                summary="That EMI would not cover the monthly interest.",
            )

        base_interest = (
            emi * months - principal if months is not None else None
        )
        new_interest = new_emi * new_months - principal
        emi_delta = new_emi - emi

        metrics = [
            _metric("monthlyEmi", "Monthly EMI",
                    _f(emi), _f(new_emi), MetricUnit.CURRENCY,
                    higher_is_better=False),
            _metric("remainingMonths", "Months to close",
                    _f(months), _f(new_months), MetricUnit.MONTHS,
                    higher_is_better=False),
            _metric("interestCost", "Estimated interest cost",
                    _f(base_interest), _f(new_interest), MetricUnit.CURRENCY,
                    higher_is_better=False),
            _metric("monthlySurplus", "Monthly surplus",
                    _f(ctx.monthly_surplus),
                    _f(ctx.monthly_surplus - emi_delta)
                    if ctx.monthly_surplus is not None else None,
                    MetricUnit.CURRENCY),
        ]

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"loan": name, "emi": _f(emi), "monthsToClose": _f(months)},
            scenario={"emi": _f(new_emi), "monthsToClose": _f(new_months)},
            metrics=metrics,
            assumptions=[
                _assume("rateConstant", "Interest rate held constant",
                        _f(rate * 1200), "engine"),
            ],
            summary=(
                f"At ₹{float(new_emi):,.0f}/month, '{name}' closes in about "
                f"{float(new_months):.0f} months."
            ),
        )

    # ── Emergency fund ─────────────────────────────────────────────────

    def _emergency_fund_change(
        self, params: S.EmergencyFundTargetChangeParams, ctx: ScenarioContext
    ) -> ScenarioComputation:
        expenses = ctx.monthly_expenses
        assert expenses is not None

        current = ctx.emergency_fund or Decimal("0")
        current_months = (
            float((current / expenses).quantize(Decimal("0.1")))
            if expenses > 0 else None
        )
        target = expenses * params.target_months
        gap = target - current
        contribution = params.monthly_contribution or ctx.monthly_surplus
        months_to_target = (
            float((gap / contribution).quantize(Decimal("0.1")))
            if contribution and contribution > 0 and gap > 0
            else 0.0
        )

        metrics = [
            _metric("emergencyFund", "Emergency fund",
                    _f(current), _f(target), MetricUnit.CURRENCY),
            _metric("runwayMonths", "Months of cover",
                    current_months, float(params.target_months),
                    MetricUnit.MONTHS),
            _metric("fundGap", "Funding gap",
                    _f(gap), 0.0, MetricUnit.CURRENCY, higher_is_better=False),
            _metric("monthsToTarget", "Months to target",
                    None, months_to_target, MetricUnit.MONTHS,
                    higher_is_better=False),
        ]

        assumptions = [
            _assume("monthlyContribution", "Monthly contribution",
                    _f(contribution) if contribution else None,
                    "user" if params.monthly_contribution else "engine"),
        ]
        if ctx.emergency_fund is None:
            assumptions.append(_assume(
                "emergencyBaseline", "Emergency fund baseline",
                "no emergency-fund records — treated as ₹0", "default",
            ))

        return ScenarioComputation(
            status=ScenarioRunStatus.COMPUTED,
            baseline={"emergencyFund": _f(current),
                      "coverMonths": current_months},
            scenario={"emergencyFund": _f(target),
                      "coverMonths": float(params.target_months)},
            metrics=metrics,
            assumptions=assumptions,
            missing_data=[] if ctx.emergency_fund is not None else ["emergency_fund"],
            summary=(
                f"A {params.target_months}-month emergency fund needs "
                f"₹{float(target):,.0f} — a gap of ₹{float(max(gap, Decimal('0'))):,.0f}."
            ),
        )
