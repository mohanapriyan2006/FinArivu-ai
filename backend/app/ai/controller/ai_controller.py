from __future__ import annotations

import time
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.context.builder import ContextBuilder
from app.ai.guardrails.guardrail import Guardrail
from app.ai.intent.classifier import IntentClassifier
from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.orchestrator.orchestrator import Orchestrator
from app.ai.orchestrator.response_builder import ResponseBuilder
from app.ai.planner.planner import Planner
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas import (
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotHealthResponse,
    CopilotIntent,
    PlannerOutput,
    ResponseStyle,
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
        self._intent = IntentClassifier()
        self._context_builder = ContextBuilder(session)
        self._planner = Planner()
        self._orchestrator = Orchestrator(session)
        self._memory = ConversationMemory(session)
        self._response_builder: ResponseBuilder | None = None

    async def chat(
        self,
        user_id: uuid.UUID,
        request: CopilotChatRequest,
    ) -> CopilotChatResponse:
        """Process a user message through the full orchestration pipeline."""
        start = time.perf_counter()
        session_id = request.session_id
        message = request.message.strip()

        if not message:
            return CopilotChatResponse(
                message="I didn't receive a message. How can I help with your finances today?",
            )

        # 1. Guardrail
        guard_result = self._guardrail.check(message)
        if not guard_result.allowed:
            return await self._blocked_response(
                user_id, session_id, message, guard_result.reason or "policy_violation",
            )

        # 2. Investment advice guard
        if self._guardrail.is_investment_advice(message):
            return await self._blocked_response(
                user_id, session_id, message, "investment_advice",
            )

        # 3. Persist user message
        await self._memory.save_message(user_id, session_id, "user", message)

        # 4. Classify intent
        intent_result = self._intent.classify(message)

        # 5. Build full financial context (agents never query DB directly)
        financial_context = await self._context_builder.build(user_id, session_id)

        # 6. Create execution plan
        execution_plan = self._planner.plan(intent_result)

        # 7. Execute agents
        agent_results = await self._orchestrator.execute(
            user_id,
            session_id,
            execution_plan,
            financial_context,
            message,
            intent_result.entities,
        )

        # 8. Build final explanation
        provider = get_ai_provider()
        self._response_builder = ResponseBuilder(provider)
        planner_output = self._to_planner_output(execution_plan)

        response_text, merged_data, ai_response = await self._response_builder.build(
            message,
            planner_output,
            agent_results,
        )

        # 9. Persist assistant message with full metadata
        latency = int((time.perf_counter() - start) * 1000)
        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            response_text,
            intent=execution_plan.intent.value,
            provider=ai_response.provider_name if ai_response else None,
            model=ai_response.model if ai_response else None,
            tokens_input=ai_response.tokens_input if ai_response else 0,
            tokens_output=ai_response.tokens_output if ai_response else 0,
            latency_ms=latency,
            agent_chain={
                "agents": [r.agent_name for r in agent_results],
                "intent": execution_plan.intent.value,
            },
        )

        # 10. Return structured response
        return CopilotChatResponse(
            message_id=msg.id,
            message=response_text,
            intent=self._map_intent(execution_plan.intent.value),
            agents_used=[r.agent_name for r in agent_results if not r.error],
            data=merged_data,
            provider=ai_response.provider_name if ai_response else None,
            model=ai_response.model if ai_response else None,
            tokens_input=ai_response.tokens_input if ai_response else 0,
            tokens_output=ai_response.tokens_output if ai_response else 0,
            guardrail_triggered=False,
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
        healthy = await provider.health()
        return CopilotHealthResponse(
            provider=provider.name,
            model=provider.model_name,
            healthy=healthy,
            latency_ms=0,
        )

    async def _blocked_response(
        self,
        user_id: uuid.UUID,
        session_id: str,
        message: str,
        reason: str,
    ) -> CopilotChatResponse:
        """Handle a blocked or investment-advice message."""
        from app.ai.schemas.orchestration import ChatResponse

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
            intent=self._map_intent("general"),
            guardrail_triggered=True,
            disclaimer=chat_response.disclaimer,
        )

    def _to_planner_output(self, execution_plan: Any) -> PlannerOutput:
        """Convert an ExecutionPlan into the existing PlannerOutput for response builder."""
        from app.ai.schemas.orchestration import ExecutionPlan

        plan = execution_plan if isinstance(execution_plan, ExecutionPlan) else ExecutionPlan(**execution_plan)
        try:
            style = ResponseStyle(plan.response_style)
        except ValueError:
            style = ResponseStyle.EDUCATIONAL

        return PlannerOutput(
            intent=self._map_intent(plan.intent.value),
            agents=[s.agent_name for s in plan.steps],
            response_style=style,
        )

    def _map_intent(self, value: str) -> CopilotIntent:
        """Map new intent values onto the existing CopilotIntent schema."""
        mapping: dict[str, str] = {
            "budget": "budget_analysis",
            "goal": "goal_tracking",
            "retirement": "retirement_planning",
            "tax": "tax_planning",
            "health": "health_score",
            "networth": "net_worth",
            "education": "education",
            "report": "report_summary",
            "greeting": "general",
            "general": "general",
            "mixed": "general",
        }
        try:
            return CopilotIntent(mapping.get(value, value))
        except ValueError:
            return CopilotIntent.GENERAL
