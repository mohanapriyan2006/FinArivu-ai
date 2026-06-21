"""Insights Engine.

Generates actionable financial insights from user data.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class InsightInput:
    """Input data for insight generation."""

    monthly_income: Decimal
    monthly_expenses: Decimal
    total_savings: Decimal
    top_expense_category: str
    top_expense_amount: Decimal
    budget_status: str  # overspent, at_risk, on_track, underutilized
    goals_progress: list[dict]


@dataclass
class InsightResult:
    """Generated financial insight."""

    category: str
    title: str
    description: str
    priority: str  # high, medium, low
    action: str


class InsightsEngine:
    """Engine for generating financial insights."""

    @staticmethod
    def generate(data: InsightInput) -> list[InsightResult]:
        """Generate insights from financial data.

        Args:
            data: InsightInput with financial metrics.

        Returns:
            List of InsightResult with actionable advice.
        """
        insights: list[InsightResult] = []

        # Savings rate insight
        if data.monthly_income > 0:
            savings_rate = float((data.monthly_income - data.monthly_expenses) / data.monthly_income * 100)
            if savings_rate < 10:
                insights.append(
                    InsightResult(
                        category="Savings",
                        title="Low Savings Rate",
                        description=f"Your savings rate is {savings_rate:.1f}%, which is below the recommended 20%.",
                        priority="high",
                        action="Review discretionary expenses and set up automatic transfers to savings.",
                    )
                )
            elif savings_rate >= 30:
                insights.append(
                    InsightResult(
                        category="Savings",
                        title="Excellent Savings Rate",
                        description=f"Your savings rate is {savings_rate:.1f}%, which is excellent.",
                        priority="low",
                        action="Consider investing surplus in mutual funds or PPF for tax benefits.",
                    )
                )

        # Expense concentration insight
        if data.monthly_income > 0:
            top_ratio = float(data.top_expense_amount / data.monthly_income * 100)
            if top_ratio > 50:
                insights.append(
                    InsightResult(
                        category="Expenses",
                        title="High Category Concentration",
                        description=f"{data.top_expense_category} consumes {top_ratio:.1f}% of your income.",
                        priority="high",
                        action="Diversify spending or negotiate better rates for this category.",
                    )
                )

        # Budget insight
        if data.budget_status == "overspent":
            insights.append(
                InsightResult(
                    category="Budget",
                    title="Budget Overspent",
                    description="Your spending has exceeded your planned budget.",
                    priority="high",
                    action="Pause non-essential spending for the rest of the month.",
                )
            )
        elif data.budget_status == "at_risk":
            insights.append(
                InsightResult(
                    category="Budget",
                    title="Budget At Risk",
                    description="You are close to reaching your budget limit.",
                    priority="medium",
                    action="Monitor daily expenses and avoid impulse purchases.",
                )
            )

        # Goal insight
        if data.goals_progress:
            stalled_goals = [g for g in data.goals_progress if g.get("progress", 0) < 10]
            if stalled_goals:
                insights.append(
                    InsightResult(
                        category="Goals",
                        title="Stalled Goals",
                        description=f"{len(stalled_goals)} goal(s) have less than 10% progress.",
                        priority="medium",
                        action="Set up SIPs or recurring deposits aligned with your goals.",
                    )
                )

        # Emergency fund insight
        if data.monthly_expenses > 0:
            months = float(data.total_savings / data.monthly_expenses)
            if months < 3:
                insights.append(
                    InsightResult(
                        category="Emergency Fund",
                        title="Insufficient Emergency Fund",
                        description=f"You have only {months:.1f} months of expenses saved.",
                        priority="high",
                        action="Build an emergency fund covering 3-6 months of expenses before investing.",
                    )
                )

        return insights
