from __future__ import annotations

from enum import Enum
from typing import Any

from app.ai.providers.factory import get_ai_provider
from app.core.database import engine
from app.core.logger import logger


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    OFFLINE = "offline"


class HealthService:
    """Checks the health of AI providers and the database."""

    @staticmethod
    async def check_all() -> dict[str, Any]:
        """Return health status for each provider and the database."""
        provider_names = ["gemini", "groq", "openrouter"]
        providers: dict[str, Any] = {}

        for name in provider_names:
            # We reuse the factory's configured providers list for a quick check.
            try:
                provider = get_ai_provider()
                healthy = await provider.health()
                providers[name] = {
                    "status": HealthStatus.HEALTHY if healthy else HealthStatus.OFFLINE,
                    "latency_ms": 0,
                    "model": provider.model_name if healthy else None,
                }
            except Exception as exc:
                logger.warning("Health check for %s failed: %s", name, exc)
                providers[name] = {
                    "status": HealthStatus.OFFLINE,
                    "latency_ms": 0,
                    "model": None,
                }

        db_status = await HealthService._check_database()

        overall = HealthStatus.HEALTHY
        if any(p["status"] == HealthStatus.OFFLINE for p in providers.values()):
            overall = HealthStatus.DEGRADED
        if db_status != HealthStatus.HEALTHY:
            overall = HealthStatus.OFFLINE

        return {
            "overall": overall,
            "database": db_status,
            "providers": providers,
        }

    @staticmethod
    async def _check_database() -> HealthStatus:
        """Return the database health status."""
        try:
            from sqlalchemy import text
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            return HealthStatus.HEALTHY
        except Exception as exc:
            logger.warning("Database health check failed: %s", exc)
            return HealthStatus.OFFLINE
