from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine
from app.core.logger import logger
from app.core.migrations import apply_migrations
from app.exceptions.handlers import add_exception_handlers
from app.middleware.audit import AuditMiddleware
from app.middleware.rate_limit import setup_rate_limiting
from app.middleware.security import SecurityHeadersMiddleware, setup_cors
from app.utils.response import success_response


@asynccontextmanager
async def lifespan(app: FastAPI) -> None:
    """Manage application startup and shutdown lifecycle."""
    logger.info(
        "Starting FinArivu API",
        extra={"environment": settings.environment},
    )
    await apply_migrations(engine)
    yield
    await engine.dispose()
    logger.info("FinArivu API shutdown")


def create_application() -> FastAPI:
    """Application factory for the FinArivu API."""
    app = FastAPI(
        title="FinArivu AI API",
        description="AI Personal CFO for Indian Salaried Professionals",
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # Middleware stack (order matters: CORS innermost, audit outermost)
    setup_cors(app)
    setup_rate_limiting(app)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AuditMiddleware)

    # Routes
    app.include_router(api_router, prefix="/api")

    # Static files
    os.makedirs("static", exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")

    @app.get("/health", tags=["Health"], summary="Root health check")
    async def root_health() -> dict:
        """Root health endpoint for load balancers."""
        return success_response(
            data={"status": "ok"},
            message="Service is healthy",
        )

    # Global exception handlers
    add_exception_handlers(app)

    return app


app = create_application()
