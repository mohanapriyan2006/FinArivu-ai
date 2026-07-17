from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.models.liabilities import Liability
from app.repositories.liabilities import LiabilityRepository
from app.schemas.liabilities import LiabilityCreate, LiabilityUpdate
from app.services.base import BaseService


class LiabilityService(BaseService[Liability]):
    """Service for managing user liabilities."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(LiabilityRepository(session))
        self._repo: LiabilityRepository

    async def create_for_user(
        self,
        user_id: uuid.UUID,
        data: LiabilityCreate,
    ) -> Liability:
        """Create a liability for the authenticated user."""
        payload = data.model_dump(exclude_unset=True)
        payload["user_id"] = user_id
        liability = Liability(**payload)
        return await self._repo.create(liability)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        liability_type: str | None = None,
    ) -> list[Liability]:
        """List liabilities for a user."""
        return await self._repo.list_for_user(user_id, skip, limit, liability_type)

    async def update_for_user(
        self,
        user_id: uuid.UUID,
        liability_id: uuid.UUID,
        data: LiabilityUpdate,
    ) -> Liability:
        """Update a liability if owned by the user."""
        liability = await self._repo.get_by_id(liability_id)
        if liability is None or liability.user_id != user_id:
            raise NotFoundError("Liability not found")
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True)
        obj = await self._repo.update(liability_id, update_dict)
        if obj is None:
            raise NotFoundError("Liability not found")
        return obj

    async def delete_for_user(self, user_id: uuid.UUID, liability_id: uuid.UUID) -> None:
        """Soft-delete a liability if owned by the user."""
        liability = await self._repo.get_by_id(liability_id)
        if liability is None or liability.user_id != user_id:
            raise NotFoundError("Liability not found")
        await self._repo.delete(liability_id, soft=True)
