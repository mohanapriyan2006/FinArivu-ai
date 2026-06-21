"""Clerk JWT authentication middleware."""

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.config import settings
from core.logging import logger
from utils.exceptions import AuthenticationError

security = HTTPBearer()


def get_clerk_public_key() -> str:
    """Return the Clerk JWT public key."""
    return settings.clerk_jwt_public_key


def verify_clerk_token(token: str) -> dict:
    """Verify a Clerk JWT token.

    Args:
        token: The JWT bearer token from the Authorization header.

    Returns:
        Decoded token payload containing sub (clerk_id), email, etc.

    Raises:
        AuthenticationError: If the token is invalid or expired.
    """
    try:
        public_key = get_clerk_public_key()
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer or None,
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Clerk token expired")
        raise AuthenticationError("Token has expired") from None
    except jwt.InvalidTokenError as exc:
        logger.warning(f"Invalid Clerk token: {exc}")
        raise AuthenticationError("Invalid authentication token") from None
    except Exception as exc:
        logger.error(f"Clerk token verification error: {exc}")
        raise AuthenticationError("Authentication verification failed") from None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency to extract and verify the current Clerk user.

    Returns:
        Dict with clerk_id and email.
    """
    token = credentials.credentials
    payload = verify_clerk_token(token)

    clerk_id = payload.get("sub")
    email = payload.get("email", "")

    if not clerk_id:
        raise AuthenticationError("Invalid token: missing user identifier")

    logger.info("User authenticated", extra={"clerk_id": clerk_id})

    return {
        "clerk_id": clerk_id,
        "email": email,
    }
