"""Tests for ResponseDecisionEngine."""
from __future__ import annotations

import pytest

from app.ai.orchestrator.response_decision_engine import ResponseDecisionEngine
from app.ai.schemas import AgentResult, ResponseType
from app.ai.schemas.orchestration import IntentEnum


@pytest.fixture
def engine() -> ResponseDecisionEngine:
    return ResponseDecisionEngine()


def test_budget_with_overspending_is_actionable(engine: ResponseDecisionEngine) -> None:
    results = [
        AgentResult(
            agent_name="BudgetAgent",
            data={
                "totalBudget": 50000,
                "totalSpent": 54000,
                "overspendingCategories": [{"category": "Food", "amount": 9000}],
            },
        )
    ]
    decision = engine.decide(IntentEnum.BUDGET, results)

    assert decision.response_type == ResponseType.ACTIONABLE_ANALYSIS
    assert decision.show_artifact is True
    assert decision.artifact_type == "budget_card"
    assert decision.show_actions is True
    assert decision.missing_data is False


def test_budget_with_no_data_is_clarification(engine: ResponseDecisionEngine) -> None:
    results = [AgentResult(agent_name="BudgetAgent", data={})]
    decision = engine.decide(IntentEnum.BUDGET, results)

    assert decision.response_type == ResponseType.CLARIFICATION
    assert decision.missing_data is True
    assert decision.show_artifact is False


def test_education_is_simple_and_asks_follow_up(engine: ResponseDecisionEngine) -> None:
    results = [AgentResult(agent_name="EducationAgent", data={"question": "what is a mutual fund"})]
    decision = engine.decide(IntentEnum.EDUCATION, results)

    assert decision.response_type == ResponseType.EDUCATIONAL
    assert decision.show_artifact is False
    assert decision.show_follow_up is True


def test_greeting_is_simple_answer(engine: ResponseDecisionEngine) -> None:
    decision = engine.decide(IntentEnum.GREETING, [])

    assert decision.response_type == ResponseType.SIMPLE_ANSWER
    assert decision.show_artifact is False


def test_goal_behind_is_actionable(engine: ResponseDecisionEngine) -> None:
    results = [
        AgentResult(
            agent_name="GoalAgent",
            data={"goal_name": "House", "status": "behind", "monthly_required": 15000},
        )
    ]
    decision = engine.decide(IntentEnum.GOAL, results)

    assert decision.response_type == ResponseType.ACTIONABLE_ANALYSIS
    assert decision.artifact_type == "goal_card"


def test_health_healthy_is_financial_analysis(engine: ResponseDecisionEngine) -> None:
    results = [AgentResult(agent_name="HealthAgent", data={"overallScore": 85})]
    decision = engine.decide(IntentEnum.HEALTH, results)

    assert decision.response_type == ResponseType.FINANCIAL_ANALYSIS
    assert decision.artifact_type == "health_card"


def test_api_intent_string_converted(engine: ResponseDecisionEngine) -> None:
    results = [AgentResult(agent_name="BudgetAgent", data={"totalBudget": 10000})]
    decision = engine.decide("budget_analysis", results)

    assert decision.artifact_type == "budget_card"
