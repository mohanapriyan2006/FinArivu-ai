"""Financial Action Plan API — /v1/action-plan.

All endpoints are JWT-protected and strictly user-scoped. Plan generation
never mutates financial records; mutations flow exclusively through the
Phase 1 Action Copilot preview/confirm/execute pipeline.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.action_plan.schemas import (
    AddInsightRequest,
    CompleteItemRequest,
    SnoozeItemRequest,
)
from app.action_plan.service import FinancialActionPlanService
from app.utils.response import success_response

router = APIRouter(prefix="/action-plan", tags=["Financial Action Plan"])


def get_plan_service(
    session: AsyncSession = Depends(get_db_session),
) -> FinancialActionPlanService:
    return FinancialActionPlanService(session)


@router.get("/current", response_model=dict, summary="Current week's plan")
async def current_plan(
    request: Request,
    refresh: Annotated[bool, Query(description="Rescan Radar first")] = False,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the current plan, generating/reconciling it if needed."""
    user_uuid = uuid.UUID(user_id)
    result = await service.get_or_generate_current(
        user_uuid, force_rescan=refresh
    )
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Financial action plan"
    )


@router.post("/generate", response_model=dict, summary="Force regenerate")
async def generate(
    request: Request,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Reconcile the current plan against a fresh Money Radar scan."""
    user_uuid = uuid.UUID(user_id)
    result = await service.get_or_generate_current(user_uuid, force_rescan=True)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Plan refreshed"
    )


@router.get("/history", response_model=dict, summary="Past plan periods")
async def history(
    request: Request,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=24)] = 12,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    rows = await service.get_history(user_uuid, skip=skip, limit=limit)
    request.state.user_id = user_uuid
    return success_response(
        data=[r.model_dump(mode="json") for r in rows],
        message="Plan history",
    )


@router.get("/items/{item_id}", response_model=dict, summary="Plan item detail")
async def get_item(
    item_id: uuid.UUID,
    request: Request,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    result = await service.get_item(user_uuid, item_id)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Plan item"
    )


@router.post(
    "/items/{item_id}/accept", response_model=dict, summary="Accept an item"
)
async def accept_item(
    item_id: uuid.UUID,
    request: Request,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """PENDING → IN_PROGRESS. Accept never mutates financial data."""
    user_uuid = uuid.UUID(user_id)
    result = await service.accept_item(user_uuid, item_id)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Item accepted"
    )


@router.post(
    "/items/{item_id}/snooze", response_model=dict, summary="Snooze an item"
)
async def snooze_item(
    item_id: uuid.UUID,
    body: SnoozeItemRequest,
    request: Request,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    result = await service.snooze_item(user_uuid, item_id, body.option.value)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Item snoozed"
    )


@router.post(
    "/items/{item_id}/dismiss", response_model=dict, summary="Dismiss an item"
)
async def dismiss_item(
    item_id: uuid.UUID,
    request: Request,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Dismiss the plan item — the source Radar insight is untouched."""
    user_uuid = uuid.UUID(user_id)
    result = await service.dismiss_item(user_uuid, item_id)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Item dismissed"
    )


@router.post(
    "/items/{item_id}/complete", response_model=dict, summary="Complete an item"
)
async def complete_item(
    item_id: uuid.UUID,
    body: CompleteItemRequest,
    request: Request,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Complete an item; optionally link a Phase 1 execution id."""
    user_uuid = uuid.UUID(user_id)
    result = await service.complete_item(
        user_uuid, item_id, execution_id=body.execution_id
    )
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Item completed"
    )


@router.post(
    "/items/from-insight",
    response_model=dict,
    summary="Add a radar insight to the plan",
)
async def add_from_insight(
    body: AddInsightRequest,
    request: Request,
    service: FinancialActionPlanService = Depends(get_plan_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Radar → Plan bridge — dedups via fingerprint if already present."""
    user_uuid = uuid.UUID(user_id)
    result = await service.add_insight_item(user_uuid, body.insight_id)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Added to plan"
    )
