"""Tests for the FinancialHealthEngine and health score calculation."""
from __future__ import annotations

from decimal import Decimal

import pytest

from app.engines.health_score import (
    FinancialHealthEngine,
    HealthScoreResult,
    calculate_health_score,
)


def test_calculate_health_score():
    result = calculate_health_score(
        monthly_income=Decimal("100000"),
        monthly_expenses=Decimal("60000"),
        emergency_assets=Decimal("300000"),
        total_debt=Decimal("500000"),
        annual_income=Decimal("1200000"),
        average_goal_progress=Decimal("0.45"),
        average_budget_utilization=Decimal("0.85"),
    )

    assert isinstance(result, HealthScoreResult)
    assert result.overall_score == 80
    assert result.savings_score == Decimal("30")
    assert result.emergency_score == Decimal("15")
    assert result.debt_score == Decimal("15")
    assert result.goal_score == Decimal("5")
    assert result.budget_score == Decimal("15")
    assert len(result.recommendations) == 5
    assert "savings_rate" in result.breakdown


def test_engine_empty_profile():
    engine = FinancialHealthEngine()
    result = engine.calculate({})
    assert isinstance(result, dict)
    assert "overall_score" in result
    assert result["overall_score"] == 72
