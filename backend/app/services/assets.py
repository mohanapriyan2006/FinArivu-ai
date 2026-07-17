from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.models.assets import Asset
from app.repositories.assets import AssetRepository
from app.schemas.assets import AssetCreate, AssetUpdate
from app.services.base import BaseService


class AssetService(BaseService[Asset]):
    """Service for managing user assets."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(AssetRepository(session))
        self._repo: AssetRepository

    async def create_for_user(
        self,
        user_id: uuid.UUID,
        data: AssetCreate,
    ) -> Asset:
        """Create an asset for the authenticated user."""
        payload = data.model_dump(exclude_unset=True)
        payload["user_id"] = user_id
        asset = Asset(**payload)
        return await self._repo.create(asset)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        asset_type: str | None = None,
    ) -> list[Asset]:
        """List assets for a user."""
        return await self._repo.list_for_user(user_id, skip, limit, asset_type)

    async def update_for_user(
        self,
        user_id: uuid.UUID,
        asset_id: uuid.UUID,
        data: AssetUpdate,
    ) -> Asset:
        """Update an asset if owned by the user."""
        asset = await self._repo.get_by_id(asset_id)
        if asset is None or asset.user_id != user_id:
            raise NotFoundError("Asset not found")
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        obj = await self._repo.update(asset_id, update_dict)
        if obj is None:
            raise NotFoundError("Asset not found")
        return obj

    async def delete_for_user(self, user_id: uuid.UUID, asset_id: uuid.UUID) -> None:
        """Soft-delete an asset if owned by the user."""
        asset = await self._repo.get_by_id(asset_id)
        if asset is None or asset.user_id != user_id:
            raise NotFoundError("Asset not found")
        await self._repo.delete(asset_id, soft=True)
