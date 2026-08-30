"""Resilient controller that tries local Phi-4 and falls back to API providers."""

from __future__ import annotations

import asyncio
import json
import re
import uuid
from typing import Any

from app.ai.controller.controller_prompt import build_controller_messages
from app.ai.controller.controller_schema import ControllerPlan
from app.ai.local_llm import LocalLLMInferenceError, LocalLLMUnavailableError, Phi4Provider
from app.ai.providers.base import BaseAIProvider
from app.ai.providers.factory import get_ai_provider
from app.core.config import settings
from app.core.logger import logger


class ResilientController:
    """Local-Phi-4 controller with automatic API fallback.

    The controller is a short, structured JSON generator.  It first tries the
    local GGUF model; if the model is unavailable, times out, or produces
    malformed output, it falls through to the existing ``ResilientProvider``
    chain (Gemini -> Groq -> OpenRouter) via ``get_ai_provider``.
    """

    def __init__(
        self,
        local: Phi4Provider | None = None,
        api: BaseAIProvider | None = None,
    ) -> None:
        self._local = local or Phi4Provider()
        self._api = api
        if self._api is None:
            try:
                self._api = get_ai_provider()
            except Exception as exc:
                logger.warning("Could not initialise API provider for controller fallback: %s", exc)
                self._api = None
        self._timeout = settings.ai_controller_timeout_seconds

    async def run(
        self,
        user_message: str,
        user_context: str,
        history: str,
        request_id: str,
    ) -> ControllerPlan:
        """Run the controller and return a validated plan."""
        messages = build_controller_messages(user_message, user_context, history, request_id)

        # Try local Phi-4 first if it is available.
        try:
            if self._local._config.is_available():  # type: ignore[attr-defined]
                response = await asyncio.wait_for(
                    self._local.chat(messages, temperature=0.1, max_tokens=512),
                    timeout=self._timeout,
                )
                return self._parse(response.content, request_id, provider="local-phi4")
        except (TimeoutError, asyncio.TimeoutError, LocalLLMUnavailableError, LocalLLMInferenceError) as exc:
            logger.warning("Local Phi-4 controller failed (%s), falling back to API", type(exc).__name__)
        except Exception as exc:
            logger.warning("Local Phi-4 controller unexpected error (%s), falling back to API", exc)

        # Fallback to the configured API chain.
        if self._api is not None:
            try:
                response = await self._api.chat(
                    messages,
                    temperature=0.1,
                    max_tokens=512,
                    response_format={"type": "json_object"},
                )
                return self._parse(response.content, request_id, provider="api-fallback")
            except Exception as exc:
                logger.warning("API controller fallback also failed: %s", exc)

        # Absolute last resort: safe default so the request does not crash.
        logger.warning("All controllers failed for request %s; returning safe default", request_id)
        return ControllerPlan.default(request_id)

    @staticmethod
    def _parse(raw: str, request_id: str, provider: str = "local") -> ControllerPlan:
        """Extract JSON from the model output and validate as a ControllerPlan."""
        text = (raw or "").strip()
        if not text:
            return ControllerPlan.default(request_id)

        # Strip possible markdown fences.
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            text = match.group(1)

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Controller %s returned non-JSON output; using default", provider)
            return ControllerPlan.default(request_id)

        if not isinstance(data, dict):
            return ControllerPlan.default(request_id)

        data["request_id"] = request_id
        try:
            return ControllerPlan(**data)
        except Exception as exc:
            logger.warning("Controller %s output failed Pydantic validation (%s); using default", provider, exc)
            return ControllerPlan.default(request_id)
