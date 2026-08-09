"""Service for saved copilot chat sessions."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.memory.conversation_memory import ConversationMemory
from app.exceptions import NotFoundError
from app.models.ai_chat_sessions import AIChatSession
from app.repositories.ai_chat_sessions import AIChatSessionRepository


class AIChatSessionService:
    """Public service for listing, renaming, deleting and touching sessions."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AIChatSessionRepository(session)

    async def get_sessions(
        self,
        user_id: uuid.UUID,
        *,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Return active sessions with message counts and last activity."""
        memory = ConversationMemory(self._session)
        return await memory.get_sessions(user_id, limit=limit)

    async def rename_session(
        self,
        user_id: uuid.UUID,
        session_id: str,
        title: str,
    ) -> None:
        """Rename a session."""
        updated = await self._repo.update_title(user_id, session_id, title)
        if updated is None:
            raise NotFoundError("Chat session not found")

    async def delete_session(
        self,
        user_id: uuid.UUID,
        session_id: str,
    ) -> None:
        """Soft-delete a session."""
        if not await self._repo.soft_delete_by_session(user_id, session_id):
            raise NotFoundError("Chat session not found")

    async def touch_session(
        self,
        user_id: uuid.UUID,
        session_id: str,
        title: str | None = None,
    ) -> AIChatSession:
        """Ensure a session row exists and update its activity timestamp."""
        return await self._repo.get_or_create_for_session(
            user_id, session_id, title
        )
