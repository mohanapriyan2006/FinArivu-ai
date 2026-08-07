from __future__ import annotations

import time
import uuid
from typing import Any, AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.context.builder import ContextBuilder
from app.ai.guardrails.guardrail import Guardrail
from app.ai.intent.classifier import IntentClassifier
from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.agents.insight_agent import InsightAgent
from app.ai.agents.recommendation_agent import RecommendationAgent
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
        self._insight_agent = InsightAgent(session)
        self._recommendation_agent = RecommendationAgent(session)
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

        # 8. Run insight and recommendation agents
        insight_context = {
            "user_message": message,
            "financial_context": financial_context,
            "agent_results": agent_results,
            "entities": intent_result.entities,
            "session_id": session_id,
        }
        insight_result = await self._insight_agent.safe_execute(user_id, insight_context)
        recommendation_result = await self._recommendation_agent.safe_execute(user_id, insight_context)
        full_results = agent_results + [insight_result, recommendation_result]

        # 9. Build final explanation with artifacts, recommendations, metadata
        provider = get_ai_provider()
        self._response_builder = ResponseBuilder(provider)
        planner_output = self._to_planner_output(execution_plan)

        build = await self._response_builder.build_full(
            message,
            planner_output,
            full_results,
            start,
        )

        # 10. Persist assistant message with full metadata
        latency = int((time.perf_counter() - start) * 1000)
        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            build.message,
            intent=execution_plan.intent.value,
            provider=build.ai_response.provider_name if build.ai_response else None,
            model=build.ai_response.model if build.ai_response else None,
            tokens_input=build.ai_response.tokens_input if build.ai_response else 0,
            tokens_output=build.ai_response.tokens_output if build.ai_response else 0,
            latency_ms=latency,
            agent_chain={
                "agents": [r.agent_name for r in full_results if not r.error],
                "intent": execution_plan.intent.value,
            },
        )

        # 11. Return structured response
        return CopilotChatResponse(
            message_id=msg.id,
            message=build.message,
            summary=build.summary,
            intent=self._map_intent(execution_plan.intent.value),
            agents_used=build.metadata.agents_used,
            data=build.merged_data,
            artifacts=build.artifacts,
            recommendations=build.recommendations,
            follow_up_questions=build.follow_up_questions,
            suggested_actions=build.suggested_actions,
            metadata=build.metadata,
            provider=build.ai_response.provider_name if build.ai_response else None,
            model=build.ai_response.model if build.ai_response else None,
            tokens_input=build.ai_response.tokens_input if build.ai_response else 0,
            tokens_output=build.ai_response.tokens_output if build.ai_response else 0,
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

    async def chat_stream(
        self,
        user_id: uuid.UUID,
        request: CopilotChatRequest,
    ) -> AsyncIterator[StreamEvent]:
        """Stream a copilot response with agent progress and tokens."""
        from app.ai.schemas import StreamEvent, StreamEventType

        session_id = request.session_id
        message = request.message.strip()

        if not message:
            yield StreamEvent(
                event_type=StreamEventType.ERROR,
                data="No message provided.",
            )
            yield StreamEvent(event_type=StreamEventType.DONE)
            return

        # 1. Guardrail
        guard_result = self._guardrail.check(message)
        if not guard_result.allowed or self._guardrail.is_investment_advice(message):
            reason = guard_result.reason if not guard_result.allowed else "investment_advice"
            chat_response = self._guardrail.build_response(reason)
            yield StreamEvent(
                event_type=StreamEventType.DATA,
                data=chat_response.message,
            )
            yield StreamEvent(event_type=StreamEventType.DONE)
            return

        # 2. Classify, build context, plan, execute
        await self._memory.save_message(user_id, session_id, "user", message)
        intent_result = self._intent.classify(message)
        financial_context = await self._context_builder.build(user_id, session_id)
        execution_plan = self._planner.plan(intent_result)
        agent_results = await self._orchestrator.execute(
            user_id,
            session_id,
            execution_plan,
            financial_context,
            message,
            intent_result.entities,
        )

        # 3. Stream explanation tokens
        provider = get_ai_provider()
        self._response_builder = ResponseBuilder(provider)
        planner_output = self._to_planner_output(execution_plan)

        async for event in self._response_builder.build_stream(
            message, planner_output, agent_results,
        ):
            yield event

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
