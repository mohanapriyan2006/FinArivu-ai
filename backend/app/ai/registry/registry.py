from __future__ import annotations

from enum import Enum
from typing import Any, TypeVar

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.agents.budget_agent import BudgetAgent
from app.ai.agents.cashflow_agent import CashFlowAgent
from app.ai.agents.education_agent import EducationAgent
from app.ai.agents.goal_agent import GoalAgent
from app.ai.agents.health_agent import HealthAgent
from app.ai.agents.insight_agent import InsightAgent
from app.ai.agents.networth_agent import NetWorthAgent
from app.ai.agents.recommendation_agent import RecommendationAgent
from app.ai.agents.report_agent import ReportAgent
from app.ai.agents.retirement_agent import RetirementAgent
from app.ai.agents.tax_agent import TaxAgent
from app.core.logger import logger

T = TypeVar("T", bound=BaseSpecialistAgent)


class AgentName(str, Enum):
    """Canonical specialist-agent identifiers — the single source of truth.

    Every name referenced by planners, decision engines, artifact builders
    and context requirements must resolve here.
    """

    BUDGET = "BudgetAgent"
    GOAL = "GoalAgent"
    RETIREMENT = "RetirementAgent"
    TAX = "TaxAgent"
    HEALTH = "HealthAgent"
    NETWORTH = "NetWorthAgent"
    EDUCATION = "EducationAgent"
    REPORT = "ReportAgent"
    INSIGHT = "InsightAgent"
    RECOMMENDATION = "RecommendationAgent"
    CASHFLOW = "CashFlowAgent"


# Agents the LLM controller is allowed to select in Phase 0.
# RecommendationAgent stays registered but is not controller-selectable:
# it consumes other agents' results, which requires deliberate sequencing.
CONTROLLER_SELECTABLE_AGENTS: list[str] = [
    AgentName.BUDGET.value,
    AgentName.TAX.value,
    AgentName.GOAL.value,
    AgentName.RETIREMENT.value,
    AgentName.HEALTH.value,
    AgentName.NETWORTH.value,
    AgentName.CASHFLOW.value,
    AgentName.EDUCATION.value,
    AgentName.REPORT.value,
    AgentName.INSIGHT.value,
]


class AgentRegistry:
    """Central registry for specialist agents."""

    _AGENTS: dict[str, type[BaseSpecialistAgent]] = {
        AgentName.BUDGET.value: BudgetAgent,
        AgentName.GOAL.value: GoalAgent,
        AgentName.RETIREMENT.value: RetirementAgent,
        AgentName.TAX.value: TaxAgent,
        AgentName.HEALTH.value: HealthAgent,
        AgentName.NETWORTH.value: NetWorthAgent,
        AgentName.EDUCATION.value: EducationAgent,
        AgentName.REPORT.value: ReportAgent,
        AgentName.INSIGHT.value: InsightAgent,
        AgentName.RECOMMENDATION.value: RecommendationAgent,
        AgentName.CASHFLOW.value: CashFlowAgent,
    }

    def __init__(self) -> None:
        self._agents: dict[str, type[BaseSpecialistAgent]] = dict(self._AGENTS)

    def register(
        self,
        name: str,
        agent_cls: type[T],
    ) -> None:
        """Register a new specialist agent by name."""
        self._agents[name] = agent_cls

    def get(self, name: str) -> type[BaseSpecialistAgent] | None:
        """Return the agent class for a name, or None if unknown."""
        cls = self._agents.get(name)
        if cls is None:
            logger.warning("Agent %s not found in registry", name)
        return cls

    def list_agents(self) -> list[str]:
        """Return all registered agent names."""
        return list(self._agents.keys())

    def has(self, name: str) -> bool:
        """Check whether an agent is registered."""
        return name in self._agents
