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

        goals = financial_context.get("goals", []) or []
        assets = financial_context.get("assets", []) or []
        liabilities = financial_context.get("liabilities", []) or []
        # income / expenses are aggregate dicts, not record lists.
        income = financial_context.get("income", {}) or {}
        expenses = financial_context.get("expenses", {}) or {}

        insights: list[str] = []

        if goals:
            active = [g for g in goals if isinstance(g, dict) and g.get("current_amount", 0) < g.get("target_amount", 0)]
            insights.append(f"You have {len(active)} active goal(s) you are currently tracking.")

        if assets and liabilities:
            total_assets = sum(float(a.get("value", 0) or 0) for a in assets)
            total_liabilities = sum(float(l.get("amount", 0) or 0) for l in liabilities)
            net_worth = total_assets - total_liabilities
            insights.append(f"Your net worth is ₹{net_worth:,.0f} across {len(assets)} asset(s) and {len(liabilities)} liability(ies).")

        monthly_income = income.get("monthly_take_home")
        monthly_expenses = expenses.get("monthly_estimate")
        if monthly_income is not None and monthly_expenses is not None:
            surplus = float(monthly_income) - float(monthly_expenses)
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

        # Canonical SuggestedAction dicts — serialise cleanly into the
        # SuggestedAction schema (camelCase keys, canonical route targets).
        suggested_actions = [
            {"id": "review_budget", "label": "Review Budget", "type": "NAVIGATE",
             "route": "budget", "payload": {}, "enabled": True},
            {"id": "improve_savings", "label": "Improve Savings", "type": "NAVIGATE",
             "route": "savings", "payload": {}, "enabled": True},
            {"id": "view_cash_flow", "label": "View Cash Flow", "type": "NAVIGATE",
             "route": "pulse", "payload": {}, "enabled": True},
        ]
        if goals:
            suggested_actions.append({"id": "update_goals", "label": "Update Goals",
                                      "type": "NAVIGATE", "route": "goals",
                                      "payload": {}, "enabled": True})
        if liabilities:
            suggested_actions.append({"id": "repay_debt", "label": "Repay Debt Faster",
                                      "type": "NAVIGATE", "route": "loans",
                                      "payload": {}, "enabled": True})
        if assets:
            suggested_actions.append({"id": "view_investments", "label": "View Investments",
                                      "type": "NAVIGATE", "route": "investments",
                                      "payload": {}, "enabled": True})

        suggested_actions = suggested_actions[:6]

        return AgentResult(
            agent_name=self.agent_name,
            data={
                "insights": insights,
                # Canonical FollowUpQuestion dicts.
                "followUpQuestions": [
                    {"label": q, "type": "CHAT_FOLLOWUP", "payload": {"question": q}}
                    for q in follow_ups[:5]
                ],
                "suggestedActions": suggested_actions,
            },
            summary="; ".join(insights) if insights else "No insights available.",
            confidence=1.0,
        )
