"""Tests for the AI orchestration ResponseBuilder."""
from __future__ import annotations

import time
from collections.abc import AsyncIterator
from typing import Any

import pytest

from app.ai.orchestrator.response_builder import ResponseBuilder
from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.ai.schemas import AgentResult, PlannerOutput, CopilotIntent, ResponseStyle


class _FakeProvider(BaseAIProvider):
    @property
    def name(self) -> str:
        return "fake"

    @property
    def model_name(self) -> str:
        return "fake-model"

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: dict[str, str] | None = None,
    ) -> AIProviderResponse:
        return AIProviderResponse(
            content="Here is your summary.",
            provider_name=self.name,
            model=self.model_name,
            tokens_input=10,
            tokens_output=5,
        )

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        yield "Here "
        yield "is "
        yield "your summary."

    async def health(self) -> bool:
        return True


@pytest.fixture
def builder() -> ResponseBuilder:
    return ResponseBuilder(_FakeProvider())


@pytest.fixture
def planner() -> PlannerOutput:
    return PlannerOutput(
        intent=CopilotIntent.BUDGET_ANALYSIS,
        agents=["BudgetAgent"],
        response_style=ResponseStyle.CONCISE,
    )


async def test_build_full_returns_structured_result(builder: ResponseBuilder, planner: PlannerOutput) -> None:
    results = [
        AgentResult(
            agent_name="BudgetAgent",
            data={
                "spent": 30000,
                "budget": 35000,
                "categories": ["Food", "Rent"],
            },
            summary="Spending is within budget.",
        ),
        AgentResult(
            agent_name="InsightAgent",
            data={
                "insights": ["Great savings rate."],
                "follow_up_questions": [{"text": "How can I invest?"}],
                "suggested_actions": [{"label": "View budget", "action": "view_budget", "route": "/budget"}],
            },
            summary="Insight complete.",
        ),
        AgentResult(
            agent_name="RecommendationAgent",
            data={
                "recommendations": [{"title": "Reduce dining", "description": "Cut dining spend", "category": "budget"}],
            },
            summary="Recommendation complete.",
        ),
    ]

    build = await builder.build_full("How is my budget?", planner, results, time.perf_counter() - 0.1)

    assert build.message == "Here is your summary."
    assert build.artifacts
    assert any(a.type == "budget_card" for a in build.artifacts)
    assert len(build.recommendations) == 1
    assert build.recommendations[0].title == "Reduce dining"
    assert len(build.follow_up_questions) == 1
    assert len(build.suggested_actions) == 1
    assert build.metadata.agents_used == ["BudgetAgent", "InsightAgent", "RecommendationAgent"]
    assert build.metadata.provider == "fake"
    assert build.ai_response is not None
    assert build.ai_response.tokens_output == 5
