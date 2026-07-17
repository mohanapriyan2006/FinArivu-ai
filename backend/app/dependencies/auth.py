from __future__ import annotations

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security import verify_clerk_token
from app.exceptions import AuthenticationError


async def get_token_payload(
    authorization: str | None = Header(None, alias="Authorization"),
) -> dict:
    """Verify and return the JWT payload from the Authorization header."""
    if not authorization:
        raise AuthenticationError("Authorization header is missing")
    return verify_clerk_token(authorization)


async def get_current_user_id(
    payload: dict = Depends(get_token_payload),
) -> str:
    """Extract the user identifier (subject) from a verified JWT."""
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token: missing subject claim")
    return user_id


async def get_current_db_user(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session),
):
    """Placeholder: resolve the Clerk user to a local database user.

    This function will be implemented in the users module (Phase 2).
    """
    raise NotImplementedError("get_current_db_user is implemented in Phase 2")
