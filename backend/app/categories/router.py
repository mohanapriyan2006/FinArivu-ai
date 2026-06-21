"""Expense category API routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from schemas.category import CategoryResponse
from services.category_service import category_service
from utils.response import success_response

router = APIRouter(tags=["Categories"])


@router.get("/categories", status_code=status.HTTP_200_OK)
async def list_categories(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all expense categories."""
    items = await category_service.get_all_categories(session)
    return success_response(
        data=[CategoryResponse.model_validate(item) for item in items],
        message="Categories retrieved",
    )
