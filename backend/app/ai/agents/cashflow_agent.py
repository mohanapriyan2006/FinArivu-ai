"""Cash-flow specialist agent — income vs expense analysis."""

from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.ai.tools.financial_tools import get_cash_flow_analysis


class CashFlowAgent(BaseSpecialistAgent):
    """Analyses monthly cash flow using the deterministic CashFlowEngine."""

    @property
    def agent_name(self) -> str:
        return "CashFlowAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        data = await get_cash_flow_analysis(self._session, user_id)

        total_income = float(data.get("totalIncome", 0))
        total_expenses = float(data.get("totalExpenses", 0))
        savings = float(data.get("savings", 0))
        savings_rate = float(data.get("savingsRate", 0))

        summary = (
            f"Income: ₹{total_income:,.0f}; expenses: ₹{total_expenses:,.0f}; "
            f"net savings: ₹{savings:,.0f} ({savings_rate:.0%} savings rate)."
        )

        return AgentResult(
            agent_name=self.agent_name,
            data=data,
            summary=summary,
            confidence=1.0,
        )
