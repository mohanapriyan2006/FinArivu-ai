"""Tests for ResilientProvider retry and fallback behaviour."""
from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import pytest

from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.ai.providers.factory import ResilientProvider


class _FakeProvider(BaseAIProvider):
    def __init__(self, name: str, response: AIProviderResponse | None = None, exc: Exception | None = None) -> None:
        self._name = name
        self._response = response
        self._exc = exc
        self.chat_calls = 0
        self.stream_calls = 0

    @property
    def name(self) -> str:
        return self._name

    @property
    def model_name(self) -> str:
        return f"{self._name}-model"

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: dict[str, str] | None = None,
    ) -> AIProviderResponse:
        self.chat_calls += 1
        if self._exc:
            raise self._exc
        if self._response is None:
            raise RuntimeError("no response configured")
        return self._response

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        self.stream_calls += 1
        if self._exc:
            raise self._exc
        if self._response is None:
            raise RuntimeError("no response configured")
        yield self._response.content

    async def health(self) -> bool:
        return self._response is not None and self._exc is None


@pytest.fixture
def ok_response() -> AIProviderResponse:
    return AIProviderResponse(
        content="ok",
        provider_name="fallback",
        model="fallback-model",
        tokens_input=1,
        tokens_output=1,
    )


async def test_chat_uses_fallback_when_primary_fails() -> None:
    primary = _FakeProvider("primary", exc=RuntimeError("primary down"))
    fallback = _FakeProvider("fallback", response=AIProviderResponse(
        content="from fallback",
        provider_name="fallback",
        model="fallback-model",
    ))
    resilient = ResilientProvider(primary, [fallback])

    result = await resilient.chat([{"role": "user", "content": "hi"}])

    assert result.content == "from fallback"
    assert primary.chat_calls == 1
    assert fallback.chat_calls == 1


async def test_chat_raises_when_all_providers_fail() -> None:
    primary = _FakeProvider("primary", exc=RuntimeError("primary down"))
    fallback = _FakeProvider("fallback", exc=RuntimeError("fallback down"))
    resilient = ResilientProvider(primary, [fallback])

    with pytest.raises(RuntimeError, match="All AI providers exhausted"):
        await resilient.chat([{"role": "user", "content": "hi"}])

    assert primary.chat_calls == 1
    assert fallback.chat_calls == 1


async def test_stream_falls_back_to_next_provider() -> None:
    primary = _FakeProvider("primary", exc=RuntimeError("primary stream down"))
    fallback = _FakeProvider("fallback", response=AIProviderResponse(
        content="fallback token",
        provider_name="fallback",
        model="fallback-model",
    ))
    resilient = ResilientProvider(primary, [fallback])

    tokens = [t async for t in resilient.stream([{"role": "user", "content": "hi"}])]

    assert tokens == ["fallback token"]
    assert primary.stream_calls == 1
    assert fallback.stream_calls == 1


async def test_health_true_if_any_provider_healthy() -> None:
    primary = _FakeProvider("primary", exc=RuntimeError("sick"))
    fallback = _FakeProvider("fallback", response=AIProviderResponse(
        content="ok",
        provider_name="fallback",
        model="fallback-model",
    ))
    resilient = ResilientProvider(primary, [fallback])

    assert await resilient.health() is True
