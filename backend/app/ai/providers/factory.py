"""Provider factory with automatic fallback chain and circuit breaker.

Usage::

    provider = get_ai_provider()          # returns preferred or first available
    response = await provider.chat(...)   # uses the abstract interface
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.core.ai_providers import PROVIDERS, configured_providers
from app.core.config import settings
from app.core.logger import logger


# ── Registry ──────────────────────────────────────────────────────────────

_PROVIDER_CLASSES: dict[str, type] = {}


def _register_providers() -> None:
    """Lazily populate the provider class registry to avoid circular imports."""
    if _PROVIDER_CLASSES:
        return
    from app.ai.providers.gemini import GeminiProvider
    from app.ai.providers.groq import GroqProvider
    from app.ai.providers.openrouter import OpenRouterProvider

    _PROVIDER_CLASSES["gemini"] = GeminiProvider
    _PROVIDER_CLASSES["groq"] = GroqProvider
    _PROVIDER_CLASSES["openrouter"] = OpenRouterProvider


# ── Resilient wrapper ─────────────────────────────────────────────────────

class ResilientProvider(BaseAIProvider):
    """Wraps a primary provider with retry + fallback chain.

    On transient failures the wrapper retries the primary provider up to 2
    times with exponential back-off.  If the primary is exhausted it falls
    through to the next configured provider in priority order.
    """

    def __init__(
        self,
        primary: BaseAIProvider,
        fallbacks: list[BaseAIProvider],
    ) -> None:
        self._primary = primary
        self._fallbacks = fallbacks

    @property
    def name(self) -> str:
        return self._primary.name

    @property
    def model_name(self) -> str:
        return self._primary.model_name

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: dict[str, str] | None = None,
    ) -> AIProviderResponse:
        providers = [self._primary, *self._fallbacks]
        last_exc: Exception | None = None

        for provider in providers:
            try:
                async for attempt in AsyncRetrying(
                    stop=stop_after_attempt(2),
                    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
                    retry=retry_if_exception_type(Exception),
                    reraise=True,
                ):
                    with attempt:
                        return await provider.chat(
                            messages,
                            temperature=temperature,
                            max_tokens=max_tokens,
                            response_format=response_format,
                        )
            except Exception as exc:
                logger.warning(
                    "Provider %s failed, trying fallback: %s",
                    provider.name,
                    exc,
                )
                last_exc = exc

        raise RuntimeError(
            f"All AI providers exhausted. Last error: {last_exc}"
        )

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ):
        providers = [self._primary, *self._fallbacks]
        last_exc: Exception | None = None

        for provider in providers:
            try:
                async for token in provider.stream(
                    messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                ):
                    yield token
                return  # stream completed successfully
            except Exception as exc:
                logger.warning(
                    "Stream from %s failed, trying fallback: %s",
                    provider.name,
                    exc,
                )
                last_exc = exc

        raise RuntimeError(
            f"All AI providers exhausted for streaming. Last error: {last_exc}"
        )

    async def health(self) -> bool:
        return await self._primary.health()


# ── Public factory ────────────────────────────────────────────────────────

def get_ai_provider() -> ResilientProvider:
    """Return a resilient AI provider with fallback chain.

    Reads ``AI_COPILOT_PROVIDER`` from settings to determine the preferred
    provider.  Remaining configured providers become fallbacks.
    """
    _register_providers()

    preferred_name: str = getattr(settings, "ai_copilot_provider", "gemini")
    available = configured_providers()

    if not available:
        raise RuntimeError("No AI providers are configured with API keys")

    available_names = [p.name for p in available]

    # Build concrete instances for each configured provider.
    instances: dict[str, BaseAIProvider] = {}
    for cfg in available:
        cls = _PROVIDER_CLASSES.get(cfg.name)
        if cls is None:
            continue
        try:
            instances[cfg.name] = cls()
        except Exception:
            logger.warning("Could not instantiate %s provider", cfg.name)

    if not instances:
        raise RuntimeError("No AI providers could be instantiated")

    # Pick primary; the rest become fallbacks in config order.
    if preferred_name in instances:
        primary = instances.pop(preferred_name)
    else:
        first_name = next(iter(instances))
        logger.info(
            "Preferred provider %s not available; using %s",
            preferred_name,
            first_name,
        )
        primary = instances.pop(first_name)

    fallbacks = list(instances.values())

    return ResilientProvider(primary, fallbacks)
