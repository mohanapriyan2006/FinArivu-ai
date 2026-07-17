from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.exceptions import AuthorizationError
from app.schemas.goals import GoalCreate, GoalListResponse, GoalResponse, GoalUpdate
from app.services.goals import GoalService
from app.utils.response import success_response

router = APIRouter(prefix="/goals", tags=["Goals"])


def get_goal_service(session: AsyncSession = Depends(get_db_session)) -> GoalService:
    return GoalService(session)


@router.get("", response_model=dict, summary="List goals")
async def list_goals(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    service: GoalService = Depends(get_goal_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """List financial goals for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    items = await service.list_for_user(user_uuid, skip=skip, limit=limit, status=status)
    request.state.user_id = user_uuid
    return success_response(
        data=GoalListResponse(
            items=[GoalResponse.model_validate(g).model_dump() for g in items],
            meta={"page": (skip // limit) + 1, "per_page": limit, "total": len(items), "pages": 1},
        ).model_dump(),
        message="Goals retrieved successfully",
    )


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Create goal")
async def create_goal(
    request: Request,
    data: GoalCreate,
    service: GoalService = Depends(get_goal_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Create a financial goal."""
    user_uuid = uuid.UUID(user_id)
    goal = await service.create_for_user(user_uuid, data)
    request.state.user_id = user_uuid
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(),
        message="Goal created successfully",
    )


@router.get("/{goal_id}", response_model=dict, summary="Get goal by ID")
async def get_goal(
    goal_id: uuid.UUID,
    request: Request,
    service: GoalService = Depends(get_goal_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch a goal by ID."""
    goal = await service.get(goal_id)
    if goal.user_id != uuid.UUID(user_id):
        raise AuthorizationError("You can only access your own goals")
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(),
        message="Goal retrieved successfully",
    )


@router.put("/{goal_id}", response_model=dict, summary="Update goal")
async def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    request: Request,
    service: GoalService = Depends(get_goal_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Update a goal."""
    goal = await service.update_for_user(uuid.UUID(user_id), goal_id, data)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(),
        message="Goal updated successfully",
    )


@router.delete("/{goal_id}", response_model=dict, summary="Delete goal")
async def delete_goal(
    goal_id: uuid.UUID,
    request: Request,
    service: GoalService = Depends(get_goal_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Soft-delete a goal."""
    await service.delete_for_user(uuid.UUID(user_id), goal_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(message="Goal deleted successfully")
