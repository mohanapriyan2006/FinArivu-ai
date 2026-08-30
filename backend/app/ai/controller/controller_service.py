"""End-to-end copilot service orchestrated by the local-Phi-4 controller."""

from __future__ import annotations

import time
import uuid
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.context.builder import ContextBuilder
from app.ai.context.context_requirements import (
    get_required_domains,
    resolve_required_domains,
)
from app.ai.controller.controller_schema import ControllerPlan
from app.ai.controller.resilient_controller import ResilientController
from app.ai.memory.conversation_memory import ConversationMemory
from app.ai.orchestrator.orchestrator import Orchestrator
from app.ai.orchestrator.response_builder import BuildResult, ResponseBuilder
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas import (
    CopilotChatResponse,
    CopilotIntent,
    ResponseType,
    StreamEvent,
    StreamEventType,
)
from app.ai.schemas.orchestration import FinancialContext
from app.ai.validator import ResponseValidationService, ValidationResult
from app.core.config import settings
from app.core.logger import logger


class ControllerService:
    """Runs the full controller-led copilot pipeline.

    Replaces the older rule-based intent + planner steps with the
    resilient local-Phi-4 controller and validates every final response
    before it reaches the user.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._controller = ResilientController()
        self._context_builder = ContextBuilder(session)
        self._orchestrator = Orchestrator(session)
        self._memory = ConversationMemory(session)
        self._validator = ResponseValidationService()

    async def chat(
        self,
        user_id: uuid.UUID,
        session_id: str,
        user_message: str,
    ) -> CopilotChatResponse:
        """Synchronous chat flow with validation."""
        start = time.perf_counter()
        request_id = uuid.uuid4().hex

        user_context = await self._context_builder.build(
            user_id, session_id, required_domains=None
        )
        history = await self._memory.load_history(user_id, session_id, limit=6)
        history_text = self._format_history(history)

        plan = await self._controller.run(
            user_message,
            self._format_context(user_context),
            history_text,
            request_id,
        )

        # Handle controller-level safety or clarification.
        if plan.safety_action in ("block", "educational_refusal"):
            return await self._blocked_response(
                user_id, session_id, user_message, plan, start,
            )

        if plan.missing_information and plan.response_mode == "clarification":
            return await self._clarification_response(
                user_id, session_id, plan, start,
            )

        financial_context = await self._build_context(user_id, session_id, plan, user_context)
        if financial_context.data_missing and plan.response_mode == "clarification":
            return await self._clarification_response(
                user_id, session_id, plan, start,
            )

        execution_plan = plan.to_execution_plan(timeout_seconds=settings.ai_agent_timeout_seconds)
        agent_results = await self._orchestrator.execute(
            user_id,
            session_id,
            execution_plan,
            financial_context,
            user_message,
            plan.entities,
        )

        build = await self._build_and_validate_response(
            user_message, plan, agent_results, financial_context, start,
        )

        safe_response = build.message
        latency = int((time.perf_counter() - start) * 1000)
        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            safe_response,
            intent=execution_plan.intent.value,
            provider=build.ai_response.provider_name if build.ai_response else None,
            model=build.ai_response.model if build.ai_response else None,
            tokens_input=build.ai_response.tokens_input if build.ai_response else 0,
            tokens_output=build.ai_response.tokens_output if build.ai_response else 0,
            latency_ms=latency,
            agent_chain={
                "agents": [r.agent_name for r in agent_results if not r.error],
                "intent": execution_plan.intent.value,
            },
        )

        return CopilotChatResponse(
            message_id=msg.id,
            message=safe_response,
            response_type=build.response_type,
            summary=build.summary,
            intent=self._map_intent(plan.intent),
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
        )

    async def chat_stream(
        self,
        user_id: uuid.UUID,
        session_id: str,
        user_message: str,
    ) -> AsyncIterator[StreamEvent]:
        """Streaming chat flow: safe progress events, then validated response."""
        start = time.perf_counter()
        request_id = uuid.uuid4().hex

        yield StreamEvent(
            event_type=StreamEventType.AGENT_START,
            data="Analysing your request",
            agent_name="Controller",
            metadata={"step": "controller"},
        )

        user_context = await self._context_builder.build(
            user_id, session_id, required_domains=None
        )
        history = await self._memory.load_history(user_id, session_id, limit=6)
        history_text = self._format_history(history)

        plan = await self._controller.run(
            user_message,
            self._format_context(user_context),
            history_text,
            request_id,
        )

        if plan.safety_action in ("block", "educational_refusal"):
            text = self._safety_text(plan)
            yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
            yield StreamEvent(event_type=StreamEventType.DONE)
            await self._memory.save_message(user_id, session_id, "assistant", text)
            return

        if plan.missing_information and plan.response_mode == "clarification":
            text = plan.to_clarification_message()
            yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
            yield StreamEvent(event_type=StreamEventType.DONE)
            await self._memory.save_message(user_id, session_id, "assistant", text)
            return

        yield StreamEvent(
            event_type=StreamEventType.AGENT_START,
            data="Building financial context",
            agent_name="ContextBuilder",
            metadata={"step": "context"},
        )
        financial_context = await self._build_context(user_id, session_id, plan, user_context)

        if financial_context.data_missing and plan.response_mode == "clarification":
            text = plan.to_clarification_message()
            yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
            yield StreamEvent(event_type=StreamEventType.DONE)
            await self._memory.save_message(user_id, session_id, "assistant", text)
            return

        execution_plan = plan.to_execution_plan(timeout_seconds=settings.ai_agent_timeout_seconds)

        yield StreamEvent(
            event_type=StreamEventType.AGENT_START,
            data=f"Running {', '.join(plan.selected_agents)}",
            agent_name="Orchestrator",
            metadata={"step": "orchestrator"},
        )
        agent_results = await self._orchestrator.execute(
            user_id,
            session_id,
            execution_plan,
            financial_context,
            user_message,
            plan.entities,
        )

        for result in agent_results:
            if not result.error:
                yield StreamEvent(
                    event_type=StreamEventType.AGENT_DONE,
                    data=result.summary,
                    agent_name=result.agent_name,
                )

        yield StreamEvent(
            event_type=StreamEventType.AGENT_START,
            data="Validating response",
            agent_name="Validator",
            metadata={"step": "validation"},
        )

        build = await self._build_and_validate_response(
            user_message, plan, agent_results, financial_context, start,
        )

        # Stream the final, validated response.
        for chunk in build.message.split():
            yield StreamEvent(event_type=StreamEventType.TOKEN, data=chunk + " ")

        yield StreamEvent(
            event_type=StreamEventType.DATA,
            data=str(build.merged_data),
        )
        yield StreamEvent(event_type=StreamEventType.DONE)

        await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            build.message,
            intent=execution_plan.intent.value,
            provider=build.ai_response.provider_name if build.ai_response else None,
            model=build.ai_response.model if build.ai_response else None,
            tokens_input=build.ai_response.tokens_input if build.ai_response else 0,
            tokens_output=build.ai_response.tokens_output if build.ai_response else 0,
            latency_ms=int((time.perf_counter() - start) * 1000),
            agent_chain={
                "agents": [r.agent_name for r in agent_results if not r.error],
                "intent": execution_plan.intent.value,
            },
        )

    async def _build_context(
        self,
        user_id: uuid.UUID,
        session_id: str,
        plan: ControllerPlan,
        base_context: FinancialContext,
    ) -> FinancialContext:
        """Load the minimum required financial context."""
        domains_from_context = resolve_required_domains(plan.required_context)
        domains_from_agents = get_required_domains(plan.selected_agents)
        required = list(set(domains_from_context) | set(domains_from_agents))
        if not required:
            required = list(set())
        return await self._context_builder.build(user_id, session_id, required_domains=required)

    async def _build_and_validate_response(
        self,
        user_message: str,
        plan: ControllerPlan,
        agent_results: list,
        financial_context: FinancialContext,
        start_time: float,
    ) -> BuildResult:
        """Generate the explanation and validate it before use."""
        provider = get_ai_provider()
        builder = ResponseBuilder(provider)
        planner_output = plan.to_planner_output()

        build = await builder.build_full(
            user_message,
            planner_output,
            agent_results,
            start_time,
            financial_context,
        )

        if not plan.requires_verification:
            return build

        validation = await self._validator.validate(
            build.message,
            user_message=user_message,
            financial_context=financial_context,
            agent_results=agent_results,
        )

        if validation.status == "PASS":
            return build

        if validation.status == "ESCALATE":
            api_check = await self._validator.verify_with_api(
                build.message,
                user_message=user_message,
                financial_context=financial_context,
                agent_results=agent_results,
            )
            if api_check.status == "PASS":
                return build

        # If validation failed, build a safe limitation response.
        safe_message = self._safe_limitation_message(validation)
        build = BuildResult(
            message=safe_message,
            summary=safe_message,
            merged_data=build.merged_data,
            ai_response=build.ai_response,
            artifacts=[],
            recommendations=[],
            follow_up_questions=[],
            suggested_actions=[],
            metadata=build.metadata,
            response_type=ResponseType.CLARIFICATION,
        )
        return build

    async def _blocked_response(
        self,
        user_id: uuid.UUID,
        session_id: str,
        user_message: str,
        plan: ControllerPlan,
        start_time: float,
    ) -> CopilotChatResponse:
        """Return an educational refusal for blocked or unsafe requests."""
        text = self._safety_text(plan)
        latency = int((time.perf_counter() - start_time) * 1000)
        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            text,
            intent=plan.intent,
            agent_chain={"reason": plan.safety_action},
            latency_ms=latency,
        )
        return CopilotChatResponse(
            message_id=msg.id,
            message=text,
            response_type=ResponseType.EDUCATIONAL,
            summary=text,
            intent=self._map_intent(plan.intent),
            guardrail_triggered=True,
            disclaimer="This is educational information, not investment advice.",
        )

    async def _clarification_response(
        self,
        user_id: uuid.UUID,
        session_id: str,
        plan: ControllerPlan,
        start_time: float,
    ) -> CopilotChatResponse:
        """Return a safe clarification asking for missing information."""
        text = plan.to_clarification_message()
        latency = int((time.perf_counter() - start_time) * 1000)
        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            text,
            intent=plan.intent,
            latency_ms=latency,
        )
        return CopilotChatResponse(
            message_id=msg.id,
            message=text,
            response_type=ResponseType.CLARIFICATION,
            summary=text,
            intent=self._map_intent(plan.intent),
        )

    @staticmethod
    def _safety_text(plan: ControllerPlan) -> str:
        return (
            "I cannot provide specific investment recommendations. "
            "For personalised advice, please consult a SEBI-registered "
            "investment advisor. I can, however, explain general concepts "
            "like SIPs, mutual funds, PPF, NPS, and tax-saving options."
        ) if plan.safety_action == "educational_refusal" else (
            "I can only assist with personal finance topics for Indian "
            "salaried professionals. Could you ask about budgeting, saving, "
            "taxes, loans, or retirement planning?"
        )

    @staticmethod
    def _safe_limitation_message(validation: ValidationResult) -> str:
        return (
            "I wasn't able to confirm some of the details for that answer, "
            "so I'd rather not send an unverified response. "
            "Could you rephrase the question or provide the latest numbers "
            "so I can give you a grounded answer?"
        )

    @staticmethod
    def _format_context(user_context: FinancialContext) -> str:
        """Render a compact, non-sensitive context summary for the controller."""
        snapshot = user_context.user_snapshot or {}
        parts: list[str] = []
        profile = snapshot.get("profile") or {}
        if profile.get("age"):
            parts.append(f"age {profile['age']}")
        if profile.get("employment_type"):
            parts.append(f"{profile['employment_type']} employee")
        if profile.get("city"):
            parts.append(f"based in {profile['city']}")
        income = snapshot.get("monthly_income")
        if income:
            parts.append(f"monthly income ₹{income}")
        expenses = snapshot.get("monthly_expenses")
        if expenses:
            parts.append(f"monthly expenses ₹{expenses}")
        net_worth = snapshot.get("totals", {}).get("net_worth")
        if net_worth:
            parts.append(f"net worth ₹{net_worth}")
        return "; ".join(parts) or "No financial profile available."

    @staticmethod
    def _format_history(history: list) -> str:
        """Render a compact conversation history."""
        if not history:
            return "No prior messages."
        lines: list[str] = []
        for item in history:
            role = getattr(item, "role", "unknown")
            content = getattr(item, "content", "")
            lines.append(f"{role}: {content[:80]}")
        return "\n".join(lines)

    @staticmethod
    def _map_intent(value: str) -> CopilotIntent:
        """Map a controller intent string to the client-facing CopilotIntent."""
        mapping: dict[str, str] = {
            "budget": "budget_analysis",
            "expense": "budget_analysis",
            "goal": "goal_tracking",
            "retirement": "retirement_planning",
            "tax": "tax_planning",
            "health": "health_score",
            "networth": "net_worth",
            "education": "education",
            "investment_education": "education",
            "report": "report_summary",
            "greeting": "general",
            "general": "general",
            "mixed": "general",
            "cash_flow": "general",
            "scenario": "general",
        }
        try:
            return CopilotIntent(mapping.get(value.lower(), value))
        except ValueError:
            return CopilotIntent.GENERAL
