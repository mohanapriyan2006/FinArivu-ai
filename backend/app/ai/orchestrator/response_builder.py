"""Response builder — merges agent results into a human-readable response.

Takes the raw ``AgentResult`` list, calls the AI provider to generate a
natural-language explanation, and produces the final ``CopilotChatResponse``.
"""

from __future__ import annotations

import json
import time
from typing import Any, AsyncIterator

from app.ai.orchestrator.action_decision_engine import ActionDecisionEngine
from app.ai.orchestrator.response_decision_engine import ResponseDecision, ResponseDecisionEngine
from app.ai.prompts.system_prompt import COPILOT_SYSTEM_PROMPT
from app.ai.providers.base import AIProviderResponse, BaseAIProvider
from app.ai.schemas import (
    AgentResult,
    Artifact,
    ChatMetadata,
    CopilotChatResponse,
    CopilotIntent,
    FollowUpQuestion,
    PlannerOutput,
    Recommendation,
    ResponseStyle,
    ResponseType,
    StreamEvent,
    StreamEventType,
    SuggestedAction,
)
from app.core.logger import logger
from app.financial.artifacts.artifact_builder import ArtifactBuilder


# ── Explanation prompt ────────────────────────────────────────────────────

_EXPLANATION_TEMPLATE: str = """\
The user asked: "{user_message}"

{contextual_note}

The following data was computed by FinArivu's financial engines:

{agent_data}

Using ONLY the data above, write a clear, {style} response for the user.
Do NOT invent numbers. Do NOT add a disclaimer — the system handles that.
Keep the response under 300 words.
"""


from dataclasses import dataclass


@dataclass
class BuildResult:
    """Full build result including artifacts and metadata."""

    message: str
    summary: str
    merged_data: dict[str, Any]
    ai_response: AIProviderResponse | None
    artifacts: list[Artifact]
    recommendations: list[Recommendation]
    follow_up_questions: list[FollowUpQuestion]
    suggested_actions: list[SuggestedAction]
    metadata: ChatMetadata
    response_type: ResponseType = ResponseType.SIMPLE_ANSWER


class ResponseBuilder:
    """Merges agent results and generates the final AI explanation."""

    def __init__(self, provider: BaseAIProvider) -> None:
        self._provider = provider
        self._decision_engine = ResponseDecisionEngine()
        self._action_engine = ActionDecisionEngine()

    async def build(
        self,
        user_message: str,
        plan: PlannerOutput,
        results: list[AgentResult],
        decision: ResponseDecision | None = None,
    ) -> tuple[str, dict[str, Any], AIProviderResponse | None]:
        """Build the final response text and merged data dict.

        Returns ``(message_text, merged_data, ai_response_or_none)``.
        """
        merged_data = self._merge_data(results)
        agent_summaries = self._format_summaries(results)

        if decision is None:
            decision = self._decision_engine.decide(plan.intent.value, results, user_message)

        style = plan.response_style.value if hasattr(plan.response_style, "value") else str(plan.response_style)
        contextual_note = self._contextual_note(decision)

        prompt = _EXPLANATION_TEMPLATE.format(
            user_message=user_message,
            contextual_note=contextual_note,
            agent_data=agent_summaries,
            style=style,
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
            if decision.missing_data:
                fallback_text = (
                    f"I don't have enough data to answer that yet. "
                    f"Could you share your {', '.join(decision.missing_fields)}?"
                )
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

        decision = self._decision_engine.decide(plan.intent.value, results, user_message)
        style = plan.response_style.value if hasattr(plan.response_style, "value") else str(plan.response_style)
        contextual_note = self._contextual_note(decision)

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
            contextual_note=contextual_note,
            agent_data=agent_summaries,
            style=style,
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

    async def build_full(
        self,
        user_message: str,
        plan: PlannerOutput,
        results: list[AgentResult],
        start_time: float,
    ) -> BuildResult:
        """Build the full enriched response with artifacts and metadata."""
        decision = self._decision_engine.decide(plan.intent.value, results, user_message)
        actions, follow_ups = self._action_engine.build(plan.intent.value, results)

        message, merged_data, ai_response = await self.build(
            user_message, plan, results, decision,
        )

        summary = self._build_summary(message)
        artifacts = self._build_artifacts(results, decision)

        elapsed = int((time.perf_counter() - start_time) * 1000)
        metadata = ChatMetadata(
            intent=plan.intent.value,
            agents_used=[r.agent_name for r in results if not r.error],
            provider=ai_response.provider_name if ai_response else None,
            model=ai_response.model if ai_response else None,
            execution_time_ms=elapsed,
        )

        return BuildResult(
            message=message,
            summary=summary,
            merged_data=merged_data,
            ai_response=ai_response,
            artifacts=artifacts,
            recommendations=[],
            follow_up_questions=follow_ups if decision.show_follow_up else [],
            suggested_actions=actions if decision.show_actions else [],
            metadata=metadata,
            response_type=decision.response_type,
        )

    @staticmethod
    def _contextual_note(decision: ResponseDecision) -> str:
        """Return a short note for the LLM prompt based on the response decision."""
        if decision.missing_data:
            return (
                f"Note: We are missing the user's {', '.join(decision.missing_fields)}. "
                f"Ask them to provide this information. Do not invent values."
            )
        if decision.response_type == ResponseType.EDUCATIONAL:
            return (
                "Note: This is an educational question. Answer in plain Indian English "
                "without inventing numbers or giving personalised investment advice."
            )
        if decision.response_type == ResponseType.SIMPLE_ANSWER:
            return "Note: Keep the answer short and friendly."
        if decision.response_type == ResponseType.CLARIFICATION:
            return "Note: We don't have the required data. Ask the user for it. Do not invent."
        return ""

    @staticmethod
    def _build_summary(message: str, max_length: int = 160) -> str:
        """Return a short summary from the first sentence or paragraph."""
        first = message.split(". ")[0]
        if len(first) > max_length:
            first = first[:max_length].rsplit(" ", 1)[0] + "..."
        return first

    @staticmethod
    def _build_artifacts(results: list[AgentResult], decision: ResponseDecision) -> list[Artifact]:
        """Map relevant agent results to one typed artifact for the frontend."""
        if not decision.show_artifact or not decision.artifact_type:
            return []
        agent_results = [
            {"agent_name": r.agent_name, "data": r.data, "error": r.error} for r in results
        ]
        built = ArtifactBuilder.build_artifact_list(
            agent_results, allowed_types=[decision.artifact_type]
        )
        return [Artifact(**a.model_dump()) for a in built]

    @staticmethod
    def _extract_recommendations(merged_data: dict[str, Any]) -> list[Recommendation]:
        """Pull recommendations from the RecommendationAgent output."""
        rec_data = merged_data.get("RecommendationAgent", {}).get("recommendations", [])
        return [Recommendation(**r) for r in rec_data if isinstance(r, dict)]

    @staticmethod
    def _extract_follow_ups(merged_data: dict[str, Any]) -> list[FollowUpQuestion]:
        """Pull follow-up questions from the InsightAgent output."""
        follow_data = merged_data.get("InsightAgent", {}).get("follow_up_questions", [])
        return [FollowUpQuestion(**f) for f in follow_data if isinstance(f, dict)]

    @staticmethod
    def _extract_suggested_actions(merged_data: dict[str, Any]) -> list[SuggestedAction]:
        """Pull suggested actions from the InsightAgent output."""
        action_data = merged_data.get("InsightAgent", {}).get("suggested_actions", [])
        return [SuggestedAction(**a) for a in action_data if isinstance(a, dict)]

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
