from __future__ import annotations

from app.ai.schemas.orchestration import ExecutionPlan, ExecutionStep, IntentEnum, IntentResult


class Planner:
    """Converts an IntentResult into an ExecutionPlan."""

    INTENT_AGENTS: dict[IntentEnum, list[str]] = {
        IntentEnum.BUDGET: ["BudgetAgent"],
        IntentEnum.EXPENSE: ["BudgetAgent"],
        IntentEnum.GOAL: ["GoalAgent"],
        IntentEnum.RETIREMENT: ["RetirementAgent", "NetWorthAgent"],
        IntentEnum.TAX: ["TaxAgent"],
        IntentEnum.HEALTH: ["HealthAgent"],
        IntentEnum.NETWORTH: ["NetWorthAgent"],
        IntentEnum.EDUCATION: ["EducationAgent"],
        IntentEnum.INVESTMENT_EDUCATION: ["EducationAgent"],
        IntentEnum.UNSUPPORTED_INVESTMENT_ADVICE: ["EducationAgent"],
        IntentEnum.CASH_FLOW: ["BudgetAgent"],
        IntentEnum.SCENARIO: ["BudgetAgent", "GoalAgent"],
        IntentEnum.REPORT: ["ReportAgent"],
        IntentEnum.GREETING: ["EducationAgent"],
        IntentEnum.GENERAL: ["EducationAgent"],
        IntentEnum.MIXED: ["BudgetAgent", "GoalAgent"],
    }

    STYLE_MAP: dict[IntentEnum, str] = {
        IntentEnum.EDUCATION: "educational",
        IntentEnum.INVESTMENT_EDUCATION: "educational",
        IntentEnum.GREETING: "friendly",
        IntentEnum.REPORT: "detailed",
        IntentEnum.GENERAL: "educational",
    }

    def plan(self, intent_result: IntentResult) -> ExecutionPlan:
        """Build an ExecutionPlan from the classified intent."""
        agent_names = self.INTENT_AGENTS.get(
            intent_result.intent,
            ["EducationAgent"],
        )

        steps = [
            ExecutionStep(agent_name=name, timeout_seconds=30)
            for name in agent_names
        ]

        response_style = self.STYLE_MAP.get(intent_result.intent, "concise")

        return ExecutionPlan(
            intent=intent_result.intent,
            steps=steps,
            response_style=response_style,
        )
