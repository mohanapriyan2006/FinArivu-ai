"""Main CopilotService — the top-level orchestrator.

Implements the full chat flow:
    User Message → JWT Auth → Load Profile → Load History →
    Guardrails → AI Planner → Agent Executor → Response Builder →
    Persist → Return/Stream
"""

from __future__ import annotations

import time
import uuid
from typing import Any, AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.orchestrator.executor import AgentExecutor
from app.ai.orchestrator.planner import AIPlannerService
from app.ai.orchestrator.response_builder import ResponseBuilder
from app.ai.prompts.guardrails import GuardrailEngine
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas import (
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotHealthResponse,
    CopilotIntent,
    StreamEvent,
)
from app.ai.tools.user_context import UserContextLoader
from app.core.logger import logger


class CopilotService:
    """Production AI Copilot orchestrator.

    Each public method accepts a database session and user ID so the
    service can be instantiated once per request via FastAPI DI.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._memory = ConversationMemory(session)
        self._context_loader = UserContextLoader(session)
        self._guardrails = GuardrailEngine()

    async def chat(
        self,
        user_id: uuid.UUID,
        request: CopilotChatRequest,
    ) -> CopilotChatResponse:
        """Full synchronous chat flow — returns a complete response."""
        start = time.perf_counter()
        message = request.message.strip()

        # ── Empty message ─────────────────────────────────────────────
        if not message:
            return CopilotChatResponse(
                message="I didn't receive a message. How can I help with your finances today?",
                guardrail_triggered=False,
            )

        # ── Guardrails ────────────────────────────────────────────────
        guard_result = self._guardrails.check(message)
        if not guard_result.allowed:
            await self._memory.save_message(
                user_id, request.session_id, "user", message,
                blocked=True, block_reason=guard_result.reason,
            )
            return self._blocked_response(guard_result.reason)

        # ── Investment advice check ───────────────────────────────────
        if self._guardrails.is_investment_advice_request(message):
            await self._memory.save_message(
                user_id, request.session_id, "user", message,
            )
            response_text = (
                "I can't provide specific investment recommendations. "
                "For personalised advice, please consult a SEBI-registered "
                "investment advisor. I can, however, explain general concepts "
                "like SIPs, mutual funds, PPF, NPS, and tax-saving options."
            )
            msg = await self._memory.save_message(
                user_id, request.session_id, "assistant", response_text,
                intent="investment_advice_blocked",
            )
            return CopilotChatResponse(
                message_id=msg.id,
                message=response_text,
                guardrail_triggered=True,
                disclaimer="This is educational information, not investment advice.",
            )

        # ── Save user message ─────────────────────────────────────────
        await self._memory.save_message(
            user_id, request.session_id, "user",
            guard_result.sanitised_message,
        )

        # ── Build context ─────────────────────────────────────────────
        provider = get_ai_provider()
        user_context = await self._context_loader.build_context_prompt(user_id)
        history = await self._memory.load_history(
            user_id, request.session_id, limit=8,
        )

        # ── Plan ──────────────────────────────────────────────────────
        planner = AIPlannerService(provider)
        plan = await planner.plan(
            guard_result.sanitised_message,
            user_context=user_context,
        )

        # ── Execute agents ────────────────────────────────────────────
        executor = AgentExecutor(self._session)
        context: dict[str, Any] = {
            "user_message": guard_result.sanitised_message,
            "user_context": user_context,
            "history": history,
        }
        results = await executor.execute(user_id, plan, context)

        # ── Build response ────────────────────────────────────────────
        builder = ResponseBuilder(provider)
        response_text, merged_data, ai_response = await builder.build(
            guard_result.sanitised_message, plan, results,
        )

        # ── Persist assistant message ─────────────────────────────────
        elapsed = int((time.perf_counter() - start) * 1000)
        msg = await self._memory.save_message(
            user_id, request.session_id, "assistant", response_text,
            intent=plan.intent.value,
            provider=ai_response.provider_name if ai_response else None,
            model=ai_response.model if ai_response else None,
            tokens_input=ai_response.tokens_input if ai_response else 0,
            tokens_output=ai_response.tokens_output if ai_response else 0,
            latency_ms=elapsed,
            agent_chain={
                "agents": [r.agent_name for r in results],
                "intent": plan.intent.value,
            },
        )

        return CopilotChatResponse(
            message_id=msg.id,
            message=response_text,
            intent=plan.intent,
            agents_used=[r.agent_name for r in results],
            data=merged_data,
            guardrail_triggered=False,
            provider=ai_response.provider_name if ai_response else None,
            model=ai_response.model if ai_response else None,
            tokens_input=ai_response.tokens_input if ai_response else 0,
            tokens_output=ai_response.tokens_output if ai_response else 0,
        )

    async def chat_stream(
        self,
        user_id: uuid.UUID,
        request: CopilotChatRequest,
    ) -> AsyncIterator[StreamEvent]:
        """Streaming chat flow — yields SSE events."""
        message = request.message.strip()

        if not message:
            yield StreamEvent(
                event_type="error",
                data="Empty message received.",
            )
            return

        # Guardrails
        guard_result = self._guardrails.check(message)
        if not guard_result.allowed:
            await self._memory.save_message(
                user_id, request.session_id, "user", message,
                blocked=True, block_reason=guard_result.reason,
            )
            blocked = self._blocked_response(guard_result.reason)
            yield StreamEvent(event_type="token", data=blocked.message)
            yield StreamEvent(event_type="done")
            return

        if self._guardrails.is_investment_advice_request(message):
            await self._memory.save_message(
                user_id, request.session_id, "user", message,
            )
            yield StreamEvent(
                event_type="token",
                data=(
                    "I can't provide specific investment recommendations. "
                    "Please consult a SEBI-registered investment advisor."
                ),
            )
            yield StreamEvent(event_type="done")
            return

        await self._memory.save_message(
            user_id, request.session_id, "user",
            guard_result.sanitised_message,
        )

        provider = get_ai_provider()
        user_context = await self._context_loader.build_context_prompt(user_id)

        planner = AIPlannerService(provider)
        plan = await planner.plan(
            guard_result.sanitised_message,
            user_context=user_context,
        )

        executor = AgentExecutor(self._session)
        context: dict[str, Any] = {
            "user_message": guard_result.sanitised_message,
            "user_context": user_context,
        }
        results = await executor.execute(user_id, plan, context)

        builder = ResponseBuilder(provider)
        full_response: list[str] = []

        async for event in builder.build_stream(
            guard_result.sanitised_message, plan, results,
        ):
            if event.event_type == "token":
                full_response.append(event.data)
            yield event

        # Persist the complete streamed response.
        if full_response:
            await self._memory.save_message(
                user_id, request.session_id, "assistant",
                "".join(full_response),
                intent=plan.intent.value,
                agent_chain={
                    "agents": [r.agent_name for r in results],
                    "intent": plan.intent.value,
                },
            )

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
        start = time.perf_counter()
        healthy = await provider.health()
        latency = int((time.perf_counter() - start) * 1000)

        return CopilotHealthResponse(
            provider=provider.name,
            model=provider.model_name,
            healthy=healthy,
            latency_ms=latency,
        )

    @staticmethod
    def _blocked_response(reason: str) -> CopilotChatResponse:
        """Return a canned response for blocked messages."""
        messages = {
            "harmful_request": (
                "I can't help with that request. Please avoid sharing "
                "passwords, OTPs, or sensitive personal information."
            ),
            "non_financial": (
                "I specialise in personal finance topics for Indian "
                "professionals. Could you ask about budgeting, saving, "
                "taxes, loans, or retirement planning?"
            ),
            "prompt_injection": (
                "I detected an unusual request pattern. I can only assist "
                "with personal finance topics."
            ),
        }
        return CopilotChatResponse(
            message=messages.get(reason, messages["non_financial"]),
            guardrail_triggered=True,
        )
