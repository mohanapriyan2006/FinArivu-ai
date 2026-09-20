"""Copilot action endpoints — preview / confirm / cancel / undo / history.

Mounted under ``/v1/copilot/actions`` via the API router. Every route is
JWT-authenticated and scoped to the caller's user id; the service layer is
authoritative for all validation.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.actions.action_types import ActionExecutionStatus
from app.actions.schemas import (
    ActionExecuteRequest,
    ActionPreviewRequest,
)
from app.actions.service import ActionService
from app.ai.memory.conversation_memory import ConversationMemory
from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.utils.response import success_response

router = APIRouter(prefix="/copilot/actions", tags=["Copilot Actions"])


def get_action_service(session: AsyncSession = Depends(get_db_session)) -> ActionService:
    return ActionService(session)


@router.post(
    "/preview",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Preview a proposed copilot action",
)
async def preview_action(
    request: Request,
    body: ActionPreviewRequest,
    service: ActionService = Depends(get_action_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Validate an action proposal and return a confirmation preview.

    Never mutates financial data. The returned ``executionId`` is the only
    handle the client may use to execute.
    """
    user_uuid = uuid.UUID(user_id)
    preview = await service.preview(
        user_uuid, body, session_id=body.session_id,
    )
    request.state.user_id = user_uuid
    return success_response(
        data=preview.model_dump(),
        message="Action preview created",
    )


@router.post(
    "/execute",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Confirm and execute a previewed copilot action",
)
async def execute_action(
    request: Request,
    body: ActionExecuteRequest,
    session: AsyncSession = Depends(get_db_session),
    service: ActionService = Depends(get_action_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Execute a confirmed, unexpired, non-stale action atomically.

    Idempotent — re-executing an already-completed execution returns the
    stored result without mutating again.
    """
    user_uuid = uuid.UUID(user_id)
    result = await service.execute(
        user_uuid, body.execution_id, session_id=body.session_id,
    )
    request.state.user_id = user_uuid

    # Keep the conversation coherent — append a compact result message.
    if body.session_id and result.status == ActionExecutionStatus.EXECUTED:
        memory = ConversationMemory(session)
        await memory.save_message(
            user_uuid,
            body.session_id,
            "assistant",
            result.message or result.title,
            intent="action_result",
            agent_chain={"executionId": str(result.execution_id)},
        )

    return success_response(
        data=result.model_dump(),
        message="Action executed",
    )


@router.post(
    "/{execution_id}/cancel",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Cancel a pending action preview",
)
async def cancel_action(
    execution_id: uuid.UUID,
    request: Request,
    service: ActionService = Depends(get_action_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Cancel an awaiting-confirmation action. No financial mutation."""
    result = await service.cancel(uuid.UUID(user_id), execution_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=result.model_dump(),
        message="Action cancelled",
    )


@router.post(
    "/{execution_id}/undo",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Undo an executed copilot action",
)
async def undo_action(
    execution_id: uuid.UUID,
    request: Request,
    service: ActionService = Depends(get_action_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Safely reverse an executed action where the operation supports it."""
    result = await service.undo(uuid.UUID(user_id), execution_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=result.model_dump(),
        message="Action undone",
    )


@router.get(
    "/history",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="List the user's copilot action history",
)
async def action_history(
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: str | None = Query(None, alias="status"),
    service: ActionService = Depends(get_action_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the authenticated user's copilot action history."""
    statuses = None
    if status_filter:
        try:
            statuses = [ActionExecutionStatus(status_filter.upper())]
        except ValueError:
            statuses = []
    items = await service.history(
        uuid.UUID(user_id), skip=offset, limit=limit, statuses=statuses,
    )
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=[item.model_dump() for item in items],
        message="Action history retrieved",
    )
