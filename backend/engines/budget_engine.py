"""Budget Analysis Engine.

Pure calculation logic for budget analysis.
No database calls — all inputs are passed explicitly.
"""

import uuid
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class BudgetItemInput:
    """Input for a single budget category."""

    category_id: uuid.UUID
    category_name: str
    monthly_limit: Decimal
    spent: Decimal


@dataclass
class BudgetAnalysisResult:
    """Result for a single budget category analysis."""

    category: str
    budget: Decimal
    spent: Decimal
    remaining: Decimal
    usage: float
    status: str
    recommendation: str


class BudgetEngine:
    """Engine for budget analysis calculations."""

    @staticmethod
    def analyze(budget_items: list[BudgetItemInput]) -> list[BudgetAnalysisResult]:
        """Analyze budget usage and generate educational recommendations.

        Args:
            budget_items: List of budget items with spending data.

        Returns:
            List of analysis results with recommendations.
        """
        results: list[BudgetAnalysisResult] = []

        for item in budget_items:
            budget = item.monthly_limit
            spent = item.spent
            remaining = budget - spent
            usage = float(spent / budget * 100) if budget > 0 else 0.0

            if usage > 100:
                status = "overspent"
                recommendation = (
                    "Your spending exceeded your planned budget. "
                    "Consider reviewing recurring expenses."
                )
            elif usage >= 90:
                status = "at_risk"
                recommendation = (
                    "You are close to reaching your budget limit. "
                    "Monitor your spending for the rest of the month."
                )
            elif usage < 50:
                status = "underutilized"
                recommendation = (
                    "You are using less than half of your budget. "
                    "Consider if this limit reflects your actual needs."
                )
            else:
                status = "on_track"
                recommendation = (
                    "Your spending is within a healthy range of your budget."
                )

            results.append(
                BudgetAnalysisResult(
                    category=item.category_name,
                    budget=budget,
                    spent=spent,
                    remaining=remaining,
                    usage=round(usage, 1),
                    status=status,
                    recommendation=recommendation,
                )
            )

        return results

    @staticmethod
    def summarize(
        results: list[BudgetAnalysisResult],
    ) -> dict:
        """Generate summary totals from analysis results.

        Args:
            results: List of category analysis results.

        Returns:
            Dict with total_budget, total_spent, total_remaining.
        """
        total_budget = sum(r.budget for r in results)
        total_spent = sum(r.spent for r in results)
        total_remaining = total_budget - total_spent

        return {
            "total_budget": total_budget,
            "total_spent": total_spent,
            "total_remaining": total_remaining,
            "overall_usage": (
                round(float(total_spent / total_budget * 100), 1)
                if total_budget > 0
                else 0.0
            ),
        }
