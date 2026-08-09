"""Conversation memory backed by the ``ai_messages`` table.

Loads recent history for LLM context injection and persists every
user ↔ assistant exchange with full metadata. Session metadata is
kept in ``ai_chat_sessions`` so titles and delete state are first-class.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_chat_sessions import AIChatSession
from app.models.ai_messages import AIMessage
from app.repositories.ai_chat_sessions import AIChatSessionRepository


class ConversationMemory:
    """Async conversation memory for copilot sessions.

    All database access goes through the injected ``AsyncSession``.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._session_repo = AIChatSessionRepository(session)

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

    async def _ensure_session(
        self,
        user_id: uuid.UUID,
        session_id: str,
        content: str,
        role: str,
    ) -> None:
        """Ensure a session row exists and seed the title from the first user message."""
        title: str | None = None
        if role == "user":
            title = content[:60] + ("..." if len(content) > 60 else "")
        await self._session_repo.get_or_create_for_session(
            user_id, session_id, title
        )

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

        await self._ensure_session(user_id, session_id, msg.content, role)

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
        """Return active sessions for the user with aggregated message data."""
        stmt = (
            select(
                AIChatSession.session_id,
                AIChatSession.title,
                AIChatSession.created_at,
                AIChatSession.updated_at,
                func.count(AIMessage.id).label("message_count"),
                func.max(AIMessage.created_at).label("last_message_at"),
            )
            .select_from(AIChatSession)
            .outerjoin(
                AIMessage,
                and_(
                    AIChatSession.user_id == AIMessage.user_id,
                    AIChatSession.session_id == AIMessage.session_id,
                ),
            )
            .where(
                AIChatSession.user_id == user_id,
                AIChatSession.is_deleted.is_(False),
            )
            .group_by(
                AIChatSession.id,
                AIChatSession.session_id,
                AIChatSession.title,
                AIChatSession.created_at,
                AIChatSession.updated_at,
            )
            .order_by(
                desc(
                    func.coalesce(
                        func.max(AIMessage.created_at),
                        AIChatSession.updated_at,
                    )
                )
            )
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        rows = result.all()

        # Fallback to the first user message content for sessions with no title.
        session_ids = [r.session_id for r in rows if r.title is None]
        fallback_titles: dict[str, str] = {}
        if session_ids:
            first_msg_query = (
                select(AIMessage.session_id, AIMessage.content, AIMessage.created_at)
                .where(
                    AIMessage.user_id == user_id,
                    AIMessage.session_id.in_(session_ids),
                    AIMessage.role == "user",
                )
                .order_by(AIMessage.created_at.asc())
            )
            msg_result = await self._session.execute(first_msg_query)
            for sid, content, _ in msg_result.all():
                if sid not in fallback_titles:
                    fallback_titles[sid] = content[:60] + (
                        "..." if len(content) > 60 else ""
                    )

        return [
            {
                "session_id": r.session_id,
                "title": r.title or fallback_titles.get(r.session_id, "New chat"),
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": (
                    (r.last_message_at or r.updated_at).isoformat()
                    if (r.last_message_at or r.updated_at)
                    else None
                ),
                "message_count": r.message_count,
            }
            for r in rows
        ]
