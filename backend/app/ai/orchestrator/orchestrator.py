from __future__ import annotations

import asyncio
import uuid
from typing import Any

from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.ai.planner.execution_planner import ExecutionPlanner
from app.ai.registry.registry import AgentRegistry
from app.ai.schemas.orchestration import ExecutionPlan, FinancialContext
from app.ai.schemas import AgentResult
from app.core.logger import logger
from sqlalchemy.ext.asyncio import AsyncSession


class Orchestrator:
    """Executes an ExecutionPlan using LangGraph and agent registry.

    Supports parallel execution, per-step timeouts, and retries.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._registry = AgentRegistry()

    async def execute(
        self,
        user_id: uuid.UUID,
        session_id: str,
        plan: ExecutionPlan,
        financial_context: FinancialContext,
        user_message: str,
        entities: dict[str, Any],
    ) -> list[AgentResult]:
        """Run the execution plan and return agent results."""
        logger.info("Orchestrator executing %d step(s)", len(plan.steps))

        initial_state: dict[str, Any] = {
            "user_id": str(user_id),
            "session_id": session_id,
            "plan": plan.model_dump(),
            "financial_context": financial_context.model_dump(),
            "user_message": user_message,
            "entities": entities,
            "agent_results": [],
            "errors": [],
        }

        planner = ExecutionPlanner(execute_fn=self._run_agents)
        graph = planner.build_graph()
        final_state = await graph.ainvoke(initial_state)

        results = final_state.get("agent_results", [])
        return [AgentResult(**r) if isinstance(r, dict) else r for r in results]

    async def _run_agents(self, state: dict[str, Any]) -> dict[str, Any]:
        """LangGraph node that runs all planned agents."""
        plan = ExecutionPlan(**state["plan"])
        user_id = uuid.UUID(state["user_id"])

        agent_context = {
            "user_message": state["user_message"],
            "financial_context": FinancialContext(**state["financial_context"]),
            "entities": state["entities"],
            "session_id": state["session_id"],
        }

        # Agents share a single AsyncSession, which does not support
        # concurrent operations — run them sequentially instead of via
        # asyncio.create_task (asyncpg raises InterfaceError otherwise).
        planned: list[tuple[str, Any, int]] = []
        for step in plan.steps:
            cls = self._registry.get(step.agent_name)
            if cls is None:
                logger.warning("Agent %s not found in registry", step.agent_name)
                continue
            planned.append((step.agent_name, cls(self._session), step.timeout_seconds))

        if not planned:
            # Fallback to education agent if nothing is planned.
            cls = self._registry.get("EducationAgent")
            if cls is not None:
                planned.append(("EducationAgent", cls(self._session), 30))

        # RecommendationAgent consumes earlier agents' results — run it last.
        planned.sort(key=lambda item: item[0] == "RecommendationAgent")

        results: list[AgentResult] = []
        for agent_name, agent, timeout in planned:
            try:
                result = await self._execute_with_retry(
                    agent, user_id, agent_context, timeout,
                )
                results.append(result)
                # Share completed results so downstream agents (e.g.
                # RecommendationAgent) can build on them.
                agent_context["agent_results"] = [r.model_dump() for r in results]
            except Exception as exc:
                logger.exception("Agent %s failed: %s", agent_name, exc)
                results.append(
                    AgentResult(
                        agent_name=agent_name,
                        error=str(exc),
                        summary="Agent failed to complete.",
                        confidence=0.0,
                    )
                )

        state["agent_results"] = [r.model_dump() for r in results]
        state["errors"] = [r.error for r in results if r.error]
        return state

    async def _execute_with_retry(
        self,
        agent: Any,
        user_id: uuid.UUID,
        context: dict[str, Any],
        timeout: int,
    ) -> AgentResult:
        """Run a single agent with timeout and exponential backoff."""
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(2),
            wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
            retry=retry_if_exception_type(Exception),
            reraise=True,
        ):
            with attempt:
                return await asyncio.wait_for(
                    agent.safe_execute(user_id, context),
                    timeout=timeout,
                )
