"""Phase 0 architecture contracts.

Pins the invariants that keep the copilot pipeline internally consistent:

* One intent vocabulary — ``IntentEnum`` internal, ``CopilotIntent`` on the
  wire, ``app.ai.intents`` as the only converter.
* One agent vocabulary — ``AgentName`` / ``AgentRegistry`` /
  ``CONTROLLER_SELECTABLE_AGENTS`` stay in sync, and the controller cannot
  schedule agents outside the allow-list.
* One artifact vocabulary — ``ArtifactType`` / ``ArtifactBuilder`` /
  decision engines / frontend renderers use the same strings.
* Canonical wire shape — ``CopilotChatResponse`` serialises camelCase keys.
"""
from __future__ import annotations

import pytest

from app.ai.controller.controller_schema import ControllerPlan
from app.ai.intents import (
    COPILOT_TO_INTERNAL,
    INTERNAL_TO_COPILOT,
    normalize_intent_str,
    to_copilot_intent,
    to_internal_intent,
)
from app.ai.orchestrator.action_decision_engine import (
    NAVIGATION_TARGETS,
    ActionDecisionEngine,
)
from app.ai.registry.registry import (
    CONTROLLER_SELECTABLE_AGENTS,
    AgentName,
    AgentRegistry,
)
from app.ai.schemas.copilot import (
    ActionType,
    CopilotChatResponse,
    CopilotIntent,
    SuggestedAction,
)
from app.ai.schemas.orchestration import (
    GuardrailChatResponse,
    IntentEnum,
)
from app.financial.artifacts.artifact_builder import ArtifactBuilder
from app.financial.artifacts.schemas import Artifact, ArtifactType


# ── Intent contracts ─────────────────────────────────────────────────────


def test_api_intents_all_map_to_internal() -> None:
    for intent in CopilotIntent:
        internal = COPILOT_TO_INTERNAL.get(intent)
        assert internal is not None, f"{intent} has no internal mapping"
        assert isinstance(internal, IntentEnum)


def test_internal_intents_all_map_to_api() -> None:
    for intent in IntentEnum:
        api_intent = INTERNAL_TO_COPILOT.get(intent)
        assert api_intent is not None, f"{intent} has no API mapping"
        assert isinstance(api_intent, CopilotIntent)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("budget", IntentEnum.BUDGET),
        ("budget_analysis", IntentEnum.BUDGET),
        ("BUDGET", IntentEnum.BUDGET),
        ("net_worth", IntentEnum.NETWORTH),
        ("NETWORTH", IntentEnum.NETWORTH),
        ("cashflow", IntentEnum.CASH_FLOW),
        ("cash_flow", IntentEnum.CASH_FLOW),
        ("tax_planning", IntentEnum.TAX),
        ("investment_advice", IntentEnum.UNSUPPORTED_INVESTMENT_ADVICE),
        ("gibberish-intent", IntentEnum.GENERAL),
        ("", IntentEnum.GENERAL),
    ],
)
def test_normalize_intent_str(raw: str, expected: IntentEnum) -> None:
    assert normalize_intent_str(raw) == expected


def test_intent_round_trip_via_helpers() -> None:
    assert to_internal_intent(CopilotIntent.TAX_PLANNING) == IntentEnum.TAX
    assert to_internal_intent("goal_tracking") == IntentEnum.GOAL
    assert to_copilot_intent(IntentEnum.HEALTH) == CopilotIntent.HEALTH_SCORE
    assert to_copilot_intent(IntentEnum.CASH_FLOW) == CopilotIntent.GENERAL


# ── Agent registry contracts ─────────────────────────────────────────────


def test_selectable_agents_are_all_registered() -> None:
    registry = AgentRegistry()
    for name in CONTROLLER_SELECTABLE_AGENTS:
        assert registry.has(name), f"{name} selectable but not registered"
        assert registry.get(name) is not None


def test_registry_covers_agent_name_enum() -> None:
    registry = AgentRegistry()
    assert set(registry.list_agents()) == {a.value for a in AgentName}


def test_cashflow_agent_registered() -> None:
    registry = AgentRegistry()
    assert registry.get(AgentName.CASHFLOW.value) is not None


def test_controller_plan_filters_non_selectable_agents() -> None:
    plan = ControllerPlan(
        request_id="r1",
        intent="budget",
        confidence=0.9,
        selected_agents=[
            "BudgetAgent",
            "RecommendationAgent",  # registered but not selectable
            "FakeAgent",  # not registered at all
        ],
    )
    execution = plan.to_execution_plan()
    assert [s.agent_name for s in execution.steps] == ["BudgetAgent"]


def test_controller_plan_invalid_intent_falls_back() -> None:
    plan = ControllerPlan(
        request_id="r2",
        intent="execute_wire_transfer",
        confidence=0.9,
        selected_agents=["BudgetAgent"],
    )
    assert plan.to_intent_enum() == IntentEnum.GENERAL
    assert plan.to_execution_plan().intent == IntentEnum.GENERAL


# ── Artifact contracts ───────────────────────────────────────────────────


def test_artifact_builder_uses_canonical_types() -> None:
    valid = {t.value for t in ArtifactType}
    for name in AgentName:
        artifact = ArtifactBuilder.from_agent_data(name.value, {"x": 1})
        if artifact is not None:
            assert artifact.type in valid, f"{name.value} produced {artifact.type}"


def test_artifact_builder_skips_empty_and_error_payloads() -> None:
    assert ArtifactBuilder.from_agent_data("BudgetAgent", {}) is None
    assert ArtifactBuilder.from_agent_data("BudgetAgent", {"error": "boom"}) is None
    assert ArtifactBuilder.from_agent_data("BudgetAgent", {"missing": True}) is None


def test_artifact_builder_unknown_agent_returns_none() -> None:
    assert ArtifactBuilder.from_agent_data("FakeAgent", {"x": 1}) is None


def test_artifact_serialises_camel_case_shape() -> None:
    artifact = Artifact(type="budget_card", title="Budget", content={"totalSpent": 100})
    dumped = artifact.model_dump(by_alias=True)
    assert dumped["type"] == "budget_card"
    assert dumped["content"]["totalSpent"] == 100


# ── Suggested-action contracts ───────────────────────────────────────────


def test_navigate_action_requires_route() -> None:
    with pytest.raises(Exception):
        SuggestedAction(id="x", label="Go", type=ActionType.NAVIGATE)


def test_navigate_action_with_route_is_valid() -> None:
    action = SuggestedAction(
        id="view_budget", label="View Budget", type=ActionType.NAVIGATE, route="budget"
    )
    dumped = action.model_dump(by_alias=True)
    assert dumped["type"] == "NAVIGATE"
    assert dumped["route"] == "budget"


def test_navigation_targets_are_whitelisted() -> None:
    # The frontend allow-list mirrors this set — any change here must be
    # reflected in src/navigation/actionRoutes.ts.
    assert "pulse" in NAVIGATION_TARGETS
    assert "execute_payment" not in NAVIGATION_TARGETS


# ── Response wire contracts ──────────────────────────────────────────────


def test_copilot_response_serialises_camel_case() -> None:
    response = CopilotChatResponse(
        message="hi",
        intent=CopilotIntent.GENERAL,
        suggested_actions=[
            SuggestedAction(
                id="view_budget",
                label="View Budget",
                type=ActionType.NAVIGATE,
                route="budget",
            )
        ],
        guardrail_triggered=False,
    )
    dumped = response.model_dump(by_alias=True, exclude_none=True)
    assert "suggestedActions" in dumped
    assert "guardrailTriggered" in dumped
    assert dumped["suggestedActions"][0]["type"] == "NAVIGATE"


def test_guardrail_response_is_lightweight() -> None:
    blocked = GuardrailChatResponse(
        message="I can't help with that.",
        guardrail_triggered=True,
    )
    assert blocked.guardrail_triggered is True
    dumped = blocked.model_dump(by_alias=True)
    assert dumped["guardrail_triggered"] is True or dumped.get("guardrailTriggered") is True


def test_action_decision_engine_drops_unknown_routes() -> None:
    engine = ActionDecisionEngine()
    actions, _ = engine.build(
        IntentEnum.BUDGET,
        [],  # engine-level actions only use whitelisted routes
    )
    for action in actions:
        if action.type == ActionType.NAVIGATE:
            assert action.route in NAVIGATION_TARGETS
