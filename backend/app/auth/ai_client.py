"""Multi-AI provider fallback client.

Tries Groq first, falls back to Gemini, then OpenRouter.
"""

import asyncio
from typing import Any, AsyncGenerator

import httpx

from core.config import settings
from core.logging import logger


class AIClient:
    """Unified AI client with automatic provider fallback."""

    def __init__(self) -> None:
        self.providers = self._build_providers()
        self.timeout = httpx.Timeout(30.0, connect=5.0)

    def _build_providers(self) -> list[dict]:
        """Build provider configuration list in priority order."""
        providers = []
        if settings.groq_api_key:
            providers.append({
                "name": "groq",
                "base_url": "https://api.groq.com/openai/v1",
                "api_key": settings.groq_api_key,
                "model": "llama3-70b-8192",
            })
        if settings.gemini_api_key:
            providers.append({
                "name": "gemini",
                "base_url": "https://generativelanguage.googleapis.com/v1beta",
                "api_key": settings.gemini_api_key,
                "model": "gemini-1.5-flash",
            })
        if settings.openrouter_api_key:
            providers.append({
                "name": "openrouter",
                "base_url": "https://openrouter.ai/api/v1",
                "api_key": settings.openrouter_api_key,
                "model": "meta-llama/llama-3-70b-instruct",
            })
        return providers

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """Send a chat completion request with fallback across providers.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            temperature: Sampling temperature.
            max_tokens: Max tokens to generate.

        Returns:
            Generated text content.

        Raises:
            RuntimeError: If all providers fail.
        """
        last_error: Exception | None = None

        for provider in self.providers:
            try:
                logger.info(
                    "Trying AI provider",
                    extra={"provider": provider["name"]},
                )
                result = await self._request_provider(
                    provider, messages, temperature, max_tokens
                )
                logger.info(
                    "AI provider succeeded",
                    extra={"provider": provider["name"]},
                )
                return result
            except Exception as exc:
                logger.warning(
                    "AI provider failed",
                    extra={"provider": provider["name"], "error": str(exc)},
                )
                last_error = exc
                continue

        raise RuntimeError(
            "All AI providers failed. Check API keys and connectivity."
        ) from last_error

    async def _request_provider(
        self,
        provider: dict,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Make a request to a specific provider."""
        if provider["name"] == "groq":
            return await self._request_groq(provider, messages, temperature, max_tokens)
        elif provider["name"] == "gemini":
            return await self._request_gemini(provider, messages, temperature, max_tokens)
        elif provider["name"] == "openrouter":
            return await self._request_openrouter(provider, messages, temperature, max_tokens)
        else:
            raise ValueError(f"Unknown provider: {provider['name']}")

    async def _request_groq(
        self,
        provider: dict,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Request Groq API."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{provider['base_url']}/chat/completions",
                headers={
                    "Authorization": f"Bearer {provider['api_key']}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": provider["model"],
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _request_gemini(
        self,
        provider: dict,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Request Gemini API."""
        # Convert OpenAI-style messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{provider['base_url']}/models/{provider['model']}:generateContent",
                params={"key": provider["api_key"]},
                headers={"Content-Type": "application/json"},
                json={
                    "contents": contents,
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _request_openrouter(
        self,
        provider: dict,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Request OpenRouter API."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{provider['base_url']}/chat/completions",
                headers={
                    "Authorization": f"Bearer {provider['api_key']}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://finarivu.ai",
                    "X-Title": "FinArivu AI",
                },
                json={
                    "model": provider["model"],
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]


ai_client = AIClient()
