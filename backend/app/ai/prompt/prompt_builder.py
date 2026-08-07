from __future__ import annotations

from datetime import datetime
from typing import Any

from app.ai.prompt.system_prompts import SystemPrompts


class PromptBuilder:
    """Builds a complete prompt from system, profile, context, and user message."""

    @staticmethod
    def build(
        *,
        agent_name: str = "",
        user_profile: dict[str, Any] | None = None,
        conversation_summary: str = "",
        financial_context: dict[str, Any] | None = None,
        agent_instructions: str = "",
        user_message: str = "",
    ) -> list[dict[str, str]]:
        """Return a messages list ready for an AI provider."""
        system_parts = [SystemPrompts.for_agent(agent_name) if agent_name else SystemPrompts.COPILOT]

        if agent_instructions:
            system_parts.append(agent_instructions)

        context_parts: list[str] = []

        if user_profile:
            context_parts.append("User Profile:")
            for key, value in user_profile.items():
                context_parts.append(f"- {key}: {value}")

        if conversation_summary:
            context_parts.append(f"Conversation Summary:\n{conversation_summary}")

        if financial_context:
            context_parts.append("Financial Context:")
            for key, value in financial_context.items():
                if isinstance(value, dict):
                    context_parts.append(f"- {key}: {value}")
                elif isinstance(value, list):
                    context_parts.append(f"- {key}: {len(value)} item(s)")
                else:
                    context_parts.append(f"- {key}: {value}")

        context_block = "\n".join(context_parts)
        if context_block:
            system_parts.append(context_block)

        user_prompt = user_message
        if not user_prompt:
            user_prompt = "Provide a helpful response based on the context."

        return [
            {"role": "system", "content": "\n\n".join(system_parts)},
            {"role": "user", "content": user_prompt},
        ]
