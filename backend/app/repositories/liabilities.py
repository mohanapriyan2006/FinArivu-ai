from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.liabilities import Liability
from app.repositories.base import BaseRepository


class LiabilityRepository(BaseRepository[Liability]):
    """Repository for user liabilities."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Liability)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        liability_type: str | None = None,
    ) -> list[Liability]:
        """List liabilities for a user."""
        query = select(Liability).where(
            Liability.user_id == user_id,
            Liability.deleted_at.is_(None),
        )
        if liability_type:
            query = query.where(Liability.liability_type == liability_type)
        query = query.order_by(Liability.created_at.desc()).offset(skip).limit(limit)
        return list((await self._session.execute(query)).scalars().all())
