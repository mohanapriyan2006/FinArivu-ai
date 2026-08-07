"""Retirement specialist agent — corpus projection and inflation analysis."""

from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.ai.tools.financial_tools import get_retirement_projection


class RetirementAgent(BaseSpecialistAgent):
    """Projects retirement corpus using the deterministic RetirementEngine."""

    @property
    def agent_name(self) -> str:
        return "RetirementAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        data = await get_retirement_projection(self._session, user_id)

        corpus = data.get("retirementCorpus", 0)
        years = data.get("yearsToRetirement", 0)

        summary = (
            f"Estimated retirement corpus needed: ₹{float(corpus):,.0f}. "
            f"Years to retirement: {years}."
        )

        return AgentResult(
            agent_name=self.agent_name,
            data=data,
            summary=summary,
            confidence=1.0,
        )
