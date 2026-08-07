"""Tests for specialist agents."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.ai.agents.budget_agent import BudgetAgent
from app.ai.agents.education_agent import EducationAgent
from app.ai.agents.health_agent import HealthAgent
from app.ai.agents.tax_agent import TaxAgent


@pytest.fixture
def mock_session() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def user_id() -> uuid.UUID:
    return uuid.uuid4()


class TestEducationAgent:
    """EducationAgent returns a pass-through result."""

    @pytest.mark.asyncio
    async def test_returns_education_result(
        self, mock_session: AsyncMock, user_id: uuid.UUID,
    ) -> None:
        agent = EducationAgent(mock_session)
        context = {"user_message": "What is a SIP?"}

        result = await agent.execute(user_id, context)

        assert result.agent_name == "EducationAgent"
        assert result.data["type"] == "education"
        assert result.data["question"] == "What is a SIP?"
        assert result.confidence == 1.0


class TestBudgetAgent:
    """BudgetAgent delegates to the budget engine."""

    @pytest.mark.asyncio
    async def test_returns_budget_data(
        self, mock_session: AsyncMock, user_id: uuid.UUID,
    ) -> None:
        mock_data = {
            "totalBudget": 50000,
            "totalSpent": 45000,
            "overallUtilization": 0.9,
            "overspendingCategories": [],
        }
        with patch(
            "app.ai.agents.budget_agent.get_budget_analysis",
            new_callable=AsyncMock,
            return_value=mock_data,
        ):
            agent = BudgetAgent(mock_session)
            result = await agent.execute(user_id, {})

        assert result.agent_name == "BudgetAgent"
        assert result.data["totalBudget"] == 50000
        assert result.confidence == 1.0


class TestTaxAgent:
    """TaxAgent delegates to the tax engine."""

    @pytest.mark.asyncio
    async def test_returns_tax_comparison(
        self, mock_session: AsyncMock, user_id: uuid.UUID,
    ) -> None:
        mock_data = {
            "better_regime": "new",
            "savings": 15000.0,
        }
        with patch(
            "app.ai.agents.tax_agent.get_tax_comparison",
            new_callable=AsyncMock,
            return_value=mock_data,
        ):
            agent = TaxAgent(mock_session)
            result = await agent.execute(user_id, {})

        assert result.agent_name == "TaxAgent"
        assert "new" in result.summary
        assert result.confidence == 1.0


class TestHealthAgent:
    """HealthAgent delegates to the health score engine."""

    @pytest.mark.asyncio
    async def test_returns_health_score(
        self, mock_session: AsyncMock, user_id: uuid.UUID,
    ) -> None:
        mock_data = {
            "overallScore": 72,
            "recommendations": ["Save more", "Reduce debt"],
        }
        with patch(
            "app.ai.agents.health_agent.get_health_score",
            new_callable=AsyncMock,
            return_value=mock_data,
        ):
            agent = HealthAgent(mock_session)
            result = await agent.execute(user_id, {})

        assert result.agent_name == "HealthAgent"
        assert result.data["overallScore"] == 72
        assert "72" in result.summary


class TestSafeExecute:
    """Verify safe_execute captures exceptions."""

    @pytest.mark.asyncio
    async def test_error_captured(
        self, mock_session: AsyncMock, user_id: uuid.UUID,
    ) -> None:
        with patch(
            "app.ai.agents.budget_agent.get_budget_analysis",
            new_callable=AsyncMock,
            side_effect=RuntimeError("Engine down"),
        ):
            agent = BudgetAgent(mock_session)
            result = await agent.safe_execute(user_id, {})

        assert result.error is not None
        assert "Engine down" in result.error
        assert result.confidence == 0.0
