from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assets import Asset
from app.repositories.base import BaseRepository


class AssetRepository(BaseRepository[Asset]):
    """Repository for user assets."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Asset)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        asset_type: str | None = None,
    ) -> list[Asset]:
        """List assets for a user."""
        query = select(Asset).where(
            Asset.user_id == user_id,
            Asset.deleted_at.is_(None),
        )
        if asset_type:
            query = query.where(Asset.asset_type == asset_type)
        query = query.order_by(Asset.created_at.desc()).offset(skip).limit(limit)
        return list((await self._session.execute(query)).scalars().all())

    async def list_emergency_assets(self, user_id: uuid.UUID) -> list[Asset]:
        """Return assets marked as emergency funds."""
        query = select(Asset).where(
            Asset.user_id == user_id,
            Asset.is_emergency_fund.is_(True),
            Asset.deleted_at.is_(None),
        )
        return list((await self._session.execute(query)).scalars().all())
