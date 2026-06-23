"""Goal API routes."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from schemas.goal import GoalCreate, GoalResponse, GoalUpdate, GoalSummary
from services.goal_service import goal_service
from services.user_service import user_service
from utils.response import success_response

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["Goals"])


@router.get("/goals", response_model=List[GoalResponse], status_code=status.HTTP_200_OK)
async def list_goals(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all goals for the current user."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    items = await goal_service.get_user_goals(session, user.id, skip, limit)
    return [GoalResponse.model_validate(item) for item in items]


@router.post("/goals", status_code=status.HTTP_201_CREATED)
async def create_goal(
    data: GoalCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create a new goal."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    item = await goal_service.create_goal(session, user.id, data)
    return success_response(
        data=GoalResponse.model_validate(item),
        message="Goal created successfully",
    )


@router.put("/goals/{goal_id}", status_code=status.HTTP_200_OK)
async def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Update an existing goal."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    item = await goal_service.update_goal(session, goal_id, user.id, data)
    return success_response(
        data=GoalResponse.model_validate(item),
        message="Goal updated successfully",
    )


@router.delete("/goals/{goal_id}", status_code=status.HTTP_200_OK)
async def delete_goal(
    goal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a goal."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    await goal_service.delete_goal(session, goal_id, user.id)
    return success_response(message="Goal deleted successfully")


@router.get("/goals/summary", status_code=status.HTTP_200_OK)
async def get_goals_summary(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get goal summary statistics."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    summary = await goal_service.get_summary(session, user.id)
    return success_response(
        data=GoalSummary.model_validate(summary),
        message="Goal summary retrieved",
    )
