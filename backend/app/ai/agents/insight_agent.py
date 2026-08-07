from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult


class InsightAgent(BaseSpecialistAgent):
    """Generates high-level financial insights and follow-ups from context."""

    @property
    def agent_name(self) -> str:
        return "InsightAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        financial_context = context.get("financial_context", {})
        if hasattr(financial_context, "model_dump"):
            financial_context = financial_context.model_dump()

        profile = financial_context.get("profile", {})
        goals = financial_context.get("goals", [])
        assets = financial_context.get("assets", [])
        liabilities = financial_context.get("liabilities", [])
        income = financial_context.get("income", [])
        expenses = financial_context.get("expenses", [])

        insights: list[str] = []

        if goals:
            active = [g for g in goals if isinstance(g, dict) and g.get("current_amount", 0) < g.get("target_amount", 0)]
            insights.append(f"You have {len(active)} active goal(s) you are currently tracking.")

        if assets and liabilities:
            total_assets = sum(float(a.get("value", 0) or 0) for a in assets)
            total_liabilities = sum(float(l.get("amount", 0) or 0) for l in liabilities)
            net_worth = total_assets - total_liabilities
            insights.append(f"Your net worth is ₹{net_worth:,.0f} across {len(assets)} asset(s) and {len(liabilities)} liability(ies).")

        if income and expenses:
            total_income = sum(float(i.get("amount", 0) or 0) for i in income)
            total_expense = sum(float(e.get("amount", 0) or 0) for e in expenses)
            surplus = total_income - total_expense
            if surplus > 0:
                insights.append(f"You have a monthly surplus of ₹{surplus:,.0f}.")
            else:
                insights.append(f"Your monthly expenses exceed income by ₹{abs(surplus):,.0f}.")

        follow_ups = [
            "How can I improve my savings?",
            "What should I prioritise next?",
        ]
        if goals:
            follow_ups.append("Am I on track with my goals?")
        if liabilities:
            follow_ups.append("Should I repay debt faster?")

        suggested_actions = [
            {"label": "Review Budget", "action": "view_budget", "route": "/budget"},
            {"label": "Update Goals", "action": "view_goals", "route": "/goals"},
        ]

        return AgentResult(
            agent_name=self.agent_name,
            data={
                "insights": insights,
                "follow_up_questions": [{"text": q} for q in follow_ups[:3]],
                "suggested_actions": suggested_actions[:3],
            },
            summary="; ".join(insights) if insights else "No insights available.",
            confidence=1.0,
        )
