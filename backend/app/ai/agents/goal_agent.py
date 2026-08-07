"""Goal specialist agent — target tracking and completion prediction."""

from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult
from app.ai.tools.financial_tools import get_goal_projections


class GoalAgent(BaseSpecialistAgent):
    """Projects goal progress using the deterministic GoalEngine."""

    @property
    def agent_name(self) -> str:
        return "GoalAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        data = await get_goal_projections(self._session, user_id)

        goals = data.get("goals", [])
        total_monthly = data.get("totalMonthlyContribution", 0)
        on_track = sum(1 for g in goals if g.get("status") == "on_track")

        summary = (
            f"{len(goals)} goal(s) tracked. "
            f"{on_track} on track. "
            f"Total monthly contribution needed: ₹{float(total_monthly):,.0f}."
        )

        return AgentResult(
            agent_name=self.agent_name,
            data=data,
            summary=summary,
            confidence=1.0,
        )
