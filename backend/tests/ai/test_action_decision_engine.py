"""Tests for ActionDecisionEngine."""
from __future__ import annotations

import pytest

from app.ai.orchestrator.action_decision_engine import ActionDecisionEngine
from app.ai.schemas import AgentResult, SuggestedAction
from app.ai.schemas.orchestration import IntentEnum


@pytest.fixture
def engine() -> ActionDecisionEngine:
    return ActionDecisionEngine()


def test_budget_overspending_generates_view_and_adjust_actions(engine: ActionDecisionEngine) -> None:
    results = [
        AgentResult(
            agent_name="BudgetAgent",
            data={
                "totalBudget": 50000,
                "totalSpent": 54000,
                "overspendingCategories": [
                    {"category": "Food & Dining", "amount": 9000},
                    {"category": "Travel", "amount": 4000},
                ],
            },
        )
    ]
    actions, follow_ups = engine.build(IntentEnum.BUDGET, results)

    assert len(actions) <= 2
    assert all(isinstance(a, SuggestedAction) for a in actions)
    assert actions[0].type == "NAVIGATE"
    assert "expenses" in actions[0].id


def test_budget_on_track_suggests_view_budget(engine: ActionDecisionEngine) -> None:
    results = [AgentResult(agent_name="BudgetAgent", data={"totalBudget": 50000, "totalSpent": 30000})]
    actions, _ = engine.build(IntentEnum.BUDGET, results)

    assert len(actions) == 1
    assert actions[0].id == "view_budget"


def test_goal_behind_suggests_view_and_increase_savings(engine: ActionDecisionEngine) -> None:
    results = [
        AgentResult(
            agent_name="GoalAgent",
            data={"goal_name": "House", "goal_id": "abc-123", "status": "behind"},
        )
    ]
    actions, _ = engine.build(IntentEnum.GOAL, results)

    assert len(actions) <= 2
    assert any("view" in a.id for a in actions)
    assert any("increase" in a.id for a in actions)


def test_education_mutual_fund_returns_follow_up(engine: ActionDecisionEngine) -> None:
    results = [
        AgentResult(agent_name="EducationAgent", data={"question": "what is a mutual fund"})
    ]
    actions, follow_ups = engine.build(IntentEnum.EDUCATION, results)

    assert len(actions) == 0
    assert len(follow_ups) == 1
    assert "mutual funds different from stocks" in follow_ups[0].label


def test_mixed_intent_caps_at_three_actions(engine: ActionDecisionEngine) -> None:
    results = [
        AgentResult(agent_name="BudgetAgent", data={"overspendingCategories": [{"category": "Food", "amount": 1000}]}),
        AgentResult(agent_name="GoalAgent", data={"goal_name": "Car", "status": "behind"}),
        AgentResult(agent_name="TaxAgent", data={"better_regime": "new"}),
    ]
    actions, _ = engine.build(IntentEnum.MIXED, results)

    assert len(actions) <= 3
