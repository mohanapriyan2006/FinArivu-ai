"""Repository for saved copilot chat sessions."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_chat_sessions import AIChatSession
from app.repositories.base import BaseRepository


class AIChatSessionRepository(BaseRepository[AIChatSession]):
    """Repository for AIChatSession CRUD and session-level helpers."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AIChatSession)

    async def get_by_session_id(
        self,
        user_id: uuid.UUID,
        session_id: str,
    ) -> AIChatSession | None:
        """Fetch a single active session by user and session id."""
        query = (
            select(AIChatSession)
            .where(
                AIChatSession.user_id == user_id,
                AIChatSession.session_id == session_id,
                AIChatSession.is_deleted.is_(False),
            )
        )
        return (await self._session.execute(query)).scalar_one_or_none()

    async def list_active_for_user(
        self,
        user_id: uuid.UUID,
        limit: int = 50,
    ) -> list[AIChatSession]:
        """Return active sessions for the user ordered by updated_at desc."""
        query = (
            select(AIChatSession)
            .where(
                AIChatSession.user_id == user_id,
                AIChatSession.is_deleted.is_(False),
            )
            .order_by(AIChatSession.updated_at.desc())
            .limit(limit)
        )
        return list((await self._session.execute(query)).scalars().all())

    async def soft_delete_by_session(
        self,
        user_id: uuid.UUID,
        session_id: str,
    ) -> bool:
        """Soft-delete a session identified by session_id."""
        obj = await self.get_by_session_id(user_id, session_id)
        if obj is None:
            return False
        obj.soft_delete()
        await self._session.flush()
        return True

    async def update_title(
        self,
        user_id: uuid.UUID,
        session_id: str,
        title: str,
    ) -> AIChatSession | None:
        """Update the title of a session and return the updated row."""
        stmt = (
            update(AIChatSession)
            .where(
                AIChatSession.user_id == user_id,
                AIChatSession.session_id == session_id,
                AIChatSession.is_deleted.is_(False),
            )
            .values(
                title=title,
                updated_at=datetime.now(timezone.utc),
            )
            .returning(AIChatSession)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.scalar_one_or_none()

    async def get_or_create_for_session(
        self,
        user_id: uuid.UUID,
        session_id: str,
        title: str | None = None,
    ) -> AIChatSession:
        """Ensure a session row exists, optionally seeding the title.

        If the row already exists the ``updated_at`` timestamp is refreshed.
        The title is only set when the existing title is ``None`` and a new
        title is provided.
        """
        existing = await self.get_by_session_id(user_id, session_id)
        now = datetime.now(timezone.utc)
        if existing is not None:
            existing.updated_at = now
            if title is not None and existing.title is None:
                existing.title = title[:255]
            await self._session.flush()
            await self._session.refresh(existing)
            return existing

        new_session = AIChatSession(
            user_id=user_id,
            session_id=session_id,
            title=title[:255] if title is not None else None,
            updated_at=now,
        )
        await self.create(new_session)
        return new_session
