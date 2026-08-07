"""Tests for the AI Planner service."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest

from app.ai.orchestrator.planner import AIPlannerService
from app.ai.providers.base import AIProviderResponse
from app.ai.schemas import CopilotIntent, ResponseStyle


def _make_provider(content: str) -> AsyncMock:
    """Create a mock provider that returns the given content."""
    mock = AsyncMock()
    mock.chat = AsyncMock(return_value=AIProviderResponse(
        content=content,
        provider_name="test",
        model="test-model",
    ))
    return mock


class TestPlannerParsing:
    """Verify the planner correctly parses structured JSON responses."""

    @pytest.mark.asyncio
    async def test_valid_json_parsed(self) -> None:
        payload = json.dumps({
            "intent": "budget_analysis",
            "agents": ["BudgetAgent", "HealthAgent"],
            "tools": ["BudgetEngine"],
            "needs_profile": True,
            "needs_history": False,
            "response_style": "educational",
        })
        provider = _make_provider(payload)
        planner = AIPlannerService(provider)

        result = await planner.plan("How is my budget?")

        assert result.intent == CopilotIntent.BUDGET_ANALYSIS
        assert "BudgetAgent" in result.agents
        assert "HealthAgent" in result.agents
        assert result.needs_profile is True
        assert result.response_style == ResponseStyle.EDUCATIONAL

    @pytest.mark.asyncio
    async def test_json_in_markdown_fences(self) -> None:
        payload = '```json\n{"intent": "tax_planning", "agents": ["TaxAgent"], "tools": [], "needs_profile": false, "needs_history": false, "response_style": "concise"}\n```'
        provider = _make_provider(payload)
        planner = AIPlannerService(provider)

        result = await planner.plan("Compare tax regimes")

        assert result.intent == CopilotIntent.TAX_PLANNING
        assert result.agents == ["TaxAgent"]

    @pytest.mark.asyncio
    async def test_invalid_json_falls_back(self) -> None:
        provider = _make_provider("This is not JSON at all")
        planner = AIPlannerService(provider)

        result = await planner.plan("Hello")

        assert result.intent == CopilotIntent.EDUCATION
        assert result.agents == ["EducationAgent"]

    @pytest.mark.asyncio
    async def test_unknown_intent_defaults_to_general(self) -> None:
        payload = json.dumps({
            "intent": "unknown_intent_xyz",
            "agents": [],
            "tools": [],
        })
        provider = _make_provider(payload)
        planner = AIPlannerService(provider)

        result = await planner.plan("Something")

        assert result.intent == CopilotIntent.GENERAL

    @pytest.mark.asyncio
    async def test_provider_failure_returns_fallback(self) -> None:
        provider = AsyncMock()
        provider.chat = AsyncMock(side_effect=RuntimeError("API down"))
        planner = AIPlannerService(provider)

        result = await planner.plan("Help me budget")

        assert result.intent == CopilotIntent.EDUCATION
        assert result.agents == ["EducationAgent"]
