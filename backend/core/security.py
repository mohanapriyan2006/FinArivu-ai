"""Security utilities: CORS, rate limiting, input validation, secure headers, auth."""

import re
from datetime import datetime, timedelta, timezone
from typing import List

import jwt
from fastapi import Request
from passlib.context import CryptContext
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)


def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiration_hours)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT access token."""
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )


# Rate limiter instance
limiter = Limiter(key_func=get_remote_address)


def setup_cors(app) -> None:
    """Configure CORS middleware on the FastAPI app."""
    origins = settings.cors_origin_list + [
        "exp://",
        "http://localhost:19006",
        "http://localhost:19000",
        "http://localhost:8081",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )


def sanitize_input(value: str) -> str:
    """Sanitize user input to prevent XSS injection."""
    if not value:
        return value
    # Remove script tags and event handlers
    value = re.sub(r"<script.*?>.*?</script>", "", value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r"javascript:", "", value, flags=re.IGNORECASE)
    value = re.sub(r"on\w+\s*=", "", value, flags=re.IGNORECASE)
    return value.strip()


def validate_sql_safe(value: str) -> bool:
    """Check if a string contains potential SQL injection patterns."""
    if not value:
        return True
    dangerous = ["--", ";", "/*", "*/", "xp_", "sp_", "union", "drop", "delete"]
    lower_val = value.lower()
    return not any(d in lower_val for d in dangerous)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Skip CSP for docs/redoc so Swagger UI CDN resources load
        if not request.url.path.startswith(("/docs", "/redoc", "/openapi.json")):
            response.headers["Content-Security-Policy"] = "default-src 'self'"

        return response


def setup_security_middleware(app) -> None:
    """Apply all security middleware."""
    setup_cors(app)
    app.add_middleware(SecurityHeadersMiddleware)
    app.state.limiter = limiter
