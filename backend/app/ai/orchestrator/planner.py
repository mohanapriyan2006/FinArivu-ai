"""AI Planner — classifies intent and selects agents.

Takes the user message plus optional conversation history and calls the
AI provider with the planner prompt to produce a structured ``PlannerOutput``.
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.ai.prompts.planner_prompt import PLANNER_PROMPT_TEMPLATE
from app.ai.providers.base import BaseAIProvider
from app.ai.schemas import CopilotIntent, PlannerOutput, ResponseStyle
from app.core.logger import logger


class AIPlannerService:
    """Calls the LLM to classify user intent and route to agents."""

    def __init__(self, provider: BaseAIProvider) -> None:
        self._provider = provider

    async def plan(
        self,
        user_message: str,
        user_context: str = "",
    ) -> PlannerOutput:
        """Produce a ``PlannerOutput`` from the user message.

        On any parse failure the planner falls back to the ``education``
        intent with ``EducationAgent``.
        """
        prompt = PLANNER_PROMPT_TEMPLATE.format(
            user_message=user_message,
            user_context=user_context or "No profile data available.",
        )

        messages = [
            {"role": "system", "content": "You are an intent classification engine. Output ONLY valid JSON."},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await self._provider.chat(
                messages,
                temperature=0.1,
                max_tokens=512,
                response_format={"type": "json_object"},
            )
            return self._parse_response(response.content)
        except Exception as exc:
            logger.warning("Planner LLM call failed: %s — using fallback", exc)
            return self._fallback()

    def _parse_response(self, raw: str) -> PlannerOutput:
        """Extract and validate JSON from the LLM response."""
        try:
            # Try direct parse first.
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Attempt to extract JSON block from markdown fences.
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                logger.warning("Could not parse planner JSON: %s", raw[:200])
                return self._fallback()

        # Validate and coerce fields.
        intent_str = data.get("intent", "general")
        try:
            intent = CopilotIntent(intent_str)
        except ValueError:
            intent = CopilotIntent.GENERAL

        agents = data.get("agents", [])
        if not isinstance(agents, list):
            agents = []

        tools = data.get("tools", [])
        if not isinstance(tools, list):
            tools = []

        style_str = data.get("response_style", "educational")
        try:
            style = ResponseStyle(style_str)
        except ValueError:
            style = ResponseStyle.EDUCATIONAL

        return PlannerOutput(
            intent=intent,
            agents=agents,
            tools=tools,
            needs_profile=bool(data.get("needs_profile", False)),
            needs_history=bool(data.get("needs_history", False)),
            response_style=style,
        )

    @staticmethod
    def _fallback() -> PlannerOutput:
        """Return a safe default plan for education/general queries."""
        return PlannerOutput(
            intent=CopilotIntent.EDUCATION,
            agents=["EducationAgent"],
            tools=[],
            needs_profile=False,
            needs_history=False,
            response_style=ResponseStyle.EDUCATIONAL,
        )
