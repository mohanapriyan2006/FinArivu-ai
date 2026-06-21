"""Tests for Financial Health Score Engine."""

from decimal import Decimal

from engines.financial_health_engine import FinancialHealthEngine, FinancialHealthInput


class TestFinancialHealthEngine:
    """Test financial health score calculations."""

    def test_excellent_score(self):
        """High performance across all metrics should score Excellent."""
        data = FinancialHealthInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("50000"),
            emergency_assets=Decimal("500000"),
            total_debt=Decimal("0"),
            annual_income=Decimal("1200000"),
            goals=[{"current_amount": 800000, "target_amount": 1000000}],
            budget_overall_usage=70.0,
        )
        result = FinancialHealthEngine.calculate(data)
        assert result.score >= 90
        assert result.grade == "Excellent"

    def test_savings_rate_scoring(self):
        """Savings rate brackets are scored correctly."""
        # >=30% = 30
        data = FinancialHealthInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("60000"),
            emergency_assets=Decimal("0"),
            total_debt=Decimal("0"),
            annual_income=Decimal("1200000"),
            goals=[],
            budget_overall_usage=0.0,
        )
        result = FinancialHealthEngine.calculate(data)
        assert result.savings_score == 30

        # 20-29% = 25
        data.monthly_expenses = Decimal("75000")
        result = FinancialHealthEngine.calculate(data)
        assert result.savings_score == 25

        # 10-19% = 15
        data.monthly_expenses = Decimal("85000")
        result = FinancialHealthEngine.calculate(data)
        assert result.savings_score == 15

        # <10% = 5
        data.monthly_expenses = Decimal("95000")
        result = FinancialHealthEngine.calculate(data)
        assert result.savings_score == 5

    def test_emergency_fund_scoring(self):
        """Emergency fund months are scored correctly."""
        base = FinancialHealthInput(
            monthly_income=Decimal("50000"),
            monthly_expenses=Decimal("50000"),
            emergency_assets=Decimal("0"),
            total_debt=Decimal("0"),
            annual_income=Decimal("600000"),
            goals=[],
            budget_overall_usage=0.0,
        )

        # >=6 months = 20
        base.emergency_assets = Decimal("300000")
        assert FinancialHealthEngine.calculate(base).emergency_score == 20

        # 3-5 months = 15
        base.emergency_assets = Decimal("200000")
        assert FinancialHealthEngine.calculate(base).emergency_score == 15

        # 1-2 months = 10
        base.emergency_assets = Decimal("50000")
        assert FinancialHealthEngine.calculate(base).emergency_score == 10

        # <1 month = 5
        base.emergency_assets = Decimal("0")
        assert FinancialHealthEngine.calculate(base).emergency_score == 5

    def test_debt_ratio_scoring(self):
        """Debt ratio brackets are scored correctly."""
        base = FinancialHealthInput(
            monthly_income=Decimal("50000"),
            monthly_expenses=Decimal("50000"),
            emergency_assets=Decimal("0"),
            total_debt=Decimal("0"),
            annual_income=Decimal("600000"),
            goals=[],
            budget_overall_usage=0.0,
        )

        # <20% = 20
        base.total_debt = Decimal("100000")
        assert FinancialHealthEngine.calculate(base).debt_score == 20

        # 20-50% = 15
        base.total_debt = Decimal("200000")
        assert FinancialHealthEngine.calculate(base).debt_score == 15

        # 50-100% = 10
        base.total_debt = Decimal("400000")
        assert FinancialHealthEngine.calculate(base).debt_score == 10

        # >100% = 5
        base.total_debt = Decimal("700000")
        assert FinancialHealthEngine.calculate(base).debt_score == 5

    def test_goal_progress_scoring(self):
        """Goal progress brackets are scored correctly."""
        base = FinancialHealthInput(
            monthly_income=Decimal("50000"),
            monthly_expenses=Decimal("50000"),
            emergency_assets=Decimal("0"),
            total_debt=Decimal("0"),
            annual_income=Decimal("600000"),
            goals=[{"current_amount": 0, "target_amount": 1000000}],
            budget_overall_usage=0.0,
        )

        # >75% = 15
        base.goals = [{"current_amount": 800000, "target_amount": 1000000}]
        assert FinancialHealthEngine.calculate(base).goal_score == 15

        # 50-75% = 10
        base.goals = [{"current_amount": 500000, "target_amount": 1000000}]
        assert FinancialHealthEngine.calculate(base).goal_score == 10

        # 25-50% = 5
        base.goals = [{"current_amount": 300000, "target_amount": 1000000}]
        assert FinancialHealthEngine.calculate(base).goal_score == 5

        # <25% = 2
        base.goals = [{"current_amount": 100000, "target_amount": 1000000}]
        assert FinancialHealthEngine.calculate(base).goal_score == 2

    def test_budget_discipline_scoring(self):
        """Budget usage brackets are scored correctly."""
        base = FinancialHealthInput(
            monthly_income=Decimal("50000"),
            monthly_expenses=Decimal("50000"),
            emergency_assets=Decimal("0"),
            total_debt=Decimal("0"),
            annual_income=Decimal("600000"),
            goals=[],
            budget_overall_usage=0.0,
        )

        # <90% = 15
        base.budget_overall_usage = 80.0
        assert FinancialHealthEngine.calculate(base).budget_score == 15

        # 90-100% = 10
        base.budget_overall_usage = 95.0
        assert FinancialHealthEngine.calculate(base).budget_score == 10

        # 100-110% = 5
        base.budget_overall_usage = 105.0
        assert FinancialHealthEngine.calculate(base).budget_score == 5

        # >110% = 2
        base.budget_overall_usage = 120.0
        assert FinancialHealthEngine.calculate(base).budget_score == 2

    def test_grade_boundaries(self):
        """Grade boundaries are correct."""
        assert FinancialHealthEngine._get_grade(95) == "Excellent"
        assert FinancialHealthEngine._get_grade(89) == "Good"
        assert FinancialHealthEngine._get_grade(74) == "Fair"
        assert FinancialHealthEngine._get_grade(59) == "Needs Improvement"

    def test_insights_generated(self):
        """Insights are generated for low scores."""
        data = FinancialHealthInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("95000"),
            emergency_assets=Decimal("0"),
            total_debt=Decimal("500000"),
            annual_income=Decimal("1200000"),
            goals=[],
            budget_overall_usage=120.0,
        )
        result = FinancialHealthEngine.calculate(data)
        assert len(result.insights) > 0
        # Should contain insights about savings, emergency, debt, and budget
        insight_text = " ".join(result.insights)
        assert "savings" in insight_text.lower() or "expenses" in insight_text.lower()

    def test_empty_goals(self):
        """Empty goals list returns minimum goal score."""
        data = FinancialHealthInput(
            monthly_income=Decimal("50000"),
            monthly_expenses=Decimal("50000"),
            emergency_assets=Decimal("0"),
            total_debt=Decimal("0"),
            annual_income=Decimal("600000"),
            goals=[],
            budget_overall_usage=0.0,
        )
        result = FinancialHealthEngine.calculate(data)
        assert result.goal_score == 2
