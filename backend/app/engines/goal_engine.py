from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal


@dataclass
class SingleGoalProjection:
    """Projection for an individual financial goal."""

    goal_id: str
    goal_name: str
    target_amount: Decimal
    current_amount: Decimal
    remaining_amount: Decimal
    completion_percentage: Decimal
    target_date: date | None
    months_remaining: int
    monthly_contribution: Decimal
    projected_completion_date: date | None
    status: str
    suggestions: list[str]


@dataclass
class GoalProjection:
    """Result of goal planning projection."""

    goals: list[SingleGoalProjection]
    total_monthly_contribution: Decimal


def _months_between(start: date, end: date) -> int:
    """Return the number of months between two dates (minimum 1)."""
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if end.day < start.day:
        months -= 1
    return max(months, 1)


def project_goals(
    goals: list[dict],
    monthly_savings_rate: Decimal = Decimal("0"),
) -> GoalProjection:
    """Calculate monthly contributions and projections for a list of goals."""
    today = date.today()
    projections: list[SingleGoalProjection] = []
    total_monthly: Decimal = Decimal("0")

    for goal in goals:
        gid = str(goal.get("id", ""))
        name = str(goal.get("goal_name", ""))
        target = Decimal(goal.get("target_amount", 0))
        current = Decimal(goal.get("current_amount", 0))
        target_date = goal.get("target_date")

        remaining = target - current
        if remaining < 0:
            remaining = Decimal("0")

        completion = target > 0 and current / target or Decimal("0")

        if target_date and isinstance(target_date, str):
            target_date = date.fromisoformat(target_date)

        if target_date and remaining > 0:
            months = _months_between(today, target_date)
            monthly = remaining / Decimal(months)
        else:
            months = 0
            monthly = remaining

        total_monthly += monthly

        if completion >= Decimal("1"):
            projected_completion = today
            goal_status = "completed"
        elif target_date:
            projected_completion = target_date
            if monthly <= monthly_savings_rate:
                goal_status = "on_track"
            else:
                goal_status = "needs_attention"
        else:
            projected_completion = None
            goal_status = "active"

        suggestions: list[str] = []
        if remaining > 0 and months > 0:
            suggestions.append(
                f"Save ₹{monthly:,.2f} per month to reach your goal by {target_date}."
            )
        if completion < Decimal("0.25"):
            suggestions.append(
                "Consider automating a small recurring transfer toward this goal."
            )
        if target_date and projected_completion and projected_completion > target_date:
            suggestions.append(
                "At your current savings rate you may miss the target date. Reduce non-essential spending or extend the timeline."
            )

        projections.append(
            SingleGoalProjection(
                goal_id=gid,
                goal_name=name,
                target_amount=target,
                current_amount=current,
                remaining_amount=remaining,
                completion_percentage=completion,
                target_date=target_date,
                months_remaining=months,
                monthly_contribution=monthly,
                projected_completion_date=projected_completion,
                status=goal_status,
                suggestions=suggestions,
            )
        )

    return GoalProjection(
        goals=projections,
        total_monthly_contribution=total_monthly,
    )
