from __future__ import annotations

import time
import uuid
from typing import Any, AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.metrics import ai_metrics
from app.ai.schemas import (
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotHealthResponse,
    StreamEvent,
)
from app.ai.service import CopilotService
from app.core.config import settings
from app.core.logger import logger


class CopilotController:
    """Single public entry point for the React Native AI Copilot.

    Wraps the lower-level CopilotService, collects provider metrics,
    and handles the non-streaming and streaming chat flows.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._service = CopilotService(session)

    async def chat(self, user_id: uuid.UUID, request: CopilotChatRequest) -> CopilotChatResponse:
        """Full synchronous chat flow with metrics."""
        provider = settings.ai_copilot_provider
        start = time.perf_counter()
        try:
            response = await self._service.chat(user_id, request)
            latency = int((time.perf_counter() - start) * 1000)
            ai_metrics.record(
                provider,
                latency_ms=latency,
                tokens_input=response.tokens_input,
                tokens_output=response.tokens_output,
            )
            return response
        except Exception:
            ai_metrics.record_error(provider)
            raise

    async def chat_stream(
        self,
        user_id: uuid.UUID,
        request: CopilotChatRequest,
    ) -> AsyncIterator[StreamEvent]:
        """Streaming chat flow — delegates to the service."""
        provider = settings.ai_copilot_provider
        try:
            async for event in self._service.chat_stream(user_id, request):
                yield event
        except Exception:
            ai_metrics.record_error(provider)
            raise

    async def get_history(
        self,
        user_id: uuid.UUID,
        session_id: str,
        *,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Return paginated conversation history."""
        return await self._service.get_history(user_id, session_id, skip=skip, limit=limit)

    async def check_health(self) -> CopilotHealthResponse:
        """Check AI provider health."""
        return await self._service.check_health()
