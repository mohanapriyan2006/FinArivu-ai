"""Tests for Budget Analysis Engine."""

import uuid
from decimal import Decimal

from engines.budget_engine import BudgetEngine, BudgetItemInput


class TestBudgetEngine:
    """Test budget engine calculations."""

    def test_overspent_budget(self):
        """Usage > 100% should be overspent."""
        items = [
            BudgetItemInput(
                category_id=uuid.uuid4(),
                category_name="Food",
                monthly_limit=Decimal("5000"),
                spent=Decimal("6500"),
            )
        ]
        results = BudgetEngine.analyze(items)
        assert len(results) == 1
        assert results[0].status == "overspent"
        assert results[0].usage == 130.0
        assert results[0].remaining == Decimal("-1500")
        assert "exceeded your planned budget" in results[0].recommendation

    def test_at_risk_budget(self):
        """Usage 90-100% should be at_risk."""
        items = [
            BudgetItemInput(
                category_id=uuid.uuid4(),
                category_name="Food",
                monthly_limit=Decimal("5000"),
                spent=Decimal("4700"),
            )
        ]
        results = BudgetEngine.analyze(items)
        assert results[0].status == "at_risk"
        assert results[0].usage == 94.0

    def test_on_track_budget(self):
        """Usage 50-90% should be on_track."""
        items = [
            BudgetItemInput(
                category_id=uuid.uuid4(),
                category_name="Food",
                monthly_limit=Decimal("5000"),
                spent=Decimal("3000"),
            )
        ]
        results = BudgetEngine.analyze(items)
        assert results[0].status == "on_track"
        assert results[0].usage == 60.0

    def test_underutilized_budget(self):
        """Usage < 50% should be underutilized."""
        items = [
            BudgetItemInput(
                category_id=uuid.uuid4(),
                category_name="Food",
                monthly_limit=Decimal("5000"),
                spent=Decimal("1000"),
            )
        ]
        results = BudgetEngine.analyze(items)
        assert results[0].status == "underutilized"
        assert results[0].usage == 20.0

    def test_multiple_categories(self):
        """Analysis handles multiple categories."""
        items = [
            BudgetItemInput(
                category_id=uuid.uuid4(),
                category_name="Food",
                monthly_limit=Decimal("5000"),
                spent=Decimal("6500"),
            ),
            BudgetItemInput(
                category_id=uuid.uuid4(),
                category_name="Rent",
                monthly_limit=Decimal("15000"),
                spent=Decimal("15000"),
            ),
        ]
        results = BudgetEngine.analyze(items)
        assert len(results) == 2
        assert results[0].status == "overspent"
        assert results[1].status == "at_risk"

    def test_summary_calculation(self):
        """Summary correctly aggregates totals."""
        items = [
            BudgetItemInput(
                category_id=uuid.uuid4(),
                category_name="Food",
                monthly_limit=Decimal("5000"),
                spent=Decimal("3000"),
            ),
            BudgetItemInput(
                category_id=uuid.uuid4(),
                category_name="Rent",
                monthly_limit=Decimal("15000"),
                spent=Decimal("15000"),
            ),
        ]
        results = BudgetEngine.analyze(items)
        summary = BudgetEngine.summarize(results)
        assert summary["total_budget"] == Decimal("20000")
        assert summary["total_spent"] == Decimal("18000")
        assert summary["total_remaining"] == Decimal("2000")
        assert summary["overall_usage"] == 90.0

    def test_empty_items(self):
        """Empty items returns empty results."""
        results = BudgetEngine.analyze([])
        assert results == []
        summary = BudgetEngine.summarize(results)
        assert summary["total_budget"] == 0
        assert summary["overall_usage"] == 0.0
