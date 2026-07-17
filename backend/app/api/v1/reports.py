from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.services.reports import ReportService
from app.utils.response import success_response

router = APIRouter(prefix="/reports", tags=["Reports"])


def get_report_service(session: AsyncSession = Depends(get_db_session)) -> ReportService:
    return ReportService(session)


@router.post("/weekly", response_model=dict, summary="Generate weekly report")
async def generate_weekly_report(
    request: Request,
    service: ReportService = Depends(get_report_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Generate and persist a weekly financial report."""
    user_uuid = uuid.UUID(user_id)
    report = await service.generate_weekly_report(user_uuid)
    request.state.user_id = user_uuid
    return success_response(data=report.report_json, message="Weekly report generated")


@router.get("/weekly/latest", response_model=dict, summary="Get latest weekly report")
async def get_latest_weekly_report(
    request: Request,
    service: ReportService = Depends(get_report_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the most recent weekly report for the user."""
    user_uuid = uuid.UUID(user_id)
    report = await service.get_latest_report(user_uuid)
    request.state.user_id = user_uuid
    if report is None:
        return success_response(data=None, message="No weekly report found")
    return success_response(data=report.report_json, message="Latest weekly report retrieved")
