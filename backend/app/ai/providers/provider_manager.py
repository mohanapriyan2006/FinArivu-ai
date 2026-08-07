from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger


@dataclass
class ProviderUsage:
    """Single provider usage record."""

    provider: str
    model: str
    latency_ms: int
    tokens_input: int
    tokens_output: int
    success: bool
    fallback: bool


class ProviderManager:
    """Tracks AI provider usage and stores metrics in PostgreSQL.

    Uses the ``ai_messages`` table for persistence because it already stores
    provider, model, latency and tokens.  A separate ``ai_metrics`` view/table
    can be added later.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._in_memory: list[ProviderUsage] = []

    def record(
        self,
        provider: str,
        model: str,
        *,
        latency_ms: int,
        tokens_input: int = 0,
        tokens_output: int = 0,
        success: bool = True,
        fallback: bool = False,
    ) -> None:
        """Record a provider call in memory."""
        usage = ProviderUsage(
            provider=provider,
            model=model,
            latency_ms=latency_ms,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            success=success,
            fallback=fallback,
        )
        self._in_memory.append(usage)
        logger.debug("Provider usage recorded: %s", usage)

    async def save_to_db(
        self,
        user_id: uuid.UUID,
        session_id: str,
    ) -> None:
        """Persist accumulated metrics to the database.

        Currently a no-op because each message already stores provider metrics.
        """
        if not self._in_memory:
            return
        self._in_memory.clear()

    def summary(self) -> dict[str, Any]:
        """Return an aggregated summary of recorded provider usage."""
        if not self._in_memory:
            return {}

        total = len(self._in_memory)
        success = sum(1 for u in self._in_memory if u.success)
        fallbacks = sum(1 for u in self._in_memory if u.fallback)
        latencies = [u.latency_ms for u in self._in_memory]
        by_provider: dict[str, dict[str, int]] = {}

        for u in self._in_memory:
            entry = by_provider.setdefault(
                u.provider,
                {"requests": 0, "errors": 0, "tokens_input": 0, "tokens_output": 0},
            )
            entry["requests"] += 1
            if not u.success:
                entry["errors"] += 1
            entry["tokens_input"] += u.tokens_input
            entry["tokens_output"] += u.tokens_output

        return {
            "total": total,
            "success": success,
            "failures": total - success,
            "fallbacks": fallbacks,
            "avg_latency_ms": round(sum(latencies) / len(latencies), 2) if latencies else 0,
            "by_provider": by_provider,
            "window_seconds": 0,
        }
