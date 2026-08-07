"""LangGraph agent controller — routes planner output to specialist agents.

Uses a ``StateGraph`` with conditional edges to fan-out to the required
agents based on the planner's output, then merges all results.
"""

from __future__ import annotations

import asyncio
import uuid
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.agents.budget_agent import BudgetAgent
from app.ai.agents.education_agent import EducationAgent
from app.ai.agents.goal_agent import GoalAgent
from app.ai.agents.health_agent import HealthAgent
from app.ai.agents.report_agent import ReportAgent
from app.ai.agents.retirement_agent import RetirementAgent
from app.ai.agents.tax_agent import TaxAgent
from app.ai.schemas import AgentResult, PlannerOutput
from app.core.logger import logger
from sqlalchemy.ext.asyncio import AsyncSession


# ── Agent registry ────────────────────────────────────────────────────────

AGENT_REGISTRY: dict[str, type[BaseSpecialistAgent]] = {
    "BudgetAgent": BudgetAgent,
    "TaxAgent": TaxAgent,
    "GoalAgent": GoalAgent,
    "RetirementAgent": RetirementAgent,
    "HealthAgent": HealthAgent,
    "EducationAgent": EducationAgent,
    "ReportAgent": ReportAgent,
}


# ── State definition ──────────────────────────────────────────────────────

class AgentState(TypedDict):
    """State passed through the LangGraph execution."""

    user_id: str
    session_id: str
    plan: dict[str, Any]
    context: dict[str, Any]
    results: list[dict[str, Any]]
    errors: list[str]


# ── Controller ────────────────────────────────────────────────────────────

class AgentController:
    """Dispatches work to specialist agents based on the planner output.

    Agents listed in ``PlannerOutput.agents`` are executed concurrently
    via ``asyncio.gather``.  Each agent's ``safe_execute`` method ensures
    individual failures are captured without aborting the pipeline.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def run(
        self,
        user_id: uuid.UUID,
        plan: PlannerOutput,
        context: dict[str, Any],
    ) -> list[AgentResult]:
        """Execute the planned agents and return their results."""
        agent_names = plan.agents or ["EducationAgent"]

        # Instantiate requested agents.
        agents: list[BaseSpecialistAgent] = []
        for name in agent_names:
            cls = AGENT_REGISTRY.get(name)
            if cls is None:
                logger.warning("Unknown agent requested: %s", name)
                continue
            agents.append(cls(self._session))

        if not agents:
            # Fallback: always have at least the education agent.
            agents.append(EducationAgent(self._session))

        # Fan-out: run all agents concurrently.
        tasks = [
            agent.safe_execute(user_id, context)
            for agent in agents
        ]
        results: list[AgentResult] = list(await asyncio.gather(*tasks))

        logger.info(
            "Agent controller completed: %d agent(s), %d error(s)",
            len(results),
            sum(1 for r in results if r.error),
        )

        return results


def build_agent_graph(session: AsyncSession) -> StateGraph:
    """Build a LangGraph ``StateGraph`` for the agent pipeline.

    This graph has a single composite node that uses the ``AgentController``
    to fan-out to specialist agents, keeping the LangGraph structure simple
    while still benefiting from its state management.
    """
    controller = AgentController(session)

    async def execute_agents(state: AgentState) -> AgentState:
        plan = PlannerOutput(**state["plan"])
        user_id = uuid.UUID(state["user_id"])

        results = await controller.run(user_id, plan, state["context"])

        state["results"] = [r.model_dump() for r in results]
        state["errors"] = [r.error for r in results if r.error]
        return state

    graph = StateGraph(AgentState)
    graph.add_node("execute_agents", execute_agents)
    graph.set_entry_point("execute_agents")
    graph.add_edge("execute_agents", END)

    return graph
