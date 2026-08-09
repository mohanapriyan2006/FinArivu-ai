from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.insights import InsightsResponse
from app.services.insights import InsightsService
from app.utils.response import success_response

router = APIRouter(prefix="/insights", tags=["Insights"])


def get_insights_service(
    session: AsyncSession = Depends(get_db_session),
) -> InsightsService:
    return InsightsService(session)


@router.get("", response_model=dict, summary="Get dynamic insights")
async def get_insights(
    request: Request,
    service: InsightsService = Depends(get_insights_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the full dynamic Insights payload for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    result = await service.get_insights(user_uuid)
    request.state.user_id = user_uuid
    return success_response(data=result.model_dump(), message="Insights retrieved")
