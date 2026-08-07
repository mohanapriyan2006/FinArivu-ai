from __future__ import annotations

from app.ai.schemas.orchestration import ExecutionPlan, ExecutionStep, IntentEnum, IntentResult


class Planner:
    """Converts an IntentResult into an ExecutionPlan."""

    INTENT_AGENTS: dict[IntentEnum, list[str]] = {
        IntentEnum.BUDGET: ["BudgetAgent"],
        IntentEnum.GOAL: ["GoalAgent"],
        IntentEnum.RETIREMENT: ["RetirementAgent", "NetWorthAgent", "GoalAgent"],
        IntentEnum.TAX: ["TaxAgent"],
        IntentEnum.HEALTH: ["HealthAgent"],
        IntentEnum.NETWORTH: ["NetWorthAgent", "HealthAgent"],
        IntentEnum.EDUCATION: ["EducationAgent"],
        IntentEnum.REPORT: ["ReportAgent"],
        IntentEnum.GREETING: ["EducationAgent"],
        IntentEnum.GENERAL: ["EducationAgent"],
        IntentEnum.MIXED: ["BudgetAgent", "GoalAgent", "HealthAgent"],
    }

    STYLE_MAP: dict[IntentEnum, str] = {
        IntentEnum.EDUCATION: "educational",
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

        # When the classifier requests specific modules, ensure they are included.
        for module in intent_result.requested_modules:
            candidate = f"{module.title().replace('_', '')}Agent"
            if candidate not in agent_names:
                agent_names.append(candidate)

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
