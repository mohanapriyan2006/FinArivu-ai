"""End-to-end copilot service orchestrated by the local-Phi-4 controller."""

from __future__ import annotations

import json
import re
import time
import uuid
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.actions.action_types import ActionPreviewStatus
from app.actions.errors import ActionError
from app.actions.extractor import extract_action
from app.actions.schemas import ActionProposal, ActionPreviewResponse
from app.actions.service import ActionService
from app.ai.context.builder import ContextBuilder
from app.ai.context.context_requirements import (
    get_required_domains,
    resolve_required_domains,
)
from app.ai.controller.controller_schema import ControllerPlan
from app.ai.controller.resilient_controller import ResilientController
from app.ai.intents import to_copilot_intent, to_internal_intent
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
from app.ai.schemas.orchestration import FinancialContext, IntentEnum
from app.ai.validator import ResponseValidationService, ValidationResult
from app.core.config import settings
from app.core.logger import logger
from app.action_plan.copilot import is_plan_request, run_plan
from app.money_radar.copilot import is_radar_request, run_radar
from app.scenarios.errors import ScenarioError
from app.scenarios.extractor import ScenarioProposal, extract_scenario
from app.scenarios.service import ScenarioService


def _strip_documents(text: str) -> str:
    """Remove uploaded-document blocks — attachment text must never drive
    actions or scenario parameters."""
    return re.sub(r"<document.*?</document>", "", text, flags=re.DOTALL)


def _intent_for_operation(operation: str) -> str:
    """Best-effort intent label for action previews (UI badge only)."""
    name = operation.upper()
    for intent in ("BUDGET", "EXPENSE", "GOAL", "INCOME"):
        if intent in name:
            return intent.lower()
    return "general"


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

        # ── Scenario Lab: explicit "what if" requests run fully
        # deterministically — extraction is conservative and the engine is
        # authoritative for every number. Runs before the action fast path
        # so simulation phrasing can never be misread as a mutation.
        scenario_proposal = self._extract_scenario(user_message)
        if scenario_proposal is not None:
            scenario_response = await self._scenario_response(
                user_id, session_id, scenario_proposal, start,
            )
            if scenario_response is not None:
                return scenario_response

        # ── Fast path: deterministic action extraction BEFORE the LLM ──
        # A clear CRUD request should not wait on controller/provider latency
        # (and must never time out just because a provider is slow).
        fast_proposal = self._extract_proposal(user_message)
        if fast_proposal is not None:
            plan = ControllerPlan.default(request_id)
            plan.intent = _intent_for_operation(fast_proposal.operation)
            action_response = await self._action_preview_response(
                user_id, session_id, fast_proposal, plan, start,
            )
            if action_response is not None:
                return action_response

        # ── Money Radar: explicit "what needs attention" asks run the
        # deterministic detector pipeline — no LLM decides what exists.
        if is_radar_request(_strip_documents(user_message)):
            radar_response = await self._radar_response(
                user_id, session_id, start,
            )
            if radar_response is not None:
                return radar_response

        # ── Financial Action Plan: explicit "what should I do" asks run the
        # deterministic plan pipeline — priorities never come from the LLM.
        if is_plan_request(_strip_documents(user_message)):
            plan_response = await self._plan_response(
                user_id, session_id, start,
            )
            if plan_response is not None:
                return plan_response

        plan = await self._controller.run(
            user_message,
            self._format_context(user_context),
            history_text,
            request_id,
        )

        # Handle controller-level safety first — nothing proceeds on a block.
        if plan.safety_action in ("block", "educational_refusal"):
            return await self._blocked_response(
                user_id, session_id, user_message, plan, start,
            )

        # Controller-classified radar intent — same deterministic scan path
        # as the keyword fast path.
        if to_internal_intent(plan.intent) == IntentEnum.MONEY_RADAR:
            radar_response = await self._radar_response(
                user_id, session_id, start, plan=plan,
            )
            if radar_response is not None:
                return radar_response

        # Controller-classified action-plan intent — same deterministic path.
        if to_internal_intent(plan.intent) == IntentEnum.FINANCIAL_ACTION_PLAN:
            plan_response = await self._plan_response(
                user_id, session_id, start, plan=plan,
            )
            if plan_response is not None:
                return plan_response

        # ── Action requests: proposal → validated preview → confirmation ──
        # The LLM/extractor only proposes; the action layer validates and the
        # user confirms before anything mutates. Runs before the generic
        # missing-information clarification so typed NEEDS_INPUT questions
        # (with exact field names) take precedence.
        proposal = self._action_proposal(plan, user_message)
        if proposal is not None:
            action_response = await self._action_preview_response(
                user_id, session_id, proposal, plan, start,
            )
            if action_response is not None:
                return action_response

        # NOTE: the deterministic extractor already ran pre-controller in
        # `chat()`; `plan.proposed_action` covers phrasing it missed.

        if plan.missing_information and plan.response_mode == "clarification":
            return await self._clarification_response(
                user_id, session_id, plan, start,
            )

        financial_context = await self._build_context(user_id, session_id, plan, user_context)
        if (
            financial_context.data_missing
            and plan.response_mode == "clarification"
            and plan.missing_information
        ):
            return await self._clarification_response(
                user_id, session_id, plan, start,
            )

        execution_plan = plan.to_execution_plan(agent_timeout_seconds=settings.ai_agent_timeout_seconds)
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
            intent=to_copilot_intent(plan.intent),
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

        # ── Scenario Lab: deterministic simulations before everything else ──
        scenario_proposal = self._extract_scenario(user_message)
        if scenario_proposal is not None:
            scenario = await self._run_scenario(
                user_id, session_id, scenario_proposal
            )
            if scenario is not None:
                text, event_payload = scenario
                yield StreamEvent(
                    event_type=StreamEventType.AGENT_DONE,
                    data="Scenario computed",
                    agent_name="ScenarioEngine",
                )
                yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
                yield StreamEvent(
                    event_type=StreamEventType.DATA,
                    data=json.dumps(event_payload, default=str),
                )
                yield StreamEvent(event_type=StreamEventType.DONE)
                await self._memory.save_message(
                    user_id, session_id, "assistant", text,
                    intent="scenario_result",
                    agent_chain=event_payload.get("scenarioResult") or {},
                )
                return

        # ── Fast path: deterministic action extraction BEFORE the LLM ──
        fast_proposal = self._extract_proposal(user_message)
        if fast_proposal is not None:
            preview = await self._run_action_preview(user_id, session_id, fast_proposal)
            if preview is not None:
                text, event_payload = preview
                yield StreamEvent(
                    event_type=StreamEventType.AGENT_DONE,
                    data="Action preview ready",
                    agent_name="ActionService",
                )
                yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
                yield StreamEvent(
                    event_type=StreamEventType.DATA,
                    data=json.dumps(event_payload, default=str),
                )
                yield StreamEvent(event_type=StreamEventType.DONE)
                await self._memory.save_message(
                    user_id, session_id, "assistant", text,
                    intent="action_preview",
                    agent_chain=event_payload.get("actionPreview") or {},
                )
                return

        # ── Money Radar: deterministic scan for explicit radar asks ──
        if is_radar_request(_strip_documents(user_message)):
            radar = await self._run_radar(user_id)
            if radar is not None:
                text, event_payload = radar
                yield StreamEvent(
                    event_type=StreamEventType.AGENT_DONE,
                    data="Radar scan complete",
                    agent_name="MoneyRadar",
                )
                yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
                yield StreamEvent(
                    event_type=StreamEventType.DATA,
                    data=json.dumps(event_payload, default=str),
                )
                yield StreamEvent(event_type=StreamEventType.DONE)
                await self._memory.save_message(
                    user_id, session_id, "assistant", text,
                    intent="money_radar",
                    agent_chain={"radar": True},
                )
                return

        # ── Action Plan: deterministic plan for "what should I do" asks ──
        if is_plan_request(_strip_documents(user_message)):
            result = await self._run_plan(user_id)
            if result is not None:
                text, event_payload = result
                yield StreamEvent(
                    event_type=StreamEventType.AGENT_DONE,
                    data="Plan generated",
                    agent_name="ActionPlan",
                )
                yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
                yield StreamEvent(
                    event_type=StreamEventType.DATA,
                    data=json.dumps(event_payload, default=str),
                )
                yield StreamEvent(event_type=StreamEventType.DONE)
                await self._memory.save_message(
                    user_id, session_id, "assistant", text,
                    intent="financial_action_plan",
                    agent_chain={"action_plan": True},
                )
                return

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

        # Controller-classified radar intent → deterministic scan.
        if to_internal_intent(plan.intent) == IntentEnum.MONEY_RADAR:
            radar = await self._run_radar(user_id)
            if radar is not None:
                text, event_payload = radar
                yield StreamEvent(
                    event_type=StreamEventType.AGENT_DONE,
                    data="Radar scan complete",
                    agent_name="MoneyRadar",
                )
                yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
                yield StreamEvent(
                    event_type=StreamEventType.DATA,
                    data=json.dumps(event_payload, default=str),
                )
                yield StreamEvent(event_type=StreamEventType.DONE)
                await self._memory.save_message(
                    user_id, session_id, "assistant", text,
                    intent="money_radar",
                    agent_chain={"radar": True},
                )
                return

        # Controller-classified plan intent → deterministic plan.
        if to_internal_intent(plan.intent) == IntentEnum.FINANCIAL_ACTION_PLAN:
            result = await self._run_plan(user_id)
            if result is not None:
                text, event_payload = result
                yield StreamEvent(
                    event_type=StreamEventType.AGENT_DONE,
                    data="Plan generated",
                    agent_name="ActionPlan",
                )
                yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
                yield StreamEvent(
                    event_type=StreamEventType.DATA,
                    data=json.dumps(event_payload, default=str),
                )
                yield StreamEvent(event_type=StreamEventType.DONE)
                await self._memory.save_message(
                    user_id, session_id, "assistant", text,
                    intent="financial_action_plan",
                    agent_chain={"action_plan": True},
                )
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

        if (
            financial_context.data_missing
            and plan.response_mode == "clarification"
            and plan.missing_information
        ):
            text = plan.to_clarification_message()
            yield StreamEvent(event_type=StreamEventType.TOKEN, data=text)
            yield StreamEvent(event_type=StreamEventType.DONE)
            await self._memory.save_message(user_id, session_id, "assistant", text)
            return

        execution_plan = plan.to_execution_plan(agent_timeout_seconds=settings.ai_agent_timeout_seconds)

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
            data=json.dumps(build.merged_data, default=str),
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

    # ── Action proposal handling ──────────────────────────────────────────

    @staticmethod
    def _action_proposal(
        plan: ControllerPlan, user_message: str
    ) -> ActionProposal | None:
        """Return a structured action proposal for this message, if any.

        Preference order: the controller's structured ``proposed_action``,
        then the deterministic rule-based extractor. Attachment content is
        stripped first so document text can never drive an executable action.
        """
        if plan.safety_action != "allow":
            return None

        raw = plan.proposed_action
        if isinstance(raw, dict) and raw.get("operation"):
            try:
                proposal = ActionProposal.model_validate(raw)
                if proposal.operation:
                    return proposal
            except Exception:
                logger.warning("Controller emitted invalid proposed_action; ignored")

        # Deterministic fallback — document blocks are excluded so uploaded
        # files cannot trigger mutations on their own.
        return ControllerService._extract_proposal(user_message)

    @staticmethod
    def _extract_proposal(user_message: str) -> ActionProposal | None:
        """Rule-based extraction — never reads attachment/document text."""
        return extract_action(_strip_documents(user_message))

    # ── Scenario Lab handling ───────────────────────────────────────────

    @staticmethod
    def _extract_scenario(user_message: str) -> ScenarioProposal | None:
        """Conservative rule-based scenario extraction.

        Only fires on explicit simulation phrasing and never invents
        values — missing inputs surface as clarification questions.
        """
        return extract_scenario(_strip_documents(user_message))

    async def _run_scenario(
        self,
        user_id: uuid.UUID,
        session_id: str,
        proposal: ScenarioProposal,
    ) -> tuple[str, dict] | None:
        """Run a validated scenario and build the response payload.

        Returns ``(message_text, event_payload)`` or ``None`` when the
        scenario type is unsupported and the normal pipeline should run.
        """
        from app.financial.artifacts.schemas import Artifact, ArtifactType

        service = ScenarioService(self._session)
        try:
            result = await service.run(
                user_id,
                proposal.scenario_type,
                proposal.parameters,
                session_id=session_id,
                missing_fields=proposal.missing_fields,
            )
        except ScenarioError as exc:
            # Unknown type → let the normal agent pipeline answer.
            from app.scenarios.scenario_types import ScenarioErrorCode

            if exc.code == ScenarioErrorCode.INVALID_SCENARIO:
                return None
            # Controlled failure — surface the safe message.
            return exc.message, {
                "scenarioError": {"code": exc.code.value, "message": exc.message}
            }

        artifact = Artifact(
            type=ArtifactType.SCENARIO_CARD.value,
            title=result.title,
            content=result.model_dump(mode="json", by_alias=True),
        )
        suggested_actions = [
            {
                "id": "open_scenario_lab",
                "label": "Open Scenario Lab",
                "type": "NAVIGATE",
                "route": "scenario_lab",
                "payload": {"scenarioType": result.scenario_type.value},
            }
        ]
        text = (
            result.clarification_question
            or result.summary
            or "Scenario computed."
        )
        return text, {
            "scenarioResult": result.model_dump(mode="json", by_alias=True),
            "artifacts": [artifact.model_dump(mode="json", by_alias=True)],
            "suggestedActions": suggested_actions,
        }

    async def _scenario_response(
        self,
        user_id: uuid.UUID,
        session_id: str,
        proposal: ScenarioProposal,
        start_time: float,
    ) -> CopilotChatResponse | None:
        """Synchronous scenario path — returns None if not a scenario."""
        from app.ai.schemas.copilot import SuggestedAction
        from app.financial.artifacts.schemas import Artifact
        from app.scenarios.scenario_types import ScenarioRunStatus

        result = await self._run_scenario(user_id, session_id, proposal)
        if result is None:
            return None

        text, payload = result
        latency = int((time.perf_counter() - start_time) * 1000)
        scenario = payload.get("scenarioResult")
        response_type = (
            ResponseType.SCENARIO_RESULT
            if scenario is not None
            else ResponseType.CLARIFICATION
        )
        if scenario and scenario.get("status") == ScenarioRunStatus.NEEDS_INPUT.value:
            response_type = ResponseType.CLARIFICATION

        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            text,
            intent="scenario_result",
            latency_ms=latency,
            agent_chain={
                "scenarioType": (scenario or {}).get("scenarioType"),
            },
        )
        return CopilotChatResponse(
            message_id=msg.id,
            message=text,
            response_type=response_type,
            summary=text,
            artifacts=[
                Artifact.model_validate(a) for a in payload.get("artifacts", [])
            ],
            suggested_actions=[
                SuggestedAction.model_validate(a)
                for a in payload.get("suggestedActions", [])
            ],
            scenario_result=scenario,
        )

    async def _run_action_preview(
        self,
        user_id: uuid.UUID,
        session_id: str,
        proposal: ActionProposal,
    ) -> tuple[str, dict] | None:
        """Validate the proposal and build a preview payload.

        Returns ``(message_text, event_payload)`` or ``None`` when the
        proposal is unsupported and the normal agent pipeline should run.
        """
        service = ActionService(self._session)
        try:
            preview = await service.preview(
                user_id, proposal, session_id=session_id,
            )
        except ActionError as exc:
            # Controlled failure — surface the safe message, never internals.
            text = exc.message
            return text, {"actionError": {"code": exc.code.value, "message": text}}

        if preview.status == ActionPreviewStatus.NOT_SUPPORTED:
            return None

        if preview.status == ActionPreviewStatus.NEEDS_INPUT:
            text = preview.clarification_question or (
                "I need a bit more detail to make that change."
            )
            return text, {"missingFields": preview.missing_fields}

        return self._preview_text_and_payload(preview)

    @staticmethod
    def _preview_text_and_payload(
        preview: ActionPreviewResponse,
    ) -> tuple[str, dict]:
        """Compose the preview message text and structured payload."""
        from app.financial.artifacts.schemas import Artifact, ArtifactType

        after = preview.after or {}
        pieces = [f"I can {preview.title.lower()} — {preview.entity_name}."]
        highlights = [
            f"{key}: {value}" for key, value in list(after.items())[:3]
            if value is not None
        ]
        if highlights:
            pieces.append(" ".join(highlights))
        pieces.append("Review the preview and confirm to apply the change.")
        text = " ".join(pieces)

        artifact = Artifact(
            type=ArtifactType.ACTION_PREVIEW_CARD.value,
            title=preview.title,
            content=preview.model_dump(by_alias=True),
        )
        return text, {
            "actionPreview": preview.model_dump(by_alias=True),
            "artifacts": [artifact.model_dump(by_alias=True)],
        }

    # ── Money Radar (Phase 3) ─────────────────────────────────────────

    async def _run_radar(
        self,
        user_id: uuid.UUID,
    ) -> tuple[str, dict] | None:
        """Run the deterministic radar scan; None on failure."""
        try:
            return await run_radar(self._session, user_id)
        except Exception:
            logger.exception(
                "Money Radar scan failed", extra={"user_id": str(user_id)}
            )
            return None

    async def _radar_response(
        self,
        user_id: uuid.UUID,
        session_id: str,
        start_time: float,
        plan: ControllerPlan | None = None,
    ) -> CopilotChatResponse | None:
        """Non-streaming radar response — mirrors ``_scenario_response``."""
        from app.ai.schemas.copilot import SuggestedAction
        from app.financial.artifacts.schemas import Artifact

        result = await self._run_radar(user_id)
        if result is None:
            return None
        text, payload = result
        latency = int((time.perf_counter() - start_time) * 1000)
        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            text,
            intent="money_radar",
            latency_ms=latency,
            agent_chain={"radar": True},
        )
        return CopilotChatResponse(
            message_id=msg.id,
            message=text,
            response_type=ResponseType.MONEY_RADAR_RESULT,
            summary=text,
            intent=CopilotIntent.MONEY_RADAR,
            confidence=plan.confidence if plan else 1.0,
            latency_ms=latency,
            model_used="money_radar_v1",
            data={"moneyRadar": payload["moneyRadar"]},
            artifacts=[
                Artifact.model_validate(a) for a in payload.get("artifacts", [])
            ],
            suggested_actions=[
                SuggestedAction.model_validate(a)
                for a in payload["suggestedActions"]
            ],
        )

    # ── Financial Action Plan (Phase 4) ──────────────────────────────────

    async def _run_plan(
        self,
        user_id: uuid.UUID,
    ) -> tuple[str, dict] | None:
        """Run the deterministic plan pipeline; None on failure."""
        try:
            return await run_plan(self._session, user_id)
        except Exception:
            logger.exception(
                "Action plan generation failed",
                extra={"user_id": str(user_id)},
            )
            return None

    async def _plan_response(
        self,
        user_id: uuid.UUID,
        session_id: str,
        start_time: float,
        plan: ControllerPlan | None = None,
    ) -> CopilotChatResponse | None:
        """Non-streaming plan response — mirrors ``_radar_response``."""
        from app.ai.schemas.copilot import SuggestedAction
        from app.financial.artifacts.schemas import Artifact

        result = await self._run_plan(user_id)
        if result is None:
            return None
        text, payload = result
        latency = int((time.perf_counter() - start_time) * 1000)
        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            text,
            intent="financial_action_plan",
            latency_ms=latency,
            agent_chain={"action_plan": True},
        )
        return CopilotChatResponse(
            message_id=msg.id,
            message=text,
            response_type=ResponseType.FINANCIAL_ACTION_PLAN_RESULT,
            summary=text,
            intent=CopilotIntent.FINANCIAL_ACTION_PLAN,
            confidence=plan.confidence if plan else 1.0,
            latency_ms=latency,
            model_used="action_plan_v1",
            data={"actionPlan": payload["actionPlan"]},
            artifacts=[
                Artifact.model_validate(a) for a in payload.get("artifacts", [])
            ],
            suggested_actions=[
                SuggestedAction.model_validate(a)
                for a in payload["suggestedActions"]
            ],
        )

    async def _action_preview_response(
        self,
        user_id: uuid.UUID,
        session_id: str,
        proposal: ActionProposal,
        plan: ControllerPlan,
        start_time: float,
    ) -> CopilotChatResponse | None:
        """Synchronous action path — returns None if not actionable."""
        from app.financial.artifacts.schemas import Artifact

        result = await self._run_action_preview(user_id, session_id, proposal)
        if result is None:
            return None

        text, payload = result
        latency = int((time.perf_counter() - start_time) * 1000)
        preview = payload.get("actionPreview")
        response_type = (
            ResponseType.ACTION_PREVIEW
            if preview is not None
            else ResponseType.CLARIFICATION
        )
        msg = await self._memory.save_message(
            user_id,
            session_id,
            "assistant",
            text,
            intent="action_preview",
            latency_ms=latency,
            agent_chain={"executionId": (preview or {}).get("executionId")},
        )
        return CopilotChatResponse(
            message_id=msg.id,
            message=text,
            response_type=response_type,
            summary=text,
            intent=to_copilot_intent(plan.intent),
            artifacts=[
                Artifact.model_validate(a) for a in payload.get("artifacts", [])
            ],
            action_preview=preview,
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

        # Tag responses built on partial data so the user knows some
        # details were unavailable.
        if financial_context.data_missing:
            build.message = self._tag_partial_data(
                build.message, financial_context.data_missing,
            )
            build.summary = build.message

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

        # Validation failed. If verified data exists and the response
        # contradicts it, keep the safe refusal. Otherwise fall back to
        # the generated answer tagged as general guidance.
        if validation.numerical_errors and financial_context.data_available:
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

        build.message = self._tag_general_guidance(build.message)
        build.summary = build.message
        build.response_type = ResponseType.EDUCATIONAL
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
            intent=to_copilot_intent(plan.intent),
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
            intent=to_copilot_intent(plan.intent),
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
    def _tag_partial_data(message: str, missing: list[str]) -> str:
        """Tag a response that was built without some financial domains."""
        domains = ", ".join(missing[:4])
        return (
            f"_Based on partial data — {domains} not available._\n\n"
            f"{message}"
        )

    @staticmethod
    def _tag_general_guidance(message: str) -> str:
        """Tag a response that could not be verified against user data."""
        return (
            "_General guidance — not verified against your financial data._\n\n"
            f"{message}"
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
            if isinstance(item, dict):
                role = item.get("role", "unknown")
                content = item.get("content", "")
            else:
                role = getattr(item, "role", "unknown")
                content = getattr(item, "content", "")
            lines.append(f"{role}: {content[:80]}")
        return "\n".join(lines)
