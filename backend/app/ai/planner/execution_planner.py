from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph


class AgentState(TypedDict):
    """LangGraph state passed through the agent execution pipeline."""

    user_id: str
    session_id: str
    plan: dict[str, Any]
    financial_context: dict[str, Any]
    user_message: str
    entities: dict[str, Any]
    agent_results: list[dict[str, Any]]
    errors: list[str]


class ExecutionPlanner:
    """Builds a LangGraph execution graph from an ExecutionPlan."""

    def __init__(
        self,
        execute_fn: Callable[[AgentState], Awaitable[AgentState]],
    ) -> None:
        self._execute_fn = execute_fn

    def build_graph(self) -> Any:
        """Compile and return the LangGraph for agent execution."""

        async def execute_agents(state: AgentState) -> AgentState:
            return await self._execute_fn(state)

        graph = StateGraph(AgentState)
        graph.add_node("execute_agents", execute_agents)
        graph.set_entry_point("execute_agents")
        graph.add_edge("execute_agents", END)

        return graph.compile()
