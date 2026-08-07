"""Response builder — merges agent results into a human-readable response.

Takes the raw ``AgentResult`` list, calls the AI provider to generate a
natural-language explanation, and produces the final ``CopilotChatResponse``.
"""

from __future__ import annotations

import json
from typing import Any, AsyncIterator

from app.ai.prompts.system_prompt import COPILOT_SYSTEM_PROMPT
from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.ai.schemas import (
    AgentResult,
    CopilotChatResponse,
    CopilotIntent,
    PlannerOutput,
    ResponseStyle,
    StreamEvent,
    StreamEventType,
)
from app.core.logger import logger


# ── Explanation prompt ────────────────────────────────────────────────────

_EXPLANATION_TEMPLATE: str = """\
The user asked: "{user_message}"

The following data was computed by FinArivu's financial engines:

{agent_data}

Using ONLY the data above, write a clear, {style} response for the user.
Do NOT invent numbers.  Do NOT add a disclaimer — the system handles that.
Keep the response under 300 words.
"""


class ResponseBuilder:
    """Merges agent results and generates the final AI explanation."""

    def __init__(self, provider: BaseAIProvider) -> None:
        self._provider = provider

    async def build(
        self,
        user_message: str,
        plan: PlannerOutput,
        results: list[AgentResult],
    ) -> tuple[str, dict[str, Any], AIProviderResponse | None]:
        """Build the final response text and merged data dict.

        Returns ``(message_text, merged_data, ai_response_or_none)``.
        """
        merged_data = self._merge_data(results)
        agent_summaries = self._format_summaries(results)

        # For education-only intents the LLM generates the full response.
        # For engine-backed intents the LLM explains the engine output.
        prompt = _EXPLANATION_TEMPLATE.format(
            user_message=user_message,
            agent_data=agent_summaries,
            style=plan.response_style.value,
        )

        messages = [
            {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            ai_response = await self._provider.chat(
                messages,
                temperature=0.4,
                max_tokens=1024,
            )
            return ai_response.content, merged_data, ai_response
        except Exception as exc:
            logger.warning("Explanation LLM call failed: %s", exc)
            # Fallback: return raw summaries.
            fallback_text = "\n".join(
                r.summary for r in results if r.summary
            ) or "I processed your request but couldn't generate a detailed explanation."
            return fallback_text, merged_data, None

    async def build_stream(
        self,
        user_message: str,
        plan: PlannerOutput,
        results: list[AgentResult],
    ) -> AsyncIterator[StreamEvent]:
        """Stream the explanation token-by-token as SSE events."""
        merged_data = self._merge_data(results)
        agent_summaries = self._format_summaries(results)

        # Emit agent completion events.
        for r in results:
            yield StreamEvent(
                event_type=StreamEventType.AGENT_DONE,
                data=r.summary,
                agent_name=r.agent_name,
            )

        # Emit structured data event.
        yield StreamEvent(
            event_type=StreamEventType.DATA,
            data=json.dumps(merged_data, default=str),
        )

        # Stream explanation tokens.
        prompt = _EXPLANATION_TEMPLATE.format(
            user_message=user_message,
            agent_data=agent_summaries,
            style=plan.response_style.value,
        )
        messages = [
            {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        try:
            async for token in self._provider.stream(
                messages,
                temperature=0.4,
                max_tokens=1024,
            ):
                yield StreamEvent(
                    event_type=StreamEventType.TOKEN,
                    data=token,
                )
        except Exception as exc:
            logger.warning("Stream explanation failed: %s", exc)
            yield StreamEvent(
                event_type=StreamEventType.ERROR,
                data=str(exc),
            )

        yield StreamEvent(event_type=StreamEventType.DONE)

    @staticmethod
    def _merge_data(results: list[AgentResult]) -> dict[str, Any]:
        """Merge all agent data dicts into a single response dict."""
        merged: dict[str, Any] = {}
        for r in results:
            if r.data:
                merged[r.agent_name] = r.data
        return merged

    @staticmethod
    def _format_summaries(results: list[AgentResult]) -> str:
        """Format agent summaries as a bullet list for the LLM."""
        lines = []
        for r in results:
            if r.summary:
                lines.append(f"• [{r.agent_name}] {r.summary}")
            if r.data:
                # Include a compact JSON snippet for the LLM.
                compact = json.dumps(r.data, default=str, indent=None)
                if len(compact) < 2000:
                    lines.append(f"  Data: {compact}")
        return "\n".join(lines) or "No engine data available."
