"""FastAPI router for the AI Copilot endpoints.

All routes are mounted under ``/api/v1/copilot`` and require JWT
authentication via the existing ``get_current_user_id`` dependency.
"""

from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.ai.schemas import (
    CopilotChatRequest,
    CopilotFeedbackRequest,
)
from app.ai.controller import CopilotController
from app.ai.metrics import ai_metrics
from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.models.ai_feedback import AIFeedback
from app.utils.response import success_response

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])


# ── Dependency ────────────────────────────────────────────────────────────

def _get_copilot_controller(
    session: AsyncSession = Depends(get_db_session),
) -> CopilotController:
    return CopilotController(session)


# ── Chat (synchronous response) ──────────────────────────────────────────

@router.post(
    "/chat",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Send a message to the AI Copilot",
)
async def copilot_chat(
    request: Request,
    body: CopilotChatRequest,
    controller: CopilotController = Depends(_get_copilot_controller),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Process a user message through the multi-agent AI Copilot pipeline."""
    user_uuid = uuid.UUID(user_id)
    response = await controller.chat(user_uuid, body)
    request.state.user_id = user_uuid
    return success_response(
        data=response.model_dump(),
        message="Message processed",
    )


# ── Chat (streaming SSE response) ────────────────────────────────────────

@router.post(
    "/chat/stream",
    status_code=status.HTTP_200_OK,
    summary="Stream a response from the AI Copilot (SSE)",
)
async def copilot_chat_stream(
    request: Request,
    body: CopilotChatRequest,
    controller: CopilotController = Depends(_get_copilot_controller),
    user_id: str = Depends(get_current_user_id),
) -> EventSourceResponse:
    """Stream copilot response tokens via Server-Sent Events."""
    user_uuid = uuid.UUID(user_id)
    request.state.user_id = user_uuid

    async def event_generator():
        async for event in controller.chat_stream(user_uuid, body):
            yield {
                "event": event.event_type.value,
                "data": json.dumps(event.model_dump(), default=str),
            }

    return EventSourceResponse(event_generator())


# ── Feedback ──────────────────────────────────────────────────────────────

@router.post(
    "/feedback",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback on a copilot response",
)
async def copilot_feedback(
    body: CopilotFeedbackRequest,
    session: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Store user feedback (rating + comment) for a copilot message."""
    feedback = AIFeedback(
        message_id=body.message_id,
        user_id=uuid.UUID(user_id),
        rating=body.rating,
        comment=body.comment or None,
    )
    session.add(feedback)
    await session.flush()
    await session.refresh(feedback)

    return success_response(
        data={"id": str(feedback.id)},
        message="Feedback recorded",
    )


# ── History ───────────────────────────────────────────────────────────────

@router.get(
    "/history",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get copilot conversation history",
)
async def copilot_history(
    session_id: str = Query(..., min_length=1, max_length=255),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    controller: CopilotController = Depends(_get_copilot_controller),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return paginated conversation history for a session."""
    messages = await controller.get_history(
        uuid.UUID(user_id), session_id, skip=skip, limit=limit,
    )
    return success_response(
        data=messages,
        message="History retrieved",
    )


# ── Health ────────────────────────────────────────────────────────────────

@router.get(
    "/health",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="AI provider health check",
)
async def copilot_health(
    controller: CopilotController = Depends(_get_copilot_controller),
) -> dict:
    """Check whether the AI provider is reachable and responsive."""
    result = await controller.check_health()
    return success_response(
        data=result.model_dump(),
        message="Health check complete",
    )


# ── Metrics ────────────────────────────────────────────────────────────────

@router.get(
    "/metrics",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get AI provider metrics",
)
async def copilot_metrics() -> dict:
    """Return in-memory provider request, token, and error metrics."""
    return success_response(
        data=ai_metrics.summary(),
        message="Metrics retrieved",
    )
