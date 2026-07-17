from __future__ import annotations

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security import verify_token
from app.exceptions import AuthenticationError
from app.services.users import UserService


async def get_token_payload(
    authorization: str | None = Header(None, alias="Authorization"),
) -> dict:
    """Verify and return the JWT payload from the Authorization header."""
    if not authorization:
        raise AuthenticationError("Authorization header is missing")
    return verify_token(authorization)


async def get_current_user_id(
    payload: dict = Depends(get_token_payload),
    session: AsyncSession = Depends(get_db_session),
) -> str:
    """Resolve the JWT to an internal user UUID, creating the user if needed."""
    service = UserService(session)
    user = await service.get_or_create_user(payload)
    return str(user.id)


async def get_current_db_user(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session),
):
    """Return the local database user for the resolved user_id."""
    service = UserService(session)
    return await service.get_from_id(user_id)
