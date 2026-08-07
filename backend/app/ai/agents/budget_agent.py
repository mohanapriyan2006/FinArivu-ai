"""Budget specialist agent — spending analysis, overspending, savings."""

from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.ai.tools.financial_tools import get_budget_analysis


class BudgetAgent(BaseSpecialistAgent):
    """Analyses budget utilisation using the deterministic BudgetEngine."""

    @property
    def agent_name(self) -> str:
        return "BudgetAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        data = await get_budget_analysis(self._session, user_id)

        total_budget = data.get("totalBudget", 0)
        total_spent = data.get("totalSpent", 0)
        utilisation = data.get("overallUtilization", 0)
        overspending = data.get("overspendingCategories", [])

        summary_parts = [
            f"Total budget: ₹{total_budget:,.0f}",
            f"Total spent: ₹{total_spent:,.0f}",
            f"Utilisation: {float(utilisation) * 100:.0f}%",
        ]
        if overspending:
            summary_parts.append(
                f"{len(overspending)} category(ies) over budget"
            )

        return AgentResult(
            agent_name=self.agent_name,
            data=data,
            summary=". ".join(summary_parts) + ".",
            confidence=1.0,
        )
