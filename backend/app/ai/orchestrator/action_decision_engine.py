"""ActionDecisionEngine — generates relevant, contextual actions and follow-ups.

This component never invents generic advice. It looks at the agent results and
emits at most 2 actions (3 for mixed/complex analysis) plus optional follow-ups.
"""
from __future__ import annotations

from app.ai.schemas import AgentResult
from app.ai.schemas.copilot import FollowUpQuestion, SuggestedAction
from app.ai.schemas.orchestration import IntentEnum


class ActionDecisionEngine:
    """Builds SuggestedAction and FollowUpQuestion lists from agent results."""

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

    def build(
        self,
        intent: str | IntentEnum,
        results: list[AgentResult],
    ) -> tuple[list[SuggestedAction], list[FollowUpQuestion]]:
        """Return (actions, follow_ups) for the given intent and agent results."""
        intent = self._to_intent_enum(intent)
        by_name = {r.agent_name: r for r in results}
        actions: list[SuggestedAction] = []

        if intent == IntentEnum.BUDGET or intent == IntentEnum.EXPENSE:
            actions.extend(self._budget_actions(by_name.get("BudgetAgent")))

        if intent == IntentEnum.GOAL:
            actions.extend(self._goal_actions(by_name.get("GoalAgent")))

        if intent == IntentEnum.TAX:
            actions.extend(self._tax_actions(by_name.get("TaxAgent")))

        if intent == IntentEnum.RETIREMENT:
            actions.extend(self._retirement_actions(by_name.get("RetirementAgent")))

        if intent == IntentEnum.HEALTH:
            actions.extend(self._health_actions(by_name.get("HealthAgent")))

        if intent == IntentEnum.NETWORTH:
            actions.extend(self._networth_actions(by_name.get("NetWorthAgent")))

        if intent == IntentEnum.CASH_FLOW:
            actions.extend(self._cashflow_actions(by_name.get("CashFlowAgent")))

        if intent == IntentEnum.REPORT:
            actions.extend(self._report_actions(by_name.get("ReportAgent")))

        max_actions = 3 if intent == IntentEnum.MIXED else 2
        actions = actions[:max_actions]

        follow_ups = self._education_follow_ups(intent, by_name)

        return actions, follow_ups

    @staticmethod
    def _budget_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data:
            return []
        actions: list[SuggestedAction] = []
        data = result.data
        overspending = data.get("overspendingCategories", []) or []
        for cat in overspending[:2]:
            category = str(cat.get("category", "this category"))
            slug = category.lower().replace(" ", "_").replace("&", "and")
            actions.append(SuggestedAction(
                id=f"view_{slug}_expenses",
                label=f"View {category} expenses",
                type="NAVIGATE",
                payload={"screen": "expenses", "params": {"category": category}},
            ))
            actions.append(SuggestedAction(
                id=f"adjust_{slug}_budget",
                label=f"Adjust {category} budget",
                type="NAVIGATE",
                payload={"screen": "budget", "params": {"category": category}},
            ))
        if not actions:
            actions.append(SuggestedAction(
                id="view_budget",
                label="View budget",
                type="NAVIGATE",
                payload={"screen": "budget"},
            ))
        return actions

    @staticmethod
    def _goal_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data:
            return []
        actions: list[SuggestedAction] = []
        data = result.data
        name = str(data.get("goal_name", "your goal"))
        actions.append(SuggestedAction(
            id="view_goal",
            label=f"View {name} goal",
            type="NAVIGATE",
            payload={"screen": "goals", "params": {"goalId": data.get("goal_id")}},
        ))
        if data.get("status") in {"behind", "at_risk"}:
            actions.append(SuggestedAction(
                id="increase_savings",
                label="Increase monthly savings",
                type="NAVIGATE",
                payload={"screen": "savings"},
            ))
        return actions

    @staticmethod
    def _tax_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data:
            return []
        actions = [
            SuggestedAction(
                id="compare_tax_regimes",
                label="Compare tax regimes",
                type="NAVIGATE",
                payload={"screen": "tax"},
            ),
        ]
        if result.data.get("better_regime"):
            actions.append(SuggestedAction(
                id="view_deductions",
                label="View deductions",
                type="NAVIGATE",
                payload={"screen": "tax", "params": {"tab": "deductions"}},
            ))
        return actions

    @staticmethod
    def _retirement_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data:
            return []
        actions = [
            SuggestedAction(
                id="simulate_retirement",
                label="Run retirement simulation",
                type="NAVIGATE",
                payload={"screen": "retirement_simulator"},
            ),
        ]
        if result.data.get("monthly_savings_required"):
            actions.append(SuggestedAction(
                id="increase_retirement_savings",
                label="Increase retirement savings",
                type="NAVIGATE",
                payload={"screen": "retirement"},
            ))
        return actions

    @staticmethod
    def _health_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data:
            return []
        return [
            SuggestedAction(
                id="view_health_breakdown",
                label="View full health breakdown",
                type="NAVIGATE",
                payload={"screen": "financial_health"},
            ),
        ]

    @staticmethod
    def _networth_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data:
            return []
        return [
            SuggestedAction(
                id="view_net_worth",
                label="View net worth",
                type="NAVIGATE",
                payload={"screen": "networth"},
            ),
        ]

    @staticmethod
    def _cashflow_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data:
            return []
        return [
            SuggestedAction(
                id="view_cash_flow",
                label="View cash flow",
                type="NAVIGATE",
                payload={"screen": "cashflow"},
            ),
        ]

    @staticmethod
    def _report_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data:
            return []
        return [
            SuggestedAction(
                id="view_report",
                label="View full report",
                type="NAVIGATE",
                payload={"screen": "reports"},
            ),
        ]

    @staticmethod
    def _education_follow_ups(
        intent: IntentEnum,
        by_name: dict[str, AgentResult],
    ) -> list[FollowUpQuestion]:
        """Generate a single, relevant follow-up for educational queries only."""
        if intent != IntentEnum.EDUCATION and intent != IntentEnum.INVESTMENT_EDUCATION:
            return []

        question = (by_name.get("EducationAgent", AgentResult(agent_name="EducationAgent")).data or {}).get("question", "")
        lowered = str(question).lower()

        if "mutual fund" in lowered or "mutual" in lowered:
            return [FollowUpQuestion(
                label="How are mutual funds different from stocks?",
                payload={"question": "How are mutual funds different from stocks?"},
            )]
        if "sip" in lowered:
            return [FollowUpQuestion(
                label="How does SIP compounding work?",
                payload={"question": "How does SIP compounding work?"},
            )]
        if "80c" in lowered or "deduction" in lowered:
            return [FollowUpQuestion(
                label="Which 80C investments are tax-efficient?",
                payload={"question": "Which 80C investments are tax-efficient?"},
            )]
        if "retirement" in lowered or "pension" in lowered:
            return [FollowUpQuestion(
                label="How much should I save for retirement?",
                payload={"question": "How much should I save for retirement?"},
            )]

        return []
