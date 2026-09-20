from __future__ import annotations

from collections import Counter
from typing import Any

from app.financial.schemas import Recommendation, RecommendationResult


class RecommendationEngine:
    """Deterministic recommendation engine built from engine outputs.

    Engine outputs arrive as camelCase model dumps (the canonical tool/agent
    payload contract), so keys here match the API schema aliases.
    """

    @staticmethod
    def generate(engine_outputs: dict[str, Any]) -> RecommendationResult:
        recommendations: list[Recommendation] = []

        budget = engine_outputs.get("BudgetAgent", {})
        if budget and budget.get("overspendingCategories"):
            for cat in budget["overspendingCategories"][:3]:
                recommendations.append(
                    Recommendation(
                        title=f"Reduce {cat.get('categoryName', 'overspending')}",
                        description="You are over budget in this category. Set a stricter limit next month.",
                        category="budget",
                        priority="high",
                    )
                )

        health = engine_outputs.get("HealthAgent", {})
        if health and float(health.get("overallScore", 0)) < 70:
            recommendations.append(
                Recommendation(
                    title="Build emergency fund",
                    description="Your financial health score has room to improve. Prioritise 3–6 months of expenses in liquid savings.",
                    category="emergency",
                    priority="high",
                )
            )

        goal = engine_outputs.get("GoalAgent", {})
        if goal:
            for g in goal.get("goals", []):
                if isinstance(g, dict) and float(g.get("completionPercentage", 0)) < 50:
                    recommendations.append(
                        Recommendation(
                            title="Catch up on a goal",
                            description="Your goal is behind track. Consider increasing monthly contributions.",
                            category="goals",
                            priority="medium",
                        )
                    )

        tax = engine_outputs.get("TaxAgent", {})
        if tax and float(tax.get("savings", 0)) > 0:
            recommendations.append(
                Recommendation(
                    title="Review tax regime",
                    description=f"Switching to the {tax.get('betterRegime', 'recommended')} regime could save you money.",
                    category="tax",
                    priority="medium",
                )
            )

        cash_flow = engine_outputs.get("CashFlowAgent", {})
        if cash_flow and float(cash_flow.get("savingsRate", 0)) < 0.2:
            recommendations.append(
                Recommendation(
                    title="Increase savings rate",
                    description="Aim to save at least 20% of income by trimming discretionary expenses.",
                    category="savings",
                    priority="high",
                )
            )

        if not recommendations:
            recommendations.append(
                Recommendation(
                    title="Track expenses weekly",
                    description="Regular review helps spot overspending and keep goals on track.",
                    category="budget",
                    priority="low",
                )
            )

        priorities = Counter(r.priority for r in recommendations)
        return RecommendationResult(
            recommendations=recommendations,
            priority_summary={"high": priorities.get("high", 0), "medium": priorities.get("medium", 0), "low": priorities.get("low", 0)},
        )
