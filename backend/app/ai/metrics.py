from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from app.core.logger import logger


@dataclass
class ProviderMetrics:
    """In-memory running totals for a single AI provider."""

    requests: int = 0
    errors: int = 0
    total_tokens_input: int = 0
    total_tokens_output: int = 0
    total_latency_ms: float = 0.0
    last_used: float | None = None


class AIMetricsCollector:
    """Collect lightweight provider metrics without external services."""

    def __init__(self) -> None:
        self._metrics: dict[str, ProviderMetrics] = defaultdict(ProviderMetrics)
        self._start = time.monotonic()

    def record(
        self,
        provider: str,
        *,
        latency_ms: float = 0.0,
        tokens_input: int = 0,
        tokens_output: int = 0,
        error: bool = False,
    ) -> None:
        """Record a single provider call."""
        metric = self._metrics[provider]
        metric.requests += 1
        metric.last_used = time.monotonic()
        if error:
            metric.errors += 1
        metric.total_latency_ms += latency_ms
        metric.total_tokens_input += tokens_input
        metric.total_tokens_output += tokens_output
        logger.debug(
            "AI metric recorded: provider=%s latency_ms=%.2f tokens=%d/%d error=%s",
            provider,
            latency_ms,
            tokens_input,
            tokens_output,
            error,
        )

    def record_error(self, provider: str) -> None:
        """Convenience helper for failed provider calls."""
        self.record(provider, error=True)

    def summary(self) -> dict[str, Any]:
        """Return current metrics snapshot for the /metrics endpoint."""
        return {
            "providers": {
                name: {
                    "requests": metric.requests,
                    "errors": metric.errors,
                    "avg_latency_ms": round(metric.total_latency_ms / metric.requests, 2)
                    if metric.requests
                    else 0.0,
                    "total_tokens_input": metric.total_tokens_input,
                    "total_tokens_output": metric.total_tokens_output,
                    "last_used_seconds_ago": round(time.monotonic() - metric.last_used, 2)
                    if metric.last_used
                    else None,
                }
                for name, metric in self._metrics.items()
            },
            "uptime_seconds": round(time.monotonic() - self._start, 2),
        }


# Global singleton. Safe for single-process FastAPI; replace later if needed.
ai_metrics: AIMetricsCollector = AIMetricsCollector()
