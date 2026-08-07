"""Health specialist agent — financial health score and breakdown."""

from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.ai.tools.financial_tools import get_health_score


class HealthAgent(BaseSpecialistAgent):
    """Computes the financial health score using the deterministic HealthScoreEngine."""

    @property
    def agent_name(self) -> str:
        return "HealthAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        data = await get_health_score(self._session, user_id)

        overall = data.get("overallScore", 0)
        recommendations = data.get("recommendations", [])

        summary = (
            f"Financial health score: {float(overall):.0f}/100. "
            f"{len(recommendations)} recommendation(s) available."
        )

        return AgentResult(
            agent_name=self.agent_name,
            data=data,
            summary=summary,
            confidence=1.0,
        )
