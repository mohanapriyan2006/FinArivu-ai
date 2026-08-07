"""Tests for the new financial layer engines (simulation, recommendation, report, cashflow).

Engines that require an AsyncSession (budget, health, goal, networth, tax, retirement,
cashflow, report) are tested via the API integration tests in test_financial.py.
This file covers engines that can be tested without a database session.
"""
from __future__ import annotations

from app.financial.engines.recommendation_engine import RecommendationEngine
from app.financial.engines.simulation_engine import SimulationEngine
from app.financial.schemas import ScenarioInput


# ── SimulationEngine ──────────────────────────────────────────────────────


def test_simulation_monthly_savings_increase():
    scenario = ScenarioInput(variable="monthly_savings", delta=5000, unit="amount")
    result = SimulationEngine.run(scenario, {
        "monthly_income": 100000,
        "monthly_expenses": 60000,
        "monthly_savings": 40000,
        "savings_rate": 0.4,
        "retirement_corpus": 500000,
    })
    assert result.optimized["monthly_savings"] == 45000
    assert result.difference["monthly_savings_change"] == 5000
    assert result.optimized["retirement_corpus"] > result.current["retirement_corpus"]
    assert len(result.recommendations) > 0


def test_simulation_income_percent_increase():
    scenario = ScenarioInput(variable="monthly_income", delta=10, unit="percent")
    result = SimulationEngine.run(scenario, {
        "monthly_income": 100000,
        "monthly_expenses": 60000,
        "monthly_savings": 40000,
        "savings_rate": 0.4,
        "retirement_corpus": 0,
    })
    # 10% of 100000 = 10000 extra savings
    assert result.difference["monthly_savings_change"] == 10000


def test_simulation_expenses_percent_decrease():
    scenario = ScenarioInput(variable="expenses", delta=10, unit="percent")
    result = SimulationEngine.run(scenario, {
        "monthly_income": 100000,
        "monthly_expenses": 60000,
        "monthly_savings": 40000,
        "savings_rate": 0.4,
        "retirement_corpus": 0,
    })
    # 10% of 60000 = 6000 reduction in savings
    assert result.difference["monthly_savings_change"] == -6000


# ── RecommendationEngine ──────────────────────────────────────────────────


def test_recommendation_engine_overspending():
    result = RecommendationEngine.generate({
        "BudgetAgent": {
            "overspending_categories": [
                {"category": "Food", "spent": 15000, "limit": 10000},
            ],
        },
    })
    assert len(result.recommendations) > 0
    assert result.recommendations[0].category == "budget"
    assert result.recommendations[0].priority == "high"


def test_recommendation_engine_low_health_score():
    result = RecommendationEngine.generate({
        "HealthAgent": {"overall_score": 50},
    })
    assert any(r.category == "emergency" for r in result.recommendations)


def test_recommendation_engine_goal_behind():
    result = RecommendationEngine.generate({
        "GoalAgent": {
            "goals": [{"name": "Vacation", "progress": 30}],
        },
    })
    assert any(r.category == "goals" for r in result.recommendations)


def test_recommendation_engine_tax_savings():
    result = RecommendationEngine.generate({
        "TaxAgent": {
            "savings_vs_other_regime": 15000,
            "recommended_regime": "old",
        },
    })
    assert any(r.category == "tax" for r in result.recommendations)


def test_recommendation_engine_low_savings_rate():
    result = RecommendationEngine.generate({
        "CashFlowAgent": {"savings_rate": 0.1},
    })
    assert any(r.category == "savings" for r in result.recommendations)


def test_recommendation_engine_empty_inputs():
    result = RecommendationEngine.generate({})
    assert len(result.recommendations) == 1
    assert result.recommendations[0].priority == "low"


def test_recommendation_engine_priority_summary():
    result = RecommendationEngine.generate({
        "BudgetAgent": {"overspending_categories": [{"category": "Food"}]},
        "HealthAgent": {"overall_score": 50},
    })
    assert "high" in result.priority_summary
    assert result.priority_summary["high"] >= 2
