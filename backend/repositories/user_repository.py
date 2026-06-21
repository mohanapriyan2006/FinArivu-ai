"""User repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for user operations."""

    def __init__(self) -> None:
        super().__init__(User)

    async def get_by_clerk_id(
        self,
        session: AsyncSession,
        clerk_id: str,
    ) -> User | None:
        """Get user by Clerk ID."""
        result = await session.execute(
            select(User).where(User.clerk_id == clerk_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(
        self,
        session: AsyncSession,
        email: str,
    ) -> User | None:
        """Get user by email."""
        result = await session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()


user_repository = UserRepository()
