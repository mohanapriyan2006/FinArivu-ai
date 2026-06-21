"""Insights API routes."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.config import settings
from core.database import get_db
from schemas.insight import InsightResponse, InsightUpdate
from services.insight_service import insight_service
from services.user_service import user_service
from utils.response import success_response

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["Insights"])


@router.get("/insights", response_model=List[InsightResponse], status_code=status.HTTP_200_OK)
async def list_insights(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all insights for the current user."""
    user = await user_service.sync_user(
        session, current_user["clerk_id"], current_user["email"]
    )
    items = await insight_service.get_user_insights(session, user.id, skip, limit)
    return [InsightResponse.model_validate(item) for item in items]


@router.get("/insights/unread", status_code=status.HTTP_200_OK)
async def get_unread_insights(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get unread insights for the current user."""
    user = await user_service.sync_user(
        session, current_user["clerk_id"], current_user["email"]
    )
    items = await insight_service.get_unread_insights(session, user.id)
    return success_response(
        data=[InsightResponse.model_validate(item) for item in items],
        message="Unread insights retrieved",
    )


@router.patch("/insights/{insight_id}", status_code=status.HTTP_200_OK)
async def mark_insight_read(
    insight_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Mark an insight as read."""
    user = await user_service.sync_user(
        session, current_user["clerk_id"], current_user["email"]
    )
    item = await insight_service.mark_insight_read(session, insight_id, user.id)
    return success_response(
        data=InsightResponse.model_validate(item),
        message="Insight marked as read",
    )


@router.post("/insights/mark-all-read", status_code=status.HTTP_200_OK)
async def mark_all_insights_read(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Mark all insights as read."""
    user = await user_service.sync_user(
        session, current_user["clerk_id"], current_user["email"]
    )
    count = await insight_service.mark_all_read(session, user.id)
    return success_response(
        data={"marked_read": count},
        message="All insights marked as read",
    )
