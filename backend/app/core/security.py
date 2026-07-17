from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
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


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def _create_token(
    subject: str,
    email: str,
    token_type: str,
    expires_delta: timedelta,
    extra: dict | None = None,
) -> str:
    """Create an HS256 JWT with the configured secret key."""
    if not settings.secret_key:
        raise AuthenticationError("JWT signing is not configured")

    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "email": email,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra:
        payload.update(extra)

    return jwt.encode(payload, settings.secret_key_str, algorithm="HS256")


def create_access_token(subject: str, email: str, extra: dict | None = None) -> str:
    """Create a short-lived access JWT."""
    delta = timedelta(minutes=settings.access_token_expire_minutes)
    return _create_token(subject, email, "access", delta, extra)


def create_refresh_token(subject: str, email: str, extra: dict | None = None) -> str:
    """Create a long-lived refresh JWT."""
    delta = timedelta(days=settings.refresh_token_expire_days)
    return _create_token(subject, email, "refresh", delta, extra)


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
