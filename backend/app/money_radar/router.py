"""Money Radar API — /v1/money-radar.

All endpoints are JWT-protected and strictly user-scoped. Scanning never
mutates financial records; insight actions hand off to the Phase 1/2
bridges rather than executing anything here.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.money_radar.service import MoneyRadarService
from app.utils.response import success_response

router = APIRouter(prefix="/money-radar", tags=["Money Radar"])


def get_radar_service(
    session: AsyncSession = Depends(get_db_session),
) -> MoneyRadarService:
    return MoneyRadarService(session)


def _csv(value: str | None) -> list[str] | None:
    if not value:
        return None
    return [v.strip() for v in value.split(",") if v.strip()]


@router.post("/scan", response_model=dict, summary="Run a Money Radar scan")
async def scan(
    request: Request,
    service: MoneyRadarService = Depends(get_radar_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Run all supported detectors and persist the reconciled insights."""
    user_uuid = uuid.UUID(user_id)
    result = await service.scan(user_uuid)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Radar scan complete"
    )


@router.get("/summary", response_model=dict, summary="Latest radar summary")
async def summary(
    request: Request,
    service: MoneyRadarService = Depends(get_radar_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the last scan's summary; scans on first use."""
    user_uuid = uuid.UUID(user_id)
    result = await service.get_summary(user_uuid)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Radar summary"
    )


@router.get("/insights", response_model=dict, summary="List radar insights")
async def list_insights(
    request: Request,
    status: Annotated[str | None, Query(description="CSV of statuses")] = None,
    severity: Annotated[str | None, Query(description="CSV of severities")] = None,
    insight_type: Annotated[str | None, Query(description="CSV of types")] = None,
    category: Annotated[str | None, Query(description="CSV of categories")] = None,
    entity_type: Annotated[str | None, Query()] = None,
    created_after: Annotated[datetime | None, Query()] = None,
    created_before: Annotated[datetime | None, Query()] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    service: MoneyRadarService = Depends(get_radar_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Filtered, paginated insight history for the authenticated user."""
    user_uuid = uuid.UUID(user_id)
    result = await service.list_insights(
        user_uuid,
        statuses=_csv(status),
        severities=_csv(severity),
        insight_types=_csv(insight_type),
        categories=_csv(category),
        entity_type=entity_type,
        created_after=created_after,
        created_before=created_before,
        skip=skip,
        limit=limit,
    )
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Radar insights"
    )


@router.get("/insights/{insight_id}", response_model=dict, summary="Get insight")
async def get_insight(
    insight_id: uuid.UUID,
    request: Request,
    service: MoneyRadarService = Depends(get_radar_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Full insight detail — evidence, source, freshness, actions."""
    user_uuid = uuid.UUID(user_id)
    result = await service.get_insight(user_uuid, insight_id)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Radar insight"
    )


@router.post(
    "/insights/{insight_id}/seen",
    response_model=dict,
    summary="Mark insight seen",
)
async def mark_seen(
    insight_id: uuid.UUID,
    request: Request,
    service: MoneyRadarService = Depends(get_radar_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """ACTIVE → SEEN. Idempotent."""
    user_uuid = uuid.UUID(user_id)
    result = await service.mark_seen(user_uuid, insight_id)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Insight marked seen"
    )


@router.post(
    "/insights/{insight_id}/dismiss",
    response_model=dict,
    summary="Dismiss insight",
)
async def dismiss(
    insight_id: uuid.UUID,
    request: Request,
    service: MoneyRadarService = Depends(get_radar_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """ACTIVE/SEEN → DISMISSED. Idempotent."""
    user_uuid = uuid.UUID(user_id)
    result = await service.dismiss(user_uuid, insight_id)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Insight dismissed"
    )
