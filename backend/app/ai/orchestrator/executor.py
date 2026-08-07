"""Agent executor — dispatches planner output to the LangGraph controller.

Thin wrapper that builds the LangGraph state and invokes the compiled graph.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.controller import AgentController
from app.ai.schemas import AgentResult, PlannerOutput
from app.core.logger import logger


class AgentExecutor:
    """Dispatches work to the agent controller and collects results."""

    def __init__(self, session: AsyncSession) -> None:
        self._controller = AgentController(session)

    async def execute(
        self,
        user_id: uuid.UUID,
        plan: PlannerOutput,
        context: dict[str, Any],
    ) -> list[AgentResult]:
        """Run the planned agents and return all results.

        Individual agent failures are captured in ``AgentResult.error``
        and do not abort the pipeline.
        """
        logger.info(
            "Executing plan: intent=%s, agents=%s",
            plan.intent,
            plan.agents,
        )

        results = await self._controller.run(user_id, plan, context)

        successful = [r for r in results if not r.error]
        failed = [r for r in results if r.error]

        if failed:
            logger.warning(
                "Agent execution had %d failure(s): %s",
                len(failed),
                [f.agent_name for f in failed],
            )

        return results
