from __future__ import annotations

from decimal import Decimal

import pytest

from app.engines.budget_engine import analyze_budget
from app.engines.goal_engine import project_goals
from app.engines.health_score import calculate_health_score
from app.engines.networth_engine import calculate_net_worth
from app.engines.retirement_engine import project_retirement
from app.engines.tax_engine import Deductions, calculate_tax


def test_health_score_perfect():
    result = calculate_health_score(
        monthly_income=Decimal("100000"),
        monthly_expenses=Decimal("50000"),
        emergency_assets=Decimal("300000"),
        total_debt=Decimal("100000"),
        annual_income=Decimal("1200000"),
        average_goal_progress=Decimal("0.8"),
        average_budget_utilization=Decimal("0.5"),
    )
    assert result.overall_score == Decimal("100")
    assert result.savings_score == Decimal("30")
    assert result.emergency_score == Decimal("20")
    assert result.debt_score == Decimal("20")
    assert result.goal_score == Decimal("15")
    assert result.budget_score == Decimal("15")


def test_health_score_low_savings():
    result = calculate_health_score(
        monthly_income=Decimal("100000"),
        monthly_expenses=Decimal("95000"),
        emergency_assets=Decimal("0"),
        total_debt=Decimal("500000"),
        annual_income=Decimal("1200000"),
        average_goal_progress=Decimal("0.1"),
        average_budget_utilization=Decimal("1.2"),
    )
    assert result.overall_score < Decimal("60")


def test_budget_analysis():
    result = analyze_budget(
        monthly_income=Decimal("100000"),
        total_spent=Decimal("60000"),
        category_spending={
            "food": Decimal("15000"),
            "rent": Decimal("20000"),
            "other": Decimal("5000"),
        },
        budgets={
            "food": ("Food", Decimal("20000")),
            "rent": ("Rent", Decimal("25000")),
            "other": ("Other", Decimal("10000")),
        },
    )
    assert result.total_budget == Decimal("55000")
    assert result.total_spent == Decimal("60000")
    assert result.savings_opportunity == Decimal("40000")
    assert len(result.recommendations) > 0


def test_goal_projection():
    goals = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "goal_name": "Vacation",
            "target_amount": 100000,
            "current_amount": 20000,
            "target_date": "2030-12-31",
        },
    ]
    result = project_goals(goals, Decimal("15000"))
    assert len(result.goals) == 1
    assert result.goals[0].monthly_contribution > Decimal("0")


def test_retirement_projection():
    result = project_retirement(
        current_age=30,
        retirement_age=60,
        monthly_expenses=Decimal("50000"),
    )
    assert result.years_to_retirement == 30
    assert result.future_monthly_expenses > result.current_monthly_expenses
    assert result.retirement_corpus > Decimal("0")


def test_tax_old_regime():
    deductions = Deductions(
        section_80c=Decimal("150000"),
        section_80d=Decimal("25000"),
    )
    result = calculate_tax(
        gross_income=Decimal("1200000"),
        deductions=deductions,
        regime="old",
    )
    assert result.taxable_income == Decimal("975000")
    assert result.total_tax > Decimal("0")


def test_tax_new_regime():
    deductions = Deductions(standard_deduction=Decimal("50000"))
    result = calculate_tax(
        gross_income=Decimal("1200000"),
        deductions=deductions,
        regime="new",
    )
    assert result.taxable_income == Decimal("1150000")
    assert result.total_tax > Decimal("0")


def test_net_worth():
    assets = [
        {"asset_type": "Bank", "value": Decimal("100000")},
        {"asset_type": "Stock", "value": Decimal("50000")},
    ]
    liabilities = [
        {"liability_type": "Home Loan", "amount": Decimal("30000")},
    ]
    result = calculate_net_worth(assets, liabilities)
    assert result.total_assets == Decimal("150000")
    assert result.total_liabilities == Decimal("30000")
    assert result.net_worth == Decimal("120000")
