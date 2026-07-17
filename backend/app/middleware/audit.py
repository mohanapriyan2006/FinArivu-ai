from __future__ import annotations

import time
from uuid import UUID

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import logger


class AuditMiddleware(BaseHTTPMiddleware):
    """Log request metadata without sensitive financial details."""

    EXCLUDED_PATHS: set[str] = {
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
        "/api/v1/health",
    }

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        path = request.url.path
        if path in self.EXCLUDED_PATHS:
            return response

        user_id = getattr(request.state, "user_id", None)
        if isinstance(user_id, UUID):
            user_id = str(user_id)

        logger.info(
            "Request processed",
            extra={
                "method": request.method,
                "path": path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "user_id": user_id,
                "client_ip": request.client.host if request.client else None,
            },
        )

        return response
