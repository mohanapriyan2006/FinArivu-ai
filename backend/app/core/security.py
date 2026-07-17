from __future__ import annotations

import jwt

from app.core.config import settings
from app.core.logger import logger
from app.exceptions import AuthenticationError


def _strip_bearer(token: str) -> str:
    """Remove the 'Bearer ' prefix from an Authorization header value."""
    parts = token.split(maxsplit=1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return token


def verify_token(token: str) -> dict:
    """Verify an HS256 JWT signed with the application secret key."""
    token = _strip_bearer(token)

    if not settings.secret_key:
        raise AuthenticationError("JWT verification is not configured")

    try:
        return jwt.decode(token, settings.secret_key_str, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationError("Token has expired") from exc
    except jwt.InvalidTokenError as exc:
        logger.warning("Invalid token", extra={"error": str(exc)})
        raise AuthenticationError("Invalid token") from exc
