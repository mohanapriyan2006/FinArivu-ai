"""Tests for SSE streaming events."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest

from app.ai.orchestrator.response_builder import ResponseBuilder
from app.ai.providers.base import AIProviderResponse
from app.ai.schemas import (
    AgentResult,
    CopilotIntent,
    PlannerOutput,
    ResponseStyle,
    StreamEventType,
)


def _make_stream_provider(tokens: list[str]) -> AsyncMock:
    """Create a mock provider that streams the given tokens."""
    mock = AsyncMock()

    async def _stream(*args, **kwargs):
        for token in tokens:
            yield token

    mock.stream = _stream
    return mock


@pytest.fixture
def plan() -> PlannerOutput:
    return PlannerOutput(
        intent=CopilotIntent.BUDGET_ANALYSIS,
        agents=["BudgetAgent"],
        tools=["BudgetEngine"],
        response_style=ResponseStyle.EDUCATIONAL,
    )


@pytest.fixture
def results() -> list[AgentResult]:
    return [
        AgentResult(
            agent_name="BudgetAgent",
            data={"totalBudget": 50000, "totalSpent": 42000},
            summary="Budget is under control.",
            confidence=1.0,
        ),
    ]


class TestStreamEvents:
    """Verify that build_stream yields correct SSE event types."""

    @pytest.mark.asyncio
    async def test_stream_yields_agent_done(
        self, plan: PlannerOutput, results: list[AgentResult],
    ) -> None:
        provider = _make_stream_provider(["Your ", "budget ", "looks ", "good."])
        builder = ResponseBuilder(provider)

        events = []
        async for event in builder.build_stream("How is my budget?", plan, results):
            events.append(event)

        event_types = [e.event_type for e in events]
        assert StreamEventType.AGENT_DONE in event_types
        assert StreamEventType.DATA in event_types
        assert StreamEventType.TOKEN in event_types
        assert events[-1].event_type == StreamEventType.DONE

    @pytest.mark.asyncio
    async def test_stream_tokens_concatenate(
        self, plan: PlannerOutput, results: list[AgentResult],
    ) -> None:
        tokens = ["Your ", "budget ", "is ", "on track."]
        provider = _make_stream_provider(tokens)
        builder = ResponseBuilder(provider)

        token_data: list[str] = []
        async for event in builder.build_stream("Budget status", plan, results):
            if event.event_type == StreamEventType.TOKEN:
                token_data.append(event.data)

        assert "".join(token_data) == "Your budget is on track."

    @pytest.mark.asyncio
    async def test_data_event_contains_json(
        self, plan: PlannerOutput, results: list[AgentResult],
    ) -> None:
        provider = _make_stream_provider(["OK"])
        builder = ResponseBuilder(provider)

        data_events = []
        async for event in builder.build_stream("Budget", plan, results):
            if event.event_type == StreamEventType.DATA:
                data_events.append(event)

        assert len(data_events) == 1
        parsed = json.loads(data_events[0].data)
        assert "BudgetAgent" in parsed
