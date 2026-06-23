"""Financial Health API routes."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from core.database import get_db
from schemas.financial_health import FinancialHealthCurrentResponse, FinancialHealthScoreResponse
from services.financial_health_service import financial_health_service
from services.user_service import user_service
from utils.response import success_response

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["Financial Health"])


@router.get("/financial-health", status_code=status.HTTP_200_OK)
async def get_financial_health(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get current financial health score."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    score_data = await financial_health_service.get_current_score(session, user.id)
    return success_response(
        data=FinancialHealthCurrentResponse.model_validate(score_data),
        message="Financial health score retrieved",
    )


@router.get("/financial-health/history", status_code=status.HTTP_200_OK)
async def get_financial_health_history(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get historical financial health scores."""
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )
    items = await financial_health_service.get_score_history(session, user.id, skip, limit)
    return success_response(
        data=[FinancialHealthScoreResponse.model_validate(item) for item in items],
        message="Financial health history retrieved",
    )


@router.post("/financial-health/recalculate", status_code=status.HTTP_201_CREATED)
async def recalculate_financial_health(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Recalculate and save financial health score.

    In a full implementation, this would accept income/expense/asset data
    and compute a fresh score. For now, it computes with available data.
    """
    user = await user_service.sync_user(
        session, current_user["user_id"], current_user["email"]
    )

    from engines.financial_health_engine import FinancialHealthInput
    from decimal import Decimal

    data = FinancialHealthInput(
        monthly_income=Decimal("0"),
        monthly_expenses=Decimal("0"),
        emergency_assets=Decimal("0"),
        total_debt=Decimal("0"),
        annual_income=Decimal("0"),
        goals=[],
        budget_overall_usage=0.0,
    )

    item = await financial_health_service.recalculate_and_save(session, user.id, data)
    return success_response(
        data=FinancialHealthScoreResponse.model_validate(item),
        message="Financial health score recalculated",
    )
