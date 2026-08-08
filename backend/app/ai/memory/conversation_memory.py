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

    async def get_sessions(
        self,
        user_id: uuid.UUID,
        *,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Return distinct sessions for the user with a preview title and time."""
        query = (
            select(AIMessage)
            .where(
                AIMessage.user_id == user_id,
                AIMessage.role.in_(("user", "assistant")),
            )
            .order_by(AIMessage.created_at.asc())
            .limit(2000)
        )
        result = await self._session.execute(query)
        rows = list(result.scalars().all())

        sessions: dict[str, dict[str, Any]] = {}
        for row in rows:
            sid = row.session_id
            if sid not in sessions:
                sessions[sid] = {
                    "session_id": sid,
                    "title": None,
                    "created_at": row.created_at,
                    "updated_at": row.created_at,
                    "message_count": 0,
                }
            if row.role == "user" and sessions[sid]["title"] is None:
                sessions[sid]["title"] = (
                    row.content[:60] + ("..." if len(row.content) > 60 else "")
                )
            sessions[sid]["message_count"] += 1
            if row.created_at and row.created_at > sessions[sid]["updated_at"]:
                sessions[sid]["updated_at"] = row.created_at

        return sorted(
            [
                {
                    "session_id": sid,
                    "title": data["title"] or "New chat",
                    "created_at": data["created_at"].isoformat() if data["created_at"] else None,
                    "updated_at": data["updated_at"].isoformat() if data["updated_at"] else None,
                    "message_count": data["message_count"],
                }
                for sid, data in sessions.items()
            ],
            key=lambda s: s["updated_at"] or "",
            reverse=True,
        )[:limit]
