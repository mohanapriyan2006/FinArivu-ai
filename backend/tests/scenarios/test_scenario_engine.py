"""Deterministic engine tests — math correctness and metric directions."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.scenarios.context import ScenarioContext
from app.scenarios.engine import ScenarioEngine
from app.scenarios.registry import SCENARIO_REGISTRY, get_definition
from app.scenarios.scenario_types import (
    MetricDirection,
    ScenarioRunStatus,
    ScenarioType,
)
from app.scenarios import schemas as S


def _ctx(**overrides) -> ScenarioContext:
    ctx = ScenarioContext(
        monthly_income=Decimal("100000"),
        monthly_expenses=Decimal("60000"),
        cash_savings=Decimal("200000"),
        emergency_fund=Decimal("120000"),
        goals=[
            {
                "id": "g1",
                "goal_name": "Laptop",
                "target_amount": 120000,
                "current_amount": 0,
                "target_date": date(2027, 6, 1),
            }
        ],
        loans=[
            {
                "id": "l1",
                "name": "Home Loan",
                "liability_type": "Home Loan",
                "amount": 1000000,
                "emi": 12000,
                "interest_rate": 9.0,
                "remaining_tenure_months": None,
            }
        ],
        current_age=30,
        retirement_age=60,
    )
    for key, value in overrides.items():
        setattr(ctx, key, value)
    return ctx


def _run(stype: ScenarioType, params, ctx) -> object:
    definition = get_definition(stype)
    assert definition is not None
    engine = ScenarioEngine()
    return engine.run(definition, params, ctx)


def _metric(result, key):
    return next(m for m in result.metrics if m.key == key)


class TestIncomeChange:
    def test_percent_increase(self):
        result = _run(
            ScenarioType.INCOME_CHANGE,
            S.IncomeChangeParams(change_type="percent", change_value=Decimal("10")),
            _ctx(),
        )
        assert result.status == ScenarioRunStatus.COMPUTED
        income = _metric(result, "monthlyIncome")
        assert income.before == 100000.0
        assert income.after == pytest.approx(110000.0)
        surplus = _metric(result, "monthlySurplus")
        assert surplus.before == 40000.0
        assert surplus.after == pytest.approx(50000.0)
        assert surplus.direction == MetricDirection.IMPROVES

    def test_amount_decrease(self):
        result = _run(
            ScenarioType.INCOME_CHANGE,
            S.IncomeChangeParams(change_type="amount", change_value=Decimal("-20000")),
            _ctx(),
        )
        surplus = _metric(result, "monthlySurplus")
        assert surplus.after == pytest.approx(20000.0)
        assert surplus.direction == MetricDirection.WORSENS

    def test_missing_income(self):
        ctx = _ctx(monthly_income=None)
        result = _run(
            ScenarioType.INCOME_CHANGE,
            S.IncomeChangeParams(change_type="percent", change_value=Decimal("10")),
            ctx,
        )
        assert result.status == ScenarioRunStatus.INSUFFICIENT_DATA
        assert "monthly_income" in result.missing_data


class TestExpenseChange:
    def test_percent_decrease(self):
        result = _run(
            ScenarioType.EXPENSE_CHANGE,
            S.ExpenseChangeParams(change_type="percent", change_value=Decimal("-20")),
            _ctx(),
        )
        exp = _metric(result, "monthlyExpenses")
        assert exp.after == pytest.approx(48000.0)
        surplus = _metric(result, "monthlySurplus")
        assert surplus.after == pytest.approx(52000.0)
        assert surplus.direction == MetricDirection.IMPROVES


class TestCategorySpending:
    def test_category_delta(self):
        ctx = _ctx(expense_by_category={"dining": Decimal("8000")})
        result = _run(
            ScenarioType.CATEGORY_SPENDING_CHANGE,
            S.CategorySpendingChangeParams(
                category_name="dining",
                change_type="amount",
                change_value=Decimal("-3000"),
            ),
            ctx,
        )
        cat = _metric(result, "categorySpend")
        assert cat.before == 8000.0
        assert cat.after == 5000.0
        surplus = _metric(result, "monthlySurplus")
        assert surplus.after == 43000.0
        # Apply bridge creates a budget for the new level.
        assert result.apply is not None
        assert result.apply.operation in ("CREATE_BUDGET", "UPDATE_BUDGET")
        assert result.apply.arguments["monthlyLimit"] == 5000.0


class TestSavings:
    def test_more_savings(self):
        result = _run(
            ScenarioType.MONTHLY_SAVINGS_CHANGE,
            S.MonthlySavingsChangeParams(change_amount=Decimal("5000")),
            _ctx(),
        )
        surplus = _metric(result, "monthlySurplus")
        assert surplus.after == 45000.0
        corpus = _metric(result, "projectedCorpus")
        assert corpus.after > corpus.before


class TestGoals:
    def test_target_change(self):
        result = _run(
            ScenarioType.GOAL_TARGET_CHANGE,
            S.GoalTargetChangeParams(
                goal_name="laptop", new_target_amount=Decimal("180000")
            ),
            _ctx(),
        )
        target = _metric(result, "goalTarget")
        assert target.before == 120000.0
        assert target.after == 180000.0
        assert result.apply.arguments["goalName"] == "Laptop"

    def test_deadline_change(self):
        result = _run(
            ScenarioType.GOAL_DEADLINE_CHANGE,
            S.GoalDeadlineChangeParams(
                goal_name="Laptop", new_target_date=date(2028, 1, 1)
            ),
            _ctx(),
        )
        req = _metric(result, "requiredMonthly")
        # 20+ months out needs less per month than the June-2027 deadline.
        assert req.after < req.before

    def test_goal_not_found(self):
        result = _run(
            ScenarioType.GOAL_TARGET_CHANGE,
            S.GoalTargetChangeParams(
                goal_name="car", new_target_amount=Decimal("500000")
            ),
            _ctx(),
        )
        assert result.status == ScenarioRunStatus.INSUFFICIENT_DATA


class TestPurchase:
    def test_affordability(self):
        result = _run(
            ScenarioType.PURCHASE,
            S.PurchaseParams(
                purchase_amount=Decimal("150000"),
                item_name="Bike",
                months_from_now=3,
            ),
            _ctx(),
        )
        buffer = _metric(result, "postPurchaseBuffer")
        # 200000 savings + 3 * 40000 surplus - 150000 = 170000
        assert buffer.after == 170000.0
        assert len(result.alternatives) >= 3
        assert result.apply.operation == "CREATE_GOAL"


class TestRetirement:
    def test_earlier_retirement_needs_more(self):
        result = _run(
            ScenarioType.RETIREMENT_AGE_CHANGE,
            S.RetirementAgeChangeParams(new_retirement_age=50),
            _ctx(),
        )
        years = _metric(result, "yearsToRetirement")
        assert years.before == 30
        assert years.after == 20
        corpus = _metric(result, "retirementCorpus")
        assert corpus.after < corpus.before
        assert corpus.direction == MetricDirection.IMPROVES

    def test_requires_age(self):
        result = _run(
            ScenarioType.RETIREMENT_AGE_CHANGE,
            S.RetirementAgeChangeParams(new_retirement_age=55),
            _ctx(current_age=None),
        )
        assert result.status == ScenarioRunStatus.INSUFFICIENT_DATA


class TestLoans:
    def test_prepayment_closes_early(self):
        result = _run(
            ScenarioType.LOAN_PREPAYMENT,
            S.LoanPrepaymentParams(
                loan_name="home", prepayment_amount=Decimal("200000")
            ),
            _ctx(),
        )
        balance = _metric(result, "outstandingBalance")
        assert balance.after == 800000.0
        months = _metric(result, "remainingMonths")
        assert months.after < months.before
        interest = _metric(result, "interestCost")
        assert interest.after < interest.before

    def test_prepay_over_balance_closes(self):
        result = _run(
            ScenarioType.LOAN_PREPAYMENT,
            S.LoanPrepaymentParams(
                loan_name="home", prepayment_amount=Decimal("2000000")
            ),
            _ctx(),
        )
        balance = _metric(result, "outstandingBalance")
        assert balance.after == 0.0

    def test_emi_change(self):
        result = _run(
            ScenarioType.LOAN_EMI_CHANGE,
            S.LoanEmiChangeParams(loan_name="home", new_emi=Decimal("20000")),
            _ctx(),
        )
        months = _metric(result, "remainingMonths")
        assert months.after < months.before
        assert months.direction == MetricDirection.IMPROVES

    def test_emi_below_interest(self):
        result = _run(
            ScenarioType.LOAN_EMI_CHANGE,
            S.LoanEmiChangeParams(loan_name="home", new_emi=Decimal("5000")),
            _ctx(),
        )
        # 5000 < 7500 monthly interest → cannot amortise.
        assert result.status == ScenarioRunStatus.INSUFFICIENT_DATA


class TestEmergencyFund:
    def test_target_gap(self):
        result = _run(
            ScenarioType.EMERGENCY_FUND_TARGET_CHANGE,
            S.EmergencyFundTargetChangeParams(target_months=6),
            _ctx(),
        )
        fund = _metric(result, "emergencyFund")
        assert fund.after == 360000.0  # 6 * 60000
        gap = _metric(result, "fundGap")
        assert gap.before == 240000.0  # 360000 - 120000


class TestMetricDirections:
    def test_currency_and_direction_enum(self):
        result = _run(
            ScenarioType.EXPENSE_CHANGE,
            S.ExpenseChangeParams(change_type="amount", change_value=Decimal("5000")),
            _ctx(),
        )
        exp = _metric(result, "monthlyExpenses")
        assert exp.direction == MetricDirection.WORSENS
        assert exp.change == pytest.approx(5000.0)


class TestRegistry:
    def test_all_types_registered(self):
        assert len(SCENARIO_REGISTRY) == len(ScenarioType) == 14
        for st in ScenarioType:
            assert st in SCENARIO_REGISTRY

    def test_unknown_type(self):
        assert get_definition("NOT_A_SCENARIO") is None
        assert get_definition("income_change") is not None

    def test_required_params_present(self):
        for definition in SCENARIO_REGISTRY.values():
            for field_name in definition.required_params:
                assert field_name in definition.param_model.model_fields
