"""Conversation memory backed by the ``ai_messages`` table.

Loads recent history for LLM context injection and persists every
user ↔ assistant exchange with full metadata.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_messages import AIMessage


class ConversationMemory:
    """Async conversation memory for copilot sessions.

    All database access goes through the injected ``AsyncSession``.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def load_history(
        self,
        user_id: uuid.UUID,
        session_id: str,
        *,
        limit: int = 10,
    ) -> list[dict[str, str]]:
        """Return recent messages formatted for LLM context.

        Returns a list of ``{"role": ..., "content": ...}`` dicts ordered
        chronologically (oldest first).
        """
        query = (
            select(AIMessage)
            .where(
                AIMessage.user_id == user_id,
                AIMessage.session_id == session_id,
                AIMessage.blocked.is_(False),
            )
            .order_by(AIMessage.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(query)
        rows = list(reversed(result.scalars().all()))

        return [
            {"role": row.role, "content": row.content}
            for row in rows
            if row.role in {"user", "assistant"}
        ]

    async def save_message(
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
        blocked: bool = False,
        block_reason: str | None = None,
    ) -> AIMessage:
        """Persist a message and return the created row."""
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
            blocked=blocked,
            block_reason=block_reason,
        )
        self._session.add(msg)
        await self._session.flush()
        await self._session.refresh(msg)
        return msg

    async def get_session_messages(
        self,
        user_id: uuid.UUID,
        session_id: str,
        *,
        skip: int = 0,
        limit: int = 50,
    ) -> list[AIMessage]:
        """Return paginated messages for a session (for history endpoint)."""
        query = (
            select(AIMessage)
            .where(
                AIMessage.user_id == user_id,
                AIMessage.session_id == session_id,
            )
            .order_by(AIMessage.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self._session.execute(query)
        return list(result.scalars().all())
