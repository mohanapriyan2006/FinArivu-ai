from __future__ import annotations

import uuid
from typing import Any, AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.controller.controller_service import ControllerService
from app.ai.guardrails.guardrail import Guardrail
from app.ai.guardrails.guardrail_service import GuardrailService
from app.ai.intents import to_copilot_intent
from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas import (
    CopilotAttachment,
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotHealthResponse,
)
from app.core.logger import logger


class AIController:
    """Single entry point for the FinArivu AI orchestration layer.

    Pipeline:
        user message -> guardrail -> intent -> context -> plan ->
        orchestrator -> response builder -> persist -> return
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._guardrail = Guardrail()
        self._guardrail_service = GuardrailService()
        self._memory = ConversationMemory(session)

    async def chat(
        self,
        user_id: uuid.UUID,
        request: CopilotChatRequest,
    ) -> CopilotChatResponse:
        """Process a user message through the full orchestration pipeline."""
        session_id = request.session_id
        message = request.message.strip()

        if not message and not request.attachments:
            return CopilotChatResponse(
                message="I didn't receive a message. How can I help with your finances today?",
            )
        if not message:
            message = "Please analyse the attached document."

        sanitised_message = self._guardrail_service.mask_pii(message)
        guard_result = self._guardrail.check(sanitised_message)
        if not guard_result.allowed:
            return await self._blocked_response(
                user_id, session_id, sanitised_message, guard_result.reason or "policy_violation",
            )

        # 2. Investment advice guard
        if self._guardrail.is_investment_advice(sanitised_message):
            return await self._blocked_response(
                user_id, session_id, sanitised_message, "investment_advice",
            )

        # 3. Persist user message (with attachment marker for readable history)
        await self._memory.save_message(
            user_id, session_id, "user",
            self._display_message(sanitised_message, request.attachments),
        )

        service = ControllerService(self._session)
        ai_message = self._apply_attachments(sanitised_message, request.attachments)
        return await service.chat(user_id, session_id, ai_message)

    async def get_history(
        self,
        user_id: uuid.UUID,
        session_id: str,
        *,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Return paginated conversation history."""
        messages = await self._memory.get_session_messages(
            user_id, session_id, skip=skip, limit=limit,
        )
        return [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "intent": m.intent,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ]

    async def check_health(self) -> CopilotHealthResponse:
        """Check AI provider health."""
        provider = get_ai_provider()
        healthy = await provider.health()
        return CopilotHealthResponse(
            provider=provider.name,
            model=provider.model_name,
            healthy=healthy,
            latency_ms=0,
        )

    async def chat_stream(
        self,
        user_id: uuid.UUID,
        request: CopilotChatRequest,
    ) -> AsyncIterator[StreamEvent]:
        """Stream a copilot response with agent progress and tokens."""
        from app.ai.schemas import StreamEvent, StreamEventType

        session_id = request.session_id
        message = request.message.strip()

        if not message and not request.attachments:
            yield StreamEvent(
                event_type=StreamEventType.ERROR,
                data="No message provided.",
            )
            yield StreamEvent(event_type=StreamEventType.DONE)
            return
        if not message:
            message = "Please analyse the attached document."

        sanitised_message = self._guardrail_service.mask_pii(message)

        # 1. Guardrail
        guard_result = self._guardrail.check(sanitised_message)
        if not guard_result.allowed or self._guardrail.is_investment_advice(sanitised_message):
            reason = guard_result.reason if not guard_result.allowed else "investment_advice"
            chat_response = self._guardrail.build_response(reason)
            await self._memory.save_message(user_id, session_id, "user", sanitised_message, blocked=True, block_reason=reason)
            yield StreamEvent(
                event_type=StreamEventType.DATA,
                data=chat_response.message,
            )
            yield StreamEvent(event_type=StreamEventType.DONE)
            return

        await self._memory.save_message(
            user_id, session_id, "user",
            self._display_message(sanitised_message, request.attachments),
        )
        service = ControllerService(self._session)
        ai_message = self._apply_attachments(sanitised_message, request.attachments)
        async for event in service.chat_stream(user_id, session_id, ai_message):
            yield event

    _MAX_ATTACHMENT_CHARS = 12000

    @classmethod
    def _truncate_attachment(cls, content: str) -> str:
        """Keep the head and tail of a long document so the prompt stays small."""
        limit = cls._MAX_ATTACHMENT_CHARS
        if len(content) <= limit:
            return content
        head = content[: int(limit * 0.7)]
        tail = content[-int(limit * 0.3):]
        return f"{head}\n...[truncated {len(content) - limit} chars]...\n{tail}"

    @classmethod
    def _apply_attachments(
        cls,
        message: str,
        attachments: list[CopilotAttachment],
    ) -> str:
        """Append attached documents as structured blocks for the AI."""
        if not attachments:
            return message
        blocks = "\n\n".join(
            f'<document filename="{att.filename}" type="{att.mime_type}">\n'
            f"{cls._truncate_attachment(att.content)}\n</document>"
            for att in attachments
        )
        return f"{message}\n\n{blocks}"

    @staticmethod
    def _display_message(
        message: str,
        attachments: list[CopilotAttachment],
    ) -> str:
        """User-facing message persisted to history (no raw document text)."""
        if not attachments:
            return message
        names = ", ".join(att.filename for att in attachments)
        return f"{message}\n[Attached: {names}]"

    async def _blocked_response(
        self,
        user_id: uuid.UUID,
        session_id: str,
        message: str,
        reason: str,
    ) -> CopilotChatResponse:
        """Handle a blocked or investment-advice message."""
        chat_response = self._guardrail.build_response(reason)

        await self._memory.save_message(
            user_id,
            session_id,
            "user",
            message,
            blocked=True,
            block_reason=reason,
        )

        # Persist the educational system response so history is coherent.
        await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            chat_response.message,
            intent="policy_violation",
            agent_chain={"reason": reason},
        )

        return CopilotChatResponse(
            message=chat_response.message,
            intent=to_copilot_intent("general"),
            guardrail_triggered=True,
            disclaimer=chat_response.disclaimer,
        )
