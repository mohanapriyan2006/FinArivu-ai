"""Custom JWT authentication middleware."""

import uuid

import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.logging import logger
from core.security import decode_access_token
from utils.exceptions import AuthenticationError

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency to extract and verify the current user from a custom JWT.

    Returns:
        Dict with user_id (UUID) and email.
    """
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        raise AuthenticationError("Token has expired") from None
    except jwt.InvalidTokenError as exc:
        logger.warning(f"Invalid JWT token: {exc}")
        raise AuthenticationError("Invalid authentication token") from None
    except Exception as exc:
        logger.error(f"JWT verification error: {exc}")
        raise AuthenticationError("Authentication verification failed") from None

    user_id = payload.get("sub")
    email = payload.get("email", "")

    if not user_id:
        raise AuthenticationError("Invalid token: missing user identifier")

    logger.info("User authenticated", extra={"user_id": user_id})

    return {
        "user_id": uuid.UUID(user_id),
        "email": email,
    }
