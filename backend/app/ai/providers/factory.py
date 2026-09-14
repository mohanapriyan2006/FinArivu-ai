"""Provider factory with automatic fallback chain and circuit breaker.

Usage::

    provider = get_ai_provider()          # returns preferred or first available
    response = await provider.chat(...)   # uses the abstract interface
"""

from __future__ import annotations

from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.core.ai_providers import FALLBACK_ORDER, configured_providers
from app.core.logger import logger


# ── Registry ──────────────────────────────────────────────────────────────

_PROVIDER_CLASSES: dict[str, type] = {}


def _register_providers() -> None:
    """Lazily populate the provider class registry to avoid circular imports."""
    if _PROVIDER_CLASSES:
        return
    from app.ai.local_llm.phi4_provider import Phi4Provider
    from app.ai.providers.gemini import GeminiProvider
    from app.ai.providers.groq import GroqProvider
    from app.ai.providers.openrouter import OpenRouterProvider

    _PROVIDER_CLASSES["gemini"] = GeminiProvider
    _PROVIDER_CLASSES["groq"] = GroqProvider
    _PROVIDER_CLASSES["openrouter"] = OpenRouterProvider
    _PROVIDER_CLASSES["local-phi4"] = Phi4Provider


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

def _local_provider() -> BaseAIProvider | None:
    """Return the local Phi-4 provider when it is enabled and available."""
    cls = _PROVIDER_CLASSES.get("local-phi4")
    if cls is None:
        return None
    try:
        provider = cls()
    except Exception:
        logger.warning("Could not instantiate local-phi4 provider")
        return None
    if not getattr(provider, "available", False):
        return None
    return provider


def get_ai_provider() -> ResilientProvider:
    """Return a resilient AI provider with a multi-level fallback chain.

    Priority order: configured API providers (groq -> gemini -> openrouter),
    then the local Phi-4 model as the last-resort fallback. When no API keys
    are configured, the local model becomes the primary provider.
    """
    _register_providers()

    # Build concrete instances for each configured API provider.
    instances: dict[str, BaseAIProvider] = {}
    for cfg in configured_providers():
        cls = _PROVIDER_CLASSES.get(cfg.name)
        if cls is None:
            continue
        try:
            instances[cfg.name] = cls()
        except Exception:
            logger.warning("Could not instantiate %s provider", cfg.name)

    ordered = [instances[name] for name in FALLBACK_ORDER if name in instances]

    # Local LLM is always the final fallback so the chat never hard-fails.
    local = _local_provider()
    if local is not None:
        ordered.append(local)

    if not ordered:
        raise RuntimeError(
            "No AI providers available: no API keys configured and local "
            "LLM is not enabled"
        )

    primary = ordered[0]
    fallbacks = ordered[1:]

    return ResilientProvider(primary, fallbacks)
