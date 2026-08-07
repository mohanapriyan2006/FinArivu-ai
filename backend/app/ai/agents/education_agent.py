"""Education specialist agent — explains finance concepts and answers FAQs.

Unlike other agents, the EducationAgent does NOT call a calculation engine.
It uses the AI provider to generate an educational response within the
copilot's guardrails.
"""

from __future__ import annotations

import uuid
from typing import Any

from app.ai.agents.base_agent import BaseSpecialistAgent
from app.ai.schemas import AgentResult


class EducationAgent(BaseSpecialistAgent):
    """Answers financial education questions using LLM-generated content.

    The actual LLM call happens in the response builder; this agent simply
    signals that an educational response is needed and passes through the
    user's question.
    """

    @property
    def agent_name(self) -> str:
        return "EducationAgent"

    async def execute(
        self,
        user_id: uuid.UUID,
        context: dict[str, Any],
    ) -> AgentResult:
        user_message = context.get("user_message", "")

        return AgentResult(
            agent_name=self.agent_name,
            data={
                "type": "education",
                "question": user_message,
            },
            summary="Educational response requested.",
            confidence=1.0,
        )
