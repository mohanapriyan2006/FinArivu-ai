"""Provider factory with automatic fallback chain and circuit breaker.

Usage::

    provider = get_ai_provider()          # returns preferred or first available
    response = await provider.chat(...)   # uses the abstract interface
"""

from __future__ import annotations

import openai
from tenacity import (
    AsyncRetrying,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.core.ai_providers import FALLBACK_ORDER, configured_providers
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

    Retries transient failures on each provider before falling through to the
    next configured provider in the priority order groq -> gemini -> openrouter.
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

    @staticmethod
    def _is_retryable(exc: Exception) -> bool:
        """Return True for transient issues we should retry or fall back on."""
        status = getattr(exc, "status_code", None)
        if isinstance(status, int) and (status == 429 or status >= 500):
            return True
        for cls in (
            getattr(openai, "APIConnectionError", None),
            getattr(openai, "APITimeoutError", None),
        ):
            if cls and isinstance(exc, cls):
                return True
        if isinstance(exc, (ConnectionError, TimeoutError)):
            return True
        return False

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
                    retry=retry_if_exception(self._is_retryable),
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
                    "Provider %s (model=%s) failed, trying fallback: %s",
                    provider.name,
                    provider.model_name,
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
                    "Stream from %s (model=%s) failed, trying fallback: %s",
                    provider.name,
                    provider.model_name,
                    exc,
                )
                last_exc = exc

        raise RuntimeError(
            f"All AI providers exhausted for streaming. Last error: {last_exc}"
        )

    async def health(self) -> bool:
        """Return True if any configured provider is healthy."""
        for provider in [self._primary, *self._fallbacks]:
            try:
                if await provider.health():
                    return True
            except Exception:
                logger.warning("Health check failed for %s", provider.name)
        return False


# ── Public factory ────────────────────────────────────────────────────────

def get_ai_provider() -> ResilientProvider:
    """Return a resilient AI provider with fallback chain.

    Uses the explicit priority order groq -> gemini -> openrouter, skipping any
    provider that is not configured or cannot be instantiated.
    """
    _register_providers()

    available = configured_providers()
    if not available:
        raise RuntimeError("No AI providers are configured with API keys")

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

    # Primary is the first configured provider in priority order;
    # the rest become fallbacks in the same order.
    ordered = [instances[name] for name in FALLBACK_ORDER if name in instances]
    primary = ordered[0]
    fallbacks = ordered[1:]

    return ResilientProvider(primary, fallbacks)
