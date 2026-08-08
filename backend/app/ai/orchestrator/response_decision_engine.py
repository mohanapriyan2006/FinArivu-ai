"""ResponseDecisionEngine — decides the response shape and what extras to show.

This is a pure, deterministic component. It does not call an LLM. It looks at
the classified intent and the agent results and decides whether the final
response should include an artifact, actions, follow-ups, or a clarification.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.ai.schemas.copilot import ResponseType
from app.ai.schemas import AgentResult
from app.ai.schemas.orchestration import IntentEnum


@dataclass
class ResponseDecision:
    """Decision for the final response shape."""

    response_type: ResponseType
    show_artifact: bool = False
    artifact_type: str | None = None
    show_actions: bool = False
    show_follow_up: bool = False
    missing_data: bool = False
    missing_fields: list[str] = field(default_factory=list)


class ResponseDecisionEngine:
    """Determines the response type and whether to render extras."""

    _INTENT_ARTIFACT: dict[IntentEnum, str] = {
        IntentEnum.BUDGET: "budget_card",
        IntentEnum.EXPENSE: "expense_card",
        IntentEnum.GOAL: "goal_card",
        IntentEnum.HEALTH: "health_card",
        IntentEnum.TAX: "tax_card",
        IntentEnum.RETIREMENT: "retirement_card",
        IntentEnum.NETWORTH: "networth_card",
        IntentEnum.CASH_FLOW: "cashflow_card",
        IntentEnum.REPORT: "report_card",
    }

    _MAIN_AGENT: dict[IntentEnum, str] = {
        IntentEnum.BUDGET: "BudgetAgent",
        IntentEnum.EXPENSE: "BudgetAgent",
        IntentEnum.GOAL: "GoalAgent",
        IntentEnum.HEALTH: "HealthAgent",
        IntentEnum.TAX: "TaxAgent",
        IntentEnum.RETIREMENT: "RetirementAgent",
        IntentEnum.NETWORTH: "NetWorthAgent",
        IntentEnum.CASH_FLOW: "CashFlowAgent",
        IntentEnum.REPORT: "ReportAgent",
    }

    _COPILOT_TO_INTERNAL: dict[str, IntentEnum] = {
        "budget_analysis": IntentEnum.BUDGET,
        "goal_tracking": IntentEnum.GOAL,
        "retirement_planning": IntentEnum.RETIREMENT,
        "tax_planning": IntentEnum.TAX,
        "health_score": IntentEnum.HEALTH,
        "net_worth": IntentEnum.NETWORTH,
        "report_summary": IntentEnum.REPORT,
        "education": IntentEnum.EDUCATION,
    }

    @classmethod
    def _to_intent_enum(cls, intent: str | IntentEnum) -> IntentEnum:
        """Convert an API intent string or enum into the internal IntentEnum."""
        if isinstance(intent, IntentEnum):
            return intent
        try:
            return IntentEnum(intent)
        except ValueError:
            return cls._COPILOT_TO_INTERNAL.get(intent, IntentEnum.GENERAL)

    def decide(
        self,
        intent: str | IntentEnum,
        results: list[AgentResult],
        message: str = "",
    ) -> ResponseDecision:
        """Return the response decision for this intent and agent results."""
        intent = self._to_intent_enum(intent)
        by_name = {r.agent_name: r for r in results}

        # Education, greeting, general → no artifacts/actions.
        if intent in {IntentEnum.EDUCATION, IntentEnum.GREETING, IntentEnum.GENERAL}:
            return ResponseDecision(
                response_type=ResponseType.EDUCATIONAL if intent == IntentEnum.EDUCATION else ResponseType.SIMPLE_ANSWER,
                show_follow_up=intent == IntentEnum.EDUCATION,
            )

        # Investment education / blocked → simple educational.
        if intent in {IntentEnum.INVESTMENT_EDUCATION, IntentEnum.UNSUPPORTED_INVESTMENT_ADVICE}:
            return ResponseDecision(response_type=ResponseType.EDUCATIONAL, show_follow_up=False)

        main_agent = self._MAIN_AGENT.get(intent)
        if main_agent:
            result = by_name.get(main_agent)
            if not result or result.error or self._is_data_missing(result.data):
                return ResponseDecision(
                    response_type=ResponseType.CLARIFICATION,
                    missing_data=True,
                    missing_fields=self._missing_fields(intent),
                )

        artifact_type = self._INTENT_ARTIFACT.get(intent)
        actionable = self._is_actionable(intent, by_name)

        return ResponseDecision(
            response_type=ResponseType.ACTIONABLE_ANALYSIS if actionable else ResponseType.FINANCIAL_ANALYSIS,
            show_artifact=bool(artifact_type),
            artifact_type=artifact_type,
            show_actions=True,
            show_follow_up=False,
        )

    @staticmethod
    def _is_data_missing(data: dict | None) -> bool:
        """Heuristic: data is missing when it's empty or all key numbers are zero."""
        if not data:
            return True
        numeric = [v for v in data.values() if isinstance(v, (int, float))]
        return all(v == 0 for v in numeric) and not any(isinstance(v, str) and v for v in data.values())

    @staticmethod
    def _missing_fields(intent: IntentEnum) -> list[str]:
        fields: dict[IntentEnum, list[str]] = {
            IntentEnum.BUDGET: ["budgets", "expenses"],
            IntentEnum.EXPENSE: ["expenses"],
            IntentEnum.GOAL: ["goals"],
            IntentEnum.HEALTH: ["income", "expenses", "assets", "liabilities"],
            IntentEnum.TAX: ["income", "deductions"],
            IntentEnum.RETIREMENT: ["monthly expenses", "current age", "retirement age"],
            IntentEnum.NETWORTH: ["assets", "liabilities"],
            IntentEnum.CASH_FLOW: ["income", "expenses"],
        }
        return fields.get(intent, ["relevant financial data"])

    @staticmethod
    def _is_actionable(intent: IntentEnum, by_name: dict[str, AgentResult]) -> bool:
        """Return True if the result justifies an actionable analysis."""
        if intent == IntentEnum.BUDGET:
            data = by_name.get("BudgetAgent", AgentResult(agent_name="BudgetAgent")).data or {}
            return bool(data.get("overspendingCategories"))
        if intent == IntentEnum.EXPENSE:
            data = by_name.get("BudgetAgent", AgentResult(agent_name="BudgetAgent")).data or {}
            return bool(data.get("overspendingCategories"))
        if intent == IntentEnum.GOAL:
            data = by_name.get("GoalAgent", AgentResult(agent_name="GoalAgent")).data or {}
            return data.get("status") in {"behind", "at_risk"}
        if intent == IntentEnum.HEALTH:
            data = by_name.get("HealthAgent", AgentResult(agent_name="HealthAgent")).data or {}
            return (data.get("overallScore") or 0) < 70
        if intent == IntentEnum.TAX:
            data = by_name.get("TaxAgent", AgentResult(agent_name="TaxAgent")).data or {}
            return data.get("better_regime") is not None
        if intent == IntentEnum.RETIREMENT:
            data = by_name.get("RetirementAgent", AgentResult(agent_name="RetirementAgent")).data or {}
            return data.get("corpusRequired") is not None
        if intent == IntentEnum.MIXED:
            return True
        return False
