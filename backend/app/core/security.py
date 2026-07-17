from __future__ import annotations

import jwt
from jwt import PyJWKClient

from app.core.config import settings
from app.core.logger import logger
from app.exceptions import AuthenticationError


def _strip_bearer(token: str) -> str:
    """Remove the 'Bearer ' prefix from an Authorization header value."""
    parts = token.split(maxsplit=1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return token


def verify_clerk_token(token: str) -> dict:
    """Verify a Clerk-issued JWT and return its payload."""
    token = _strip_bearer(token)

    if settings.clerk_jwks_url:
        try:
            jwks_client = PyJWKClient(settings.clerk_jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=settings.clerk_audience,
                issuer=settings.clerk_issuer,
            )
        except jwt.ExpiredSignatureError as exc:
            raise AuthenticationError("Token has expired") from exc
        except jwt.InvalidTokenError as exc:
            logger.warning("Invalid Clerk token", extra={"error": str(exc)})
            raise AuthenticationError("Invalid token") from exc

    # Development-only fallback when no Clerk JWKS is configured.
    if settings.is_development and settings.secret_key:
        try:
            return jwt.decode(token, settings.secret_key_str, algorithms=["HS256"])
        except jwt.InvalidTokenError as exc:
            raise AuthenticationError("Invalid development token") from exc

    raise AuthenticationError("JWT verification is not configured")
