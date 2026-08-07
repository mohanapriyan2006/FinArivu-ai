"""Groq AI provider using the OpenAI-compatible endpoint."""

from __future__ import annotations

import time
from typing import Any, AsyncIterator

import openai

from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.core.ai_providers import GROQ
from app.core.logger import logger


class GroqProvider(BaseAIProvider):
    """Groq cloud inference via its OpenAI-compatible REST API."""

    def __init__(self) -> None:
        api_key = GROQ.api_key
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured")
        self._client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url=GROQ.base_url,
            timeout=30.0,
        )
        self._model = GROQ.model

    @property
    def name(self) -> str:
        return "groq"

    @property
    def model_name(self) -> str:
        return self._model

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: dict[str, str] | None = None,
    ) -> AIProviderResponse:
        start = time.perf_counter()
        kwargs: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "timeout": 30.0,
        }
        if response_format:
            kwargs["response_format"] = response_format

        response = await self._client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        usage = response.usage

        return AIProviderResponse(
            content=choice.message.content or "",
            provider_name=self.name,
            model=self._model,
            tokens_input=usage.prompt_tokens if usage else 0,
            tokens_output=usage.completion_tokens if usage else 0,
            latency_ms=self._elapsed_ms(start),
        )

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            timeout=30.0,
        )
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def health(self) -> bool:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
                timeout=10.0,
            )
            return bool(response.choices)
        except Exception:
            logger.warning("Groq health check failed", exc_info=True)
            return False
