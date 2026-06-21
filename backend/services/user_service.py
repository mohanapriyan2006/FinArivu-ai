"""User service layer."""

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from models.user import User
from models.profile import Profile
from repositories.user_repository import user_repository
from repositories.profile_repository import profile_repository
from schemas.user import UserCreate
from utils.exceptions import DatabaseError


class UserService:
    """Service for user operations."""

    async def sync_user(
        self,
        session: AsyncSession,
        clerk_id: str,
        email: str,
    ) -> User:
        """Sync a Clerk user into the database.

        Creates the user and an empty profile if they don't exist.
        """
        try:
            user = await user_repository.get_by_clerk_id(session, clerk_id)

            if user is None:
                logger.info("Creating new user", extra={"clerk_id": clerk_id})
                user = await user_repository.create(
                    session,
                    {"clerk_id": clerk_id, "email": email},
                )
                # Create empty profile
                await profile_repository.create(
                    session,
                    {"user_id": user.id},
                )
                await session.commit()
            else:
                logger.info("User already exists", extra={"clerk_id": clerk_id})

            return user
        except Exception as exc:
            logger.error("Failed to sync user", extra={"clerk_id": clerk_id})
            raise DatabaseError("Failed to sync user") from exc


user_service = UserService()
