from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.financial import (
    BudgetAnalysisResponse,
    GoalProjectionsResponse,
    HealthScoreResponse,
    NetWorthResponse,
    RetirementRequest,
    RetirementResponse,
    TaxRequest,
    TaxResponse,
)
from app.services.financial import FinancialService
from app.utils.response import success_response

router = APIRouter(prefix="/financial", tags=["Financial"])


def get_financial_service(session: AsyncSession = Depends(get_db_session)) -> FinancialService:
    return FinancialService(session)


@router.get("/health-score", response_model=dict, summary="Get financial health score")
async def health_score(
    request: Request,
    year: int | None = Query(None, ge=2000, le=2100),
    month: int | None = Query(None, ge=1, le=12),
    service: FinancialService = Depends(get_financial_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Compute the financial health score for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    result = await service.calculate_health_score(user_uuid, year=year, month=month)
    request.state.user_id = user_uuid
    return success_response(data=result.model_dump(), message="Health score computed")


@router.get("/dashboard", response_model=dict, summary="Get dashboard summary")
async def dashboard(
    request: Request,
    service: FinancialService = Depends(get_financial_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the aggregated dashboard data for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    result = await service.get_dashboard(user_uuid)
    request.state.user_id = user_uuid
    return success_response(data=result.model_dump(), message="Dashboard retrieved successfully")


@router.get("/net-worth", response_model=dict, summary="Get net worth summary")
async def net_worth(
    request: Request,
    service: FinancialService = Depends(get_financial_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Compute the net worth for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    result = await service.calculate_net_worth(user_uuid)
    request.state.user_id = user_uuid
    return success_response(data=result.model_dump(), message="Net worth computed")


@router.get("/budget-analysis", response_model=dict, summary="Get budget analysis")
async def budget_analysis(
    request: Request,
    year: int | None = Query(None, ge=2000, le=2100),
    month: int | None = Query(None, ge=1, le=12),
    service: FinancialService = Depends(get_financial_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Analyze budgets vs actual spending."""
    user_uuid = uuid.UUID(user_id)
    result = await service.analyze_budget(user_uuid, year=year, month=month)
    request.state.user_id = user_uuid
    return success_response(data=result.model_dump(), message="Budget analysis computed")


@router.get("/goal-projections", response_model=dict, summary="Get goal projections")
async def goal_projections(
    request: Request,
    service: FinancialService = Depends(get_financial_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Project monthly contributions for user goals."""
    user_uuid = uuid.UUID(user_id)
    result = await service.project_goals(user_uuid)
    request.state.user_id = user_uuid
    return success_response(data=result.model_dump(), message="Goal projections computed")


@router.post("/tax", response_model=dict, summary="Calculate income tax")
async def tax_calculation(
    request: Request,
    payload: TaxRequest,
    service: FinancialService = Depends(get_financial_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Calculate income tax under old or new regime."""
    result = FinancialService.calculate_tax(payload)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(data=result.model_dump(), message="Tax calculated")


@router.post("/retirement", response_model=dict, summary="Project retirement corpus")
async def retirement_projection(
    request: Request,
    payload: RetirementRequest,
    service: FinancialService = Depends(get_financial_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Project retirement expenses and required corpus."""
    result = FinancialService.project_retirement(payload.model_dump())
    request.state.user_id = uuid.UUID(user_id)
    return success_response(data=result.model_dump(), message="Retirement projection computed")
