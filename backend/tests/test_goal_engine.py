"""Tests for Goal Planning Engine."""

from datetime import date, timedelta
from decimal import Decimal

from engines.goal_engine import GoalEngine, GoalInput


class TestGoalEngine:
    """Test goal engine calculations."""

    def test_plan_calculates_monthly_saving(self):
        """Required monthly saving is calculated correctly."""
        target = date.today() + timedelta(days=365 * 5)  # ~60 months
        goal = GoalInput(
            target_amount=Decimal("1000000"),
            current_amount=Decimal("250000"),
            target_date=target,
        )
        result = GoalEngine.plan(goal)
        assert result.target_amount == Decimal("1000000")
        assert result.current_amount == Decimal("250000")
        assert result.months_remaining >= 58
        assert result.required_monthly_saving > 0
        assert result.progress == 25.0

    def test_already_funded_goal(self):
        """Goal with current >= target has zero required saving."""
        target = date.today() + timedelta(days=365)
        goal = GoalInput(
            target_amount=Decimal("100000"),
            current_amount=Decimal("150000"),
            target_date=target,
        )
        result = GoalEngine.plan(goal)
        assert result.required_monthly_saving == Decimal("0")
        assert result.progress == 150.0

    def test_batch_plan(self):
        """Batch planning works for multiple goals."""
        goals = [
            GoalInput(
                target_amount=Decimal("100000"),
                current_amount=Decimal("0"),
                target_date=date.today() + timedelta(days=365),
            ),
            GoalInput(
                target_amount=Decimal("200000"),
                current_amount=Decimal("100000"),
                target_date=date.today() + timedelta(days=730),
            ),
        ]
        results = GoalEngine.batch_plan(goals)
        assert len(results) == 2
        assert results[0].progress == 0.0
        assert results[1].progress == 50.0

    def test_past_date(self):
        """Past target date returns 0 months and full remaining amount."""
        goal = GoalInput(
            target_amount=Decimal("100000"),
            current_amount=Decimal("0"),
            target_date=date.today() - timedelta(days=1),
        )
        result = GoalEngine.plan(goal)
        assert result.months_remaining == 0
        assert result.required_monthly_saving == Decimal("100000")
