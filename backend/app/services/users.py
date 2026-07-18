from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.models.users import User
from app.repositories.users import UserRepository
from app.schemas.users import UserCreate, UserUpdate
from app.services.base import BaseService


class UserService(BaseService[User]):
    """Service for user registration and management."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(UserRepository(session))
        self._repo: UserRepository

    async def get_or_create_user(self, payload: dict) -> User:
        """Sync a JWT payload to a local user."""
        external_id = payload.get("sub")
        email = payload.get("email") or payload.get("email_address")
        if not external_id or not email:
            raise AuthenticationError("Invalid token: missing subject or email")

        email = email.lower().strip()
        existing = await self._repo.get_by_external_id(external_id)
        if existing:
            existing.last_login_at = datetime.now(timezone.utc)
            await self._repo._session.flush()
            return existing

        if await self._repo.get_by_email(email):
            raise ConflictError("Email already registered with another account")

        user = User(
            external_id=external_id,
            email=email,
            role="USER",
            email_verified=payload.get("email_verified", False),
            last_login_at=datetime.now(timezone.utc),
        )
        return await self._repo.create(user)

    async def create(self, data: UserCreate) -> User:
        """Create a user with duplicate checks."""
        if await self._repo.get_by_email(str(data.email)):
            raise ConflictError("Email already registered")
        if await self._repo.get_by_external_id(data.external_id):
            raise ConflictError("External ID already registered")

        user = User(**data.model_dump(exclude_unset=True, by_alias=False))
        return await self._repo.create(user)

    async def update(self, id: uuid.UUID, data: UserUpdate) -> User:
        """Update an existing user."""
        update_dict = data.model_dump(exclude_unset=True, exclude_none=True, by_alias=False)
        if "email" in update_dict:
            update_dict["email"] = update_dict["email"].lower().strip()
        obj = await self._repo.update(id, update_dict)
        if obj is None:
            raise NotFoundError("User not found")
        return obj

    async def get_from_id(self, id: str | uuid.UUID) -> User:
        """Fetch a user by a string or UUID identifier."""
        if isinstance(id, str):
            id = uuid.UUID(id)
        return await self.get(id)
