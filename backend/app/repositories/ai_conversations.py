from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_conversations import AIConversation
from app.repositories.base import BaseRepository


class AIConversationRepository(BaseRepository[AIConversation]):
    """Repository for AI conversation messages."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AIConversation)

    async def get_recent_history(
        self,
        user_id: uuid.UUID,
        session_id: str,
        limit: int = 10,
    ) -> list[AIConversation]:
        """Return recent conversation messages for a session."""
        query = (
            select(AIConversation)
            .where(
                AIConversation.user_id == user_id,
                AIConversation.session_id == session_id,
            )
            .order_by(AIConversation.created_at.desc())
            .limit(limit)
        )
        return list(reversed((await self._session.execute(query)).scalars().all()))
