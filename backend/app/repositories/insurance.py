from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.insurance import Insurance
from app.repositories.base import BaseRepository


class InsuranceRepository(BaseRepository[Insurance]):
    """Repository for user insurance policies."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Insurance)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        insurance_type: str | None = None,
    ) -> list[Insurance]:
        """List insurance policies for a user."""
        query = select(Insurance).where(
            Insurance.user_id == user_id,
            Insurance.deleted_at.is_(None),
        )
        if insurance_type:
            query = query.where(Insurance.insurance_type == insurance_type)
        return list((await self._session.execute(query)).scalars().all())
