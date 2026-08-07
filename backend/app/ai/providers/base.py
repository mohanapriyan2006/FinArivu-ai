"""Abstract base class for all AI providers.

Every provider (Gemini, Groq, OpenRouter, future Phi-4) implements this
interface so the orchestrator is completely decoupled from the underlying
LLM transport.
"""

from __future__ import annotations

import abc
import time
from dataclasses import dataclass, field
from typing import Any, AsyncIterator


@dataclass(frozen=True)
class AIProviderResponse:
    """Standardised response from any AI provider."""

    content: str
    provider_name: str
    model: str
    tokens_input: int = 0
    tokens_output: int = 0
    latency_ms: int = 0
    raw: dict[str, Any] = field(default_factory=dict)


class BaseAIProvider(abc.ABC):
    """Abstract AI provider interface.

    All concrete providers must implement ``chat``, ``stream``, and ``health``.
    The orchestrator never calls vendor-specific APIs directly.
    """

    @property
    @abc.abstractmethod
    def name(self) -> str:
        """Human-readable provider name (e.g. ``'gemini'``)."""

    @property
    @abc.abstractmethod
    def model_name(self) -> str:
        """Model identifier currently configured for this provider."""

    @abc.abstractmethod
    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: dict[str, str] | None = None,
    ) -> AIProviderResponse:
        """Send a chat completion request and return the full response."""

    @abc.abstractmethod
    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Yield content tokens as they arrive from the provider."""

    @abc.abstractmethod
    async def health(self) -> bool:
        """Return ``True`` if the provider is reachable and operational."""

    @property
    def supports_streaming(self) -> bool:
        """Return ``True`` if the provider supports SSE streaming."""
        return True

    @property
    def supports_json(self) -> bool:
        """Return ``True`` if the provider supports structured JSON output."""
        return True

    async def generate(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: dict[str, str] | None = None,
    ) -> AIProviderResponse:
        """Alias for ``chat`` — unified generate interface."""
        return await self.chat(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
        )

    @staticmethod
    def _elapsed_ms(start: float) -> int:
        """Compute elapsed milliseconds from a ``time.perf_counter`` start."""
        return int((time.perf_counter() - start) * 1000)
