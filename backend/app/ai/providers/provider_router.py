from __future__ import annotations

from enum import Enum
from typing import Any

from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.ai.providers.factory import get_ai_provider
from app.core.config import settings
from app.core.logger import logger


class TaskType(Enum):
    FAST = "fast"
    REASONING = "reasoning"
    LONG_CONTEXT = "long_context"
    DEFAULT = "default"


class ProviderRouter:
    """Selects the best provider for a task and provides auto-fallback."""

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
        """Generate a response using the best provider for the task."""
        task = self._select_task_type(messages)

        provider = self._provider or get_ai_provider()
        preferred = self._preferred_provider(task)

        logger.info(
            "Provider router selected task=%s, preferred=%s",
            task.value,
            preferred,
        )

        # If preferred is different from the factory default, attempt once;
        # the ResilientProvider inside get_ai_provider already handles fallbacks.
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

    def _preferred_provider(self, task: TaskType) -> str:
        """Map task to provider name from config."""
        mapping: dict[TaskType, str] = {
            TaskType.FAST: getattr(settings, "ai_provider_fast", "groq"),
            TaskType.REASONING: getattr(settings, "ai_provider_reasoning", "gemini"),
            TaskType.LONG_CONTEXT: getattr(settings, "ai_provider_long_context", "openrouter"),
            TaskType.DEFAULT: getattr(settings, "ai_copilot_provider", "gemini"),
        }
        return mapping[task]
