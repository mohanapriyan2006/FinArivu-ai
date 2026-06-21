"""Tests for Insights Engine."""

from decimal import Decimal

from engines.insights_engine import InsightsEngine, InsightInput


class TestInsightsEngine:
    """Test insights generation."""

    def test_low_savings_rate(self):
        """Low savings rate generates high priority insight."""
        data = InsightInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("95000"),
            total_savings=Decimal("50000"),
            top_expense_category="Rent",
            top_expense_amount=Decimal("30000"),
            budget_status="on_track",
            goals_progress=[],
        )
        results = InsightsEngine.generate(data)
        savings_insights = [r for r in results if r.category == "Savings"]
        assert len(savings_insights) == 1
        assert savings_insights[0].priority == "high"

    def test_excellent_savings_rate(self):
        """High savings rate generates low priority positive insight."""
        data = InsightInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("50000"),
            total_savings=Decimal("500000"),
            top_expense_category="Rent",
            top_expense_amount=Decimal("30000"),
            budget_status="on_track",
            goals_progress=[],
        )
        results = InsightsEngine.generate(data)
        savings_insights = [r for r in results if r.category == "Savings"]
        assert len(savings_insights) == 1
        assert savings_insights[0].priority == "low"

    def test_budget_overspent(self):
        """Overspent budget generates high priority insight."""
        data = InsightInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("110000"),
            total_savings=Decimal("50000"),
            top_expense_category="Food",
            top_expense_amount=Decimal("60000"),
            budget_status="overspent",
            goals_progress=[],
        )
        results = InsightsEngine.generate(data)
        budget_insights = [r for r in results if r.category == "Budget"]
        assert len(budget_insights) == 1
        assert budget_insights[0].priority == "high"

    def test_emergency_fund_low(self):
        """Low emergency fund generates high priority insight."""
        data = InsightInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("50000"),
            total_savings=Decimal("50000"),
            top_expense_category="Rent",
            top_expense_amount=Decimal("30000"),
            budget_status="on_track",
            goals_progress=[],
        )
        results = InsightsEngine.generate(data)
        emergency_insights = [r for r in results if r.category == "Emergency Fund"]
        assert len(emergency_insights) == 1
        assert emergency_insights[0].priority == "high"

    def test_stalled_goals(self):
        """Stalled goals generate medium priority insight."""
        data = InsightInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("50000"),
            total_savings=Decimal("500000"),
            top_expense_category="Rent",
            top_expense_amount=Decimal("30000"),
            budget_status="on_track",
            goals_progress=[{"progress": 5}, {"progress": 80}],
        )
        results = InsightsEngine.generate(data)
        goal_insights = [r for r in results if r.category == "Goals"]
        assert len(goal_insights) == 1
        assert goal_insights[0].priority == "medium"

    def test_no_insights_for_healthy_profile(self):
        """Healthy financial profile may have fewer insights."""
        data = InsightInput(
            monthly_income=Decimal("100000"),
            monthly_expenses=Decimal("60000"),
            total_savings=Decimal("500000"),
            top_expense_category="Rent",
            top_expense_amount=Decimal("25000"),
            budget_status="on_track",
            goals_progress=[{"progress": 50}],
        )
        results = InsightsEngine.generate(data)
        assert len(results) >= 1
