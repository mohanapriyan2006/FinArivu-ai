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
    default_model="llama-3.1-8b-instant",
    api_key_attr="groq_api_key",
)

GEMINI = ProviderConfig(
    name="gemini",
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    default_model="gemini-3.5-flash",
    api_key_attr="gemini_api_key",
)

OPENROUTER = ProviderConfig(
    name="openrouter",
    base_url="https://openrouter.ai/api/v1",
    default_model="meta-llama/llama-3.1-8b-instant",
    api_key_attr="openrouter_api_key",
)

# Priority order for the fallback chain.
PROVIDERS: dict[str, ProviderConfig] = {
    "groq": GROQ,
    "gemini": GEMINI,
    "openrouter": OPENROUTER,
}

FALLBACK_ORDER: tuple[str, ...] = ("groq", "gemini", "openrouter")


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
                timeout=30.0,
            )
            return client, provider
        except Exception:
            logger.exception("Failed to initialize %s client", provider.name)

    return None


def get_all_chat_clients() -> list[tuple[Any, ProviderConfig]]:
    """Return OpenAI-compatible async clients for every configured provider."""
    import openai

    clients: list[tuple[Any, ProviderConfig]] = []
    for provider in configured_providers():
        try:
            client = openai.AsyncOpenAI(
                api_key=provider.api_key,
                base_url=provider.base_url,
                timeout=30.0,
            )
            clients.append((client, provider))
        except Exception:
            logger.exception("Failed to initialize %s client", provider.name)
    return clients
