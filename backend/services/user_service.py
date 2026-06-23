"""User service layer."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from core.security import hash_password, verify_password, create_access_token
from models.user import User
from models.profile import Profile
from repositories.user_repository import user_repository
from repositories.profile_repository import profile_repository
from schemas.user import UserCreate
from utils.exceptions import AuthenticationError, DatabaseError, ValidationError


class UserService:
    """Service for user operations."""

    async def sync_user(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        email: str,
    ) -> User:
        """Get or create a user by ID.

        Creates the user and an empty profile if they don't exist.
        """
        try:
            user = await user_repository.get_by_id(session, user_id)

            if user is None:
                logger.info("Creating new user", extra={"user_id": str(user_id)})
                user = await user_repository.create(
                    session,
                    {
                        "id": user_id,
                        "email": email,
                        "password_hash": "",
                    },
                )
                # Create empty profile
                await profile_repository.create(
                    session,
                    {"user_id": user.id},
                )
                await session.commit()
            else:
                logger.info("User exists", extra={"user_id": str(user_id)})

            return user
        except Exception as exc:
            logger.error("Failed to sync user", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to sync user") from exc

    async def register(
        self,
        session: AsyncSession,
        email: str,
        password: str,
    ) -> User:
        """Register a new user."""
        try:
            existing = await user_repository.get_by_email(session, email)
            if existing:
                raise ValidationError("Email already registered")

            if len(password.encode("utf-8")) > 72:
                raise ValidationError("Password must be 72 bytes or less")

            user = await user_repository.create(
                session,
                {
                    "email": email,
                    "password_hash": hash_password(password),
                },
            )
            # Create empty profile
            await profile_repository.create(
                session,
                {"user_id": user.id},
            )
            await session.commit()
            logger.info("User registered", extra={"email": email})
            return user
        except ValidationError:
            raise
        except Exception as exc:
            logger.error("Failed to register user", extra={"email": email, "error": str(exc)})
            raise DatabaseError(f"Failed to register user: {exc}") from exc

    async def authenticate(
        self,
        session: AsyncSession,
        email: str,
        password: str,
    ) -> str:
        """Authenticate a user and return a JWT token."""
        try:
            user = await user_repository.get_by_email(session, email)
            if not user:
                raise AuthenticationError("Invalid email or password")

            if not verify_password(password, user.password_hash):
                raise AuthenticationError("Invalid email or password")

            token = create_access_token(str(user.id), user.email)
            logger.info("User authenticated", extra={"email": email})
            return token
        except AuthenticationError:
            raise
        except Exception as exc:
            logger.error("Authentication failed", extra={"email": email, "error": str(exc)})
            raise DatabaseError("Authentication failed") from exc


user_service = UserService()
