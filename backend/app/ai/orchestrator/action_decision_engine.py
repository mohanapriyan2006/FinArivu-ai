"""ActionDecisionEngine — generates relevant, contextual actions and follow-ups.

This component never invents generic advice. It looks at the agent results and
emits at most 2 actions (3 for mixed/complex analysis) plus optional follow-ups.

Navigation contract: NAVIGATE actions carry a canonical ``route`` target key
(see ``NAVIGATION_TARGETS``); the frontend resolves it to a registered React
Navigation screen. Targets with no real screen are never emitted.
"""
from __future__ import annotations

import re
from typing import Any

from app.ai.intents import to_internal_intent
from app.ai.schemas import ActionType, AgentResult
from app.ai.schemas.copilot import FollowUpQuestion, SuggestedAction
from app.ai.schemas.orchestration import IntentEnum


def _is_valid_api_action(action: SuggestedAction) -> bool:
    """Gate agent-contributed API_ACTION suggestions through the registry."""
    from app.actions.action_types import ActionOperation

    payload = action.payload or {}
    operation = payload.get("operation")
    arguments = payload.get("arguments")
    if not isinstance(operation, str) or not isinstance(arguments, dict):
        return False
    try:
        ActionOperation(operation)
    except ValueError:
        return False
    return True


# Canonical navigation targets the frontend can resolve to real screens.
# Kept in sync with ``src/navigation/actionRoutes.ts``.
NAVIGATION_TARGETS: dict[str, str] = {
    "expenses": "ExpenseTracker",
    "budget": "BudgetTracker",
    "goals": "GoalsTracker",
    "savings": "SavingsTracker",
    "investments": "InvestmentTracker",
    "loans": "LoanTracker",
    "insurance": "InsuranceTracker",
    "credit_cards": "CreditCardTracker",
    "financial_health": "FinancialHealth",
    "reports": "WeeklyReport",
    "pulse": "Pulse",
    "insights": "Insights",
    "scenario_lab": "ScenarioLab",
}


class ActionDecisionEngine:
    """Builds SuggestedAction and FollowUpQuestion lists from agent results."""

    @staticmethod
    def _to_intent_enum(intent: str | IntentEnum) -> IntentEnum:
        """Convert an API intent string or enum into the internal IntentEnum."""
        return to_internal_intent(intent)

    @staticmethod
    def _navigate(action_id: str, label: str, target: str,
                  params: dict[str, Any] | None = None) -> SuggestedAction:
        """Build a NAVIGATE action for a canonical target (validated)."""
        if target not in NAVIGATION_TARGETS:
            raise ValueError(f"Unknown navigation target: {target}")
        return SuggestedAction(
            id=action_id,
            label=label,
            type=ActionType.NAVIGATE,
            route=target,
            payload=params or {},
        )

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

        if intent == IntentEnum.MIXED:
            actions.extend(self._mixed_actions(results))

        max_actions = 3 if intent == IntentEnum.MIXED else 2
        actions = actions[:max_actions]

        # Merge canonical actions contributed by agents (e.g. InsightAgent).
        actions.extend(self._agent_contributed_actions(results))

        follow_ups = self._education_follow_ups(intent, by_name)
        follow_ups.extend(self._agent_contributed_follow_ups(results))

        return actions, follow_ups

    @staticmethod
    def _agent_contributed_actions(results: list[AgentResult]) -> list[SuggestedAction]:
        """Validate SuggestedAction dicts emitted by agents into the schema."""
        out: list[SuggestedAction] = []
        for r in results:
            for a in (r.data or {}).get("suggestedActions", []):
                if not isinstance(a, dict):
                    continue
                try:
                    action = SuggestedAction(**a)
                except Exception:
                    continue
                if action.type == ActionType.API_ACTION:
                    # Phase 1: API actions open a server-validated preview —
                    # only registered operations with a dict payload are
                    # allowed through; anything else is dropped.
                    if not _is_valid_api_action(action):
                        continue
                if action.type == ActionType.NAVIGATE and (
                    action.route not in NAVIGATION_TARGETS
                ):
                    continue
                out.append(action)
        return out

    @staticmethod
    def _agent_contributed_follow_ups(results: list[AgentResult]) -> list[FollowUpQuestion]:
        """Validate FollowUpQuestion dicts emitted by agents into the schema."""
        out: list[FollowUpQuestion] = []
        for r in results:
            for f in (r.data or {}).get("followUpQuestions", []):
                if not isinstance(f, dict):
                    continue
                try:
                    out.append(FollowUpQuestion(**f))
                except Exception:
                    continue
        return out[:5]

    @staticmethod
    def _mixed_actions(results: list[AgentResult]) -> list[SuggestedAction]:
        """Pick the primary action for each contributing agent on mixed intents."""
        actions: list[SuggestedAction] = []
        by_name = {r.agent_name: r for r in results}
        for intent, method in (
            (IntentEnum.BUDGET, ActionDecisionEngine._budget_actions),
            (IntentEnum.GOAL, ActionDecisionEngine._goal_actions),
            (IntentEnum.HEALTH, ActionDecisionEngine._health_actions),
            (IntentEnum.NETWORTH, ActionDecisionEngine._networth_actions),
            (IntentEnum.CASH_FLOW, ActionDecisionEngine._cashflow_actions),
            (IntentEnum.REPORT, ActionDecisionEngine._report_actions),
        ):
            main = ResponseMainAgent.get(intent)
            if main and main in by_name:
                actions.extend(method(by_name.get(main)))
        return actions

    @staticmethod
    def _safe_name(value: Any, fallback: str = "this category") -> str:
        """Guard against raw ids leaking into user-facing labels."""
        text = str(value or "").strip()
        if not text:
            return fallback
        if re.fullmatch(r"[0-9a-fA-F-]{8,}", text):
            return fallback
        return text

    @staticmethod
    def _budget_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data or result.data.get("dataMissing"):
            return []
        actions: list[SuggestedAction] = []
        data = result.data
        overspending = data.get("overspendingCategories", []) or []
        for cat in overspending[:1]:
            category = ActionDecisionEngine._safe_name(cat.get("categoryName"))
            slug = category.lower().replace(" ", "_").replace("&", "and")
            actions.append(SuggestedAction(
                id=f"view_{slug}_expenses",
                label=f"View {category} expenses",
                type=ActionType.NAVIGATE,
                route="expenses",
                payload={"category": category},
            ))
        actions.append(ActionDecisionEngine._navigate(
            "view_budget", "View budget", "budget",
        ))
        return actions

    @staticmethod
    def _goal_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data or result.data.get("dataMissing"):
            return []
        actions: list[SuggestedAction] = [
            ActionDecisionEngine._navigate("view_goals", "View goals", "goals"),
        ]
        goals = result.data.get("goals", []) or []
        behind = any(
            isinstance(g, dict) and g.get("status") in {"behind", "at_risk"}
            for g in goals
        )
        if behind:
            actions.append(ActionDecisionEngine._navigate(
                "increase_savings", "Increase monthly savings", "savings",
            ))
        return actions

    @staticmethod
    def _tax_actions(result: AgentResult | None) -> list[SuggestedAction]:
        # No dedicated tax screen exists in Phase 0 — emit no NAVIGATE action.
        return []

    @staticmethod
    def _retirement_actions(result: AgentResult | None) -> list[SuggestedAction]:
        # No dedicated retirement screen exists in Phase 0 — emit none.
        return []

    @staticmethod
    def _health_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data or result.data.get("dataMissing"):
            return []
        return [
            ActionDecisionEngine._navigate(
                "view_health_breakdown", "View full health breakdown",
                "financial_health",
            ),
        ]

    @staticmethod
    def _networth_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data or result.data.get("dataMissing"):
            return []
        # The Pulse dashboard is the net-worth overview surface.
        return [
            ActionDecisionEngine._navigate(
                "view_net_worth", "View dashboard", "pulse",
            ),
        ]

    @staticmethod
    def _cashflow_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data or result.data.get("dataMissing"):
            return []
        return [
            ActionDecisionEngine._navigate(
                "view_cash_flow", "View cash flow", "pulse",
            ),
        ]

    @staticmethod
    def _report_actions(result: AgentResult | None) -> list[SuggestedAction]:
        if not result or not result.data or result.data.get("dataMissing"):
            return []
        return [
            ActionDecisionEngine._navigate(
                "view_report", "View full report", "reports",
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


# Intent -> primary agent name (mirrors ResponseDecisionEngine._MAIN_AGENT).
ResponseMainAgent: dict[IntentEnum, str] = {
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
