"""Dashboard API routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from services.dashboard_service import dashboard_service
from services.user_service import user_service
from utils.response import success_response

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard", status_code=status.HTTP_200_OK)
async def get_dashboard(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get dashboard summary for the current user."""
    user = await user_service.sync_user(
        session, current_user["clerk_id"], current_user["email"]
    )
    summary = await dashboard_service.get_summary(session, user.id)
    return success_response(data=summary, message="Dashboard summary retrieved")
