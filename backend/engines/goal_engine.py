"""Goal Planning Engine.

Pure calculation logic for goal planning.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class GoalInput:
    """Input for a single goal calculation."""

    target_amount: Decimal
    current_amount: Decimal
    target_date: date


@dataclass
class GoalPlanResult:
    """Result of goal planning calculation."""

    target_amount: Decimal
    current_amount: Decimal
    months_remaining: int
    required_monthly_saving: Decimal
    progress: float


class GoalEngine:
    """Engine for goal planning calculations."""

    @staticmethod
    def plan(goal: GoalInput) -> GoalPlanResult:
        """Calculate goal plan metrics.

        Args:
            goal: GoalInput with target, current, and deadline.

        Returns:
            GoalPlanResult with months remaining, required savings, and progress.
        """
        today = date.today()

        if goal.target_date <= today:
            months_remaining = 0
        else:
            # Approximate month difference
            months = (goal.target_date.year - today.year) * 12 + (goal.target_date.month - today.month)
            if goal.target_date.day < today.day:
                months -= 1
            months_remaining = max(months, 1)

        remaining_amount = goal.target_amount - goal.current_amount
        remaining_amount = max(remaining_amount, Decimal("0"))

        if months_remaining > 0:
            required_monthly_saving = remaining_amount / months_remaining
        else:
            required_monthly_saving = remaining_amount

        progress = 0.0
        if goal.target_amount > 0:
            progress = float(goal.current_amount / goal.target_amount * 100)

        return GoalPlanResult(
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            months_remaining=months_remaining,
            required_monthly_saving=required_monthly_saving.quantize(Decimal("1")),
            progress=round(progress, 1),
        )

    @staticmethod
    def batch_plan(goals: list[GoalInput]) -> list[GoalPlanResult]:
        """Calculate plans for multiple goals."""
        return [GoalEngine.plan(g) for g in goals]
