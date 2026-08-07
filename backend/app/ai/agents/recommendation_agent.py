from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult


class RecommendationAgent(BaseSpecialistAgent):
    """Generates educational, personalised, actionable recommendations.

    Never recommends specific investments, stocks, or funds.
    """

    @property
    def agent_name(self) -> str:
        return "RecommendationAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        financial_context = context.get("financial_context", {})
        if hasattr(financial_context, "model_dump"):
            financial_context = financial_context.model_dump()

        agent_results = context.get("agent_results", [])
        recommendations: list[dict[str, str]] = []

        for result in agent_results:
            if not isinstance(result, dict):
                result = result.model_dump()

            agent_name = result.get("agent_name", "")
            data = result.get("data", {}) or {}

            if agent_name == "BudgetAgent" and data.get("overspendingCategories"):
                for cat in data["overspendingCategories"][:2]:
                    recommendations.append({
                        "title": f"Review {cat.get('category', 'this category')}",
                        "description": (
                            f"You are overspending by ₹{float(cat.get('overspendAmount', 0) or 0):,.0f} "
                            f"in this category. Consider a spending limit next month."
                        ),
                        "category": "budget",
                    })

            if agent_name == "GoalAgent" and data.get("status") in ["behind", "at_risk"]:
                recommendations.append({
                    "title": f"Catch up on {data.get('goal_name', 'your goal')}",
                    "description": (
                        f"You need ₹{float(data.get('monthly_required', 0) or 0):,.0f}/month "
                        f"to stay on track."
                    ),
                    "category": "goals",
                })

            if agent_name == "HealthAgent" and data.get("overallScore", 0) < 70:
                recommendations.append({
                    "title": "Improve financial health",
                    "description": "Build an emergency fund and reduce high-interest debt to raise your score.",
                    "category": "health",
                })

            if agent_name == "TaxAgent" and data.get("better_regime"):
                recommendations.append({
                    "title": "Consider tax regime review",
                    "description": f"The {data['better_regime']} regime looks better by your current numbers.",
                    "category": "tax",
                })

        # Generic recommendations if none were generated.
        if not recommendations:
            recommendations.append({
                "title": "Track expenses regularly",
                "description": "Categorising expenses weekly helps spot overspending early.",
                "category": "budget",
            })
            recommendations.append({
                "title": "Build an emergency fund",
                "description": "Aim for at least 6 months of expenses in a liquid instrument.",
                "category": "savings",
            })

        return AgentResult(
            agent_name=self.agent_name,
            data={"recommendations": recommendations},
            summary=f"Generated {len(recommendations)} recommendation(s).",
            confidence=1.0,
        )
