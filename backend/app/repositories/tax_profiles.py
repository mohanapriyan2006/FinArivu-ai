from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tax_profiles import TaxProfile
from app.repositories.base import BaseRepository


class TaxProfileRepository(BaseRepository[TaxProfile]):
    """Repository for user tax profiles."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, TaxProfile)

    async def get_by_user_id(self, user_id: uuid.UUID) -> TaxProfile | None:
        """Return the tax profile for a user if it exists."""
        query = select(TaxProfile).where(
            TaxProfile.user_id == user_id,
            TaxProfile.deleted_at.is_(None),
        )
        return (await self._session.execute(query)).scalar_one_or_none()
