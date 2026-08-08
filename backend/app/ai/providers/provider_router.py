from __future__ import annotations

from enum import Enum
from typing import Any

from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.ai.providers.factory import get_ai_provider
from app.core.logger import logger


class TaskType(Enum):
    FAST = "fast"
    REASONING = "reasoning"
    LONG_CONTEXT = "long_context"
    DEFAULT = "default"


class ProviderRouter:
    """Routes chat/stream calls through the resilient provider fallback chain."""

    def __init__(self, provider: BaseAIProvider | None = None) -> None:
        self._provider = provider

    def _select_task_type(self, messages: list[dict[str, str]]) -> TaskType:
        """Heuristic task classification for provider selection."""
        prompt = " ".join(m.get("content", "") for m in messages)
        prompt_len = len(prompt)

        if prompt_len > 3000:
            return TaskType.LONG_CONTEXT

        reasoning_keywords = ["explain", "compare", "analyse", "reason", "why", "how"]
        if any(kw in prompt.lower() for kw in reasoning_keywords):
            return TaskType.REASONING

        fast_keywords = ["hi", "hello", "budget", "spend", "quick"]
        if any(kw in prompt.lower() for kw in fast_keywords):
            return TaskType.FAST

        return TaskType.DEFAULT

    async def generate(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: dict[str, str] | None = None,
    ) -> AIProviderResponse:
        """Generate a response using the resilient provider fallback chain."""
        provider = self._provider or get_ai_provider()

        logger.info(
            "Provider router using primary=%s fallback_count=%s",
            provider.name,
            len(provider._fallbacks),
        )

        # ResilientProvider already handles retries and fallbacks.
        return await provider.generate(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
        )

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ):
        """Stream tokens from the selected provider."""
        provider = self._provider or get_ai_provider()
        async for token in provider.stream(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            yield token

    async def health(self) -> bool:
        provider = self._provider or get_ai_provider()
        return await provider.health()

