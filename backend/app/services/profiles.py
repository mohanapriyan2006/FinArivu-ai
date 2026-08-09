from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, NotFoundError
from app.models.profiles import Profile
from app.repositories.profiles import ProfileRepository
from app.schemas.profiles import ProfileCreate, ProfileUpdate
from app.services.base import BaseService


class ProfileService(BaseService[Profile]):
    """Service for user profile management."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ProfileRepository(session))
        self._repo: ProfileRepository

    async def get_by_user(self, user_id: uuid.UUID) -> Profile:
        """Return a profile for a user, creating a default one if missing."""
        profile = await self._repo.get_by_user_id(user_id)
        if profile is None:
            raise NotFoundError("Profile not found")
        return profile

    async def get_or_create_by_user(self, user_id: uuid.UUID, data: dict | None = None) -> Profile:
        """Return a profile for a user, creating a default one if missing."""
        profile = await self._repo.get_by_user_id(user_id)
        if profile:
            return profile
        create_data = data or {}
        create_data["user_id"] = user_id
        profile = Profile(**create_data)
        return await self._repo.create(profile)

    async def create(self, data: ProfileCreate) -> Profile:
        """Create a profile with duplicate check."""
        if await self._repo.get_by_user_id(data.user_id):
            raise ConflictError("Profile already exists for this user")
        profile = Profile(**data.model_dump(exclude_unset=True, by_alias=False))
        return await self._repo.create(profile)

    async def update_by_user(self, user_id: uuid.UUID, data: ProfileUpdate) -> Profile:
        """Update or create a profile for a user."""
        update_dict = data.model_dump(
            exclude_unset=True, exclude_none=True, by_alias=False
        )
        existing = await self._repo.get_by_user_id(user_id)
        if existing is None:
            return await self.get_or_create_by_user(user_id, update_dict)
        obj = await self._repo.update(existing.id, update_dict)
        if obj is None:
            raise NotFoundError("Profile not found")
        return obj

    async def update_avatar(self, user_id: uuid.UUID, file_path: str) -> Profile:
        """Update the avatar URL on a user's profile."""
        existing = await self._repo.get_by_user_id(user_id)
        if existing is None:
            profile = await self.get_or_create_by_user(user_id, {"avatar_url": file_path})
            return await self._repo.update(profile.id, {"avatar_url": file_path})
        return await self._repo.update(existing.id, {"avatar_url": file_path})
