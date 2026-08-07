from __future__ import annotations

import time
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger


class MetricsService:
    """Records AI Copilot execution metrics in PostgreSQL.

    Metrics are stored via the existing ``AIMessage`` model (provider, model,
    latency, tokens) plus an in-memory window for observability.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._start = time.perf_counter()

    async def record_message(
        self,
        user_id: uuid.UUID,
        session_id: str,
        role: str,
        content: str,
        *,
        intent: str | None = None,
        provider: str | None = None,
        model: str | None = None,
        tokens_input: int = 0,
        tokens_output: int = 0,
        latency_ms: int = 0,
        agent_chain: dict[str, Any] | None = None,
    ) -> Any:
        """Record a message with full metadata to PostgreSQL."""
        from app.models.ai_messages import AIMessage

        msg = AIMessage(
            user_id=user_id,
            session_id=session_id,
            role=role,
            content=content[:4000],
            intent=intent,
            provider=provider,
            model=model,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            latency_ms=latency_ms,
            agent_chain=agent_chain,
        )
        self._session.add(msg)
        await self._session.flush()
        await self._session.refresh(msg)
        logger.debug("Metrics recorded for %s / %s", provider, model)
        return msg

    def execution_time_ms(self) -> int:
        """Return elapsed time since service creation in milliseconds."""
        return int((time.perf_counter() - self._start) * 1000)
