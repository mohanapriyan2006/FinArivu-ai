from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.core.config import settings
from app.core.logger import logger


@dataclass(frozen=True)
class ProviderConfig:
    """Configuration for an OpenAI-compatible chat provider."""

    name: str
    base_url: str
    default_model: str
    api_key_attr: str

    @property
    def api_key(self) -> str | None:
        """Return the configured API key, or None if not set."""
        key = getattr(settings, self.api_key_attr, None)
        if key is None:
            return None
        return key.get_secret_value()

    @property
    def model(self) -> str:
        """Return the model to use for this provider."""
        return self.default_model


GROQ = ProviderConfig(
    name="groq",
    base_url="https://api.groq.com/openai/v1",
    default_model="llama-3.1-70b-versatile",
    api_key_attr="groq_api_key",
)

GEMINI = ProviderConfig(
    name="gemini",
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    default_model="gemini-1.5-flash",
    api_key_attr="gemini_api_key",
)

OPENROUTER = ProviderConfig(
    name="openrouter",
    base_url="https://openrouter.ai/api/v1",
    default_model="openai/gpt-4o-mini",
    api_key_attr="openrouter_api_key",
)

OPENAI = ProviderConfig(
    name="openai",
    base_url="https://api.openai.com/v1",
    default_model=settings.openai_model,
    api_key_attr="openai_api_key",
)

# Priority order for the fallback chain.
PROVIDERS: dict[str, ProviderConfig] = {
    "openai": OPENAI,
    "groq": GROQ,
    "gemini": GEMINI,
    "openrouter": OPENROUTER,
}

FALLBACK_ORDER: tuple[str, ...] = ("openai", "groq", "gemini", "openrouter")


def configured_providers() -> list[ProviderConfig]:
    """Return providers that have an API key set, in fallback priority order."""
    return [PROVIDERS[name] for name in FALLBACK_ORDER if PROVIDERS[name].api_key]


def get_chat_client() -> tuple[Any, ProviderConfig] | None:
    """Return the first available OpenAI-compatible async client and its config."""
    import openai

    for provider in configured_providers():
        try:
            client = openai.AsyncOpenAI(
                api_key=provider.api_key,
                base_url=provider.base_url,
            )
            return client, provider
        except Exception:
            logger.exception("Failed to initialize %s client", provider.name)

    return None
