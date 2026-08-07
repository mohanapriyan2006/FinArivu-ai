"""Tests for AI provider interface compliance."""

from __future__ import annotations

import pytest

from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.ai.schemas import CopilotIntent, PlannerOutput, ResponseStyle


class TestAIProviderResponse:
    """Verify the standardised response dataclass."""

    def test_defaults(self) -> None:
        resp = AIProviderResponse(
            content="Hello",
            provider_name="test",
            model="test-model",
        )
        assert resp.content == "Hello"
        assert resp.tokens_input == 0
        assert resp.tokens_output == 0
        assert resp.latency_ms == 0
        assert resp.raw == {}

    def test_with_metadata(self) -> None:
        resp = AIProviderResponse(
            content="Result",
            provider_name="gemini",
            model="gemini-2.5-flash",
            tokens_input=100,
            tokens_output=50,
            latency_ms=250,
        )
        assert resp.tokens_input == 100
        assert resp.tokens_output == 50
        assert resp.latency_ms == 250


class TestPlannerOutput:
    """Verify the PlannerOutput schema validation."""

    def test_default_values(self) -> None:
        plan = PlannerOutput()
        assert plan.intent == CopilotIntent.GENERAL
        assert plan.agents == []
        assert plan.response_style == ResponseStyle.EDUCATIONAL

    def test_valid_intent_parsing(self) -> None:
        plan = PlannerOutput(intent="budget_analysis", agents=["BudgetAgent"])
        assert plan.intent == CopilotIntent.BUDGET_ANALYSIS

    def test_serialisation(self) -> None:
        plan = PlannerOutput(
            intent=CopilotIntent.TAX_PLANNING,
            agents=["TaxAgent"],
            tools=["TaxEngine"],
            needs_profile=True,
        )
        data = plan.model_dump()
        assert data["intent"] == "tax_planning"
        assert data["needsProfile"] is True


class TestBaseAIProviderInterface:
    """Verify that BaseAIProvider cannot be instantiated directly."""

    def test_abstract_class(self) -> None:
        with pytest.raises(TypeError):
            BaseAIProvider()  # type: ignore
