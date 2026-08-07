"""Tests for the Copilot API endpoints."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.ai.schemas import (
    CopilotChatResponse,
    CopilotHealthResponse,
    CopilotIntent,
)


class TestCopilotChatEndpoint:
    """Verify the /api/v1/copilot/chat endpoint logic."""

    @pytest.mark.asyncio
    async def test_empty_message_returns_prompt(self) -> None:
        from app.ai.service import CopilotService
        from app.ai.schemas import CopilotChatRequest

        session = AsyncMock()
        service = CopilotService(session)
        request = CopilotChatRequest(session_id="test-session", message="   ")

        response = await service.chat(uuid.uuid4(), request)

        assert "didn't receive" in response.message.lower()
        assert not response.guardrail_triggered

    @pytest.mark.asyncio
    async def test_harmful_message_blocked(self) -> None:
        from app.ai.service import CopilotService
        from app.ai.schemas import CopilotChatRequest

        session = AsyncMock()
        service = CopilotService(session)
        # Patch memory to avoid DB interaction
        service._memory = AsyncMock()
        service._memory.save_message = AsyncMock()

        request = CopilotChatRequest(
            session_id="test-session",
            message="What is my password?",
        )
        response = await service.chat(uuid.uuid4(), request)

        assert response.guardrail_triggered
        assert "can't help" in response.message.lower()

    @pytest.mark.asyncio
    async def test_non_financial_message_blocked(self) -> None:
        from app.ai.service import CopilotService
        from app.ai.schemas import CopilotChatRequest

        session = AsyncMock()
        service = CopilotService(session)
        service._memory = AsyncMock()
        service._memory.save_message = AsyncMock()

        request = CopilotChatRequest(
            session_id="test-session",
            message="What is the weather today?",
        )
        response = await service.chat(uuid.uuid4(), request)

        assert response.guardrail_triggered
        assert "personal finance" in response.message.lower()


class TestCopilotHealthEndpoint:
    """Verify the health check response schema."""

    def test_health_response_schema(self) -> None:
        response = CopilotHealthResponse(
            provider="gemini",
            model="gemini-2.5-flash",
            healthy=True,
            latency_ms=150,
        )
        data = response.model_dump()
        assert data["provider"] == "gemini"
        assert data["healthy"] is True
        assert data["latencyMs"] == 150
