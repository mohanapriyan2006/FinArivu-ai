"""Scenario Lab endpoints — run / save / list / re-run / compare / delete.

Mounted under ``/v1/scenarios`` via the API router. Every route is
JWT-authenticated and scoped to the caller's user id. Scenario runs never
mutate financial data — apply-style changes must go through the Phase 1
action preview flow.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.scenarios.errors import ScenarioError
from app.scenarios.registry import SCENARIO_REGISTRY
from app.scenarios import schemas as S
from app.scenarios.service import ScenarioService
from app.utils.response import success_response

router = APIRouter(prefix="/scenarios", tags=["Scenario Lab"])


def get_scenario_service(
    session: AsyncSession = Depends(get_db_session),
) -> ScenarioService:
    return ScenarioService(session)


@router.get(
    "/types",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="List supported scenario types",
)
async def list_scenario_types(
    request: Request,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Scenario types the lab supports, with their parameter fields."""
    request.state.user_id = uuid.UUID(user_id)
    types = [
        {
            "type": d.type.value,
            "label": d.short_label or d.type.value.replace("_", " ").title(),
            "requiredParams": list(d.required_params),
            "paramLabels": d.param_labels,
            "affectedDomains": list(d.affected_domains),
            "applyOperation": d.apply_operation.value if d.apply_operation else None,
        }
        for d in SCENARIO_REGISTRY.values()
    ]
    return success_response(data=types, message="Scenario types retrieved")


@router.post(
    "/run",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Run a financial scenario",
)
async def run_scenario(
    request: Request,
    body: S.ScenarioRunRequest,
    service: ScenarioService = Depends(get_scenario_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Compute a deterministic simulation. Never mutates financial data."""
    user_uuid = uuid.UUID(user_id)
    response = await service.run(
        user_uuid,
        body.scenario_type,
        body.parameters,
        title=body.title,
        session_id=body.session_id,
        save=False,
    )
    request.state.user_id = user_uuid
    return success_response(
        data=response.model_dump(mode="json"),
        message="Scenario computed",
    )


@router.post(
    "/save",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Run and save a scenario",
)
async def save_scenario(
    request: Request,
    body: S.ScenarioSaveRequest,
    service: ScenarioService = Depends(get_scenario_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Run a scenario and persist it to the user's scenario history."""
    user_uuid = uuid.UUID(user_id)
    response = await service.run(
        user_uuid,
        body.scenario_type,
        body.parameters,
        title=body.title,
        session_id=body.session_id,
        save=True,
    )
    request.state.user_id = user_uuid
    return success_response(
        data=response.model_dump(mode="json"),
        message="Scenario saved",
    )


@router.post(
    "/compare",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Compare scenario outcomes",
)
async def compare_scenarios(
    request: Request,
    body: S.ScenarioCompareRequest,
    service: ScenarioService = Depends(get_scenario_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Run inline and/or saved scenarios side by side on aligned metrics."""
    response = await service.compare(uuid.UUID(user_id), body)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=response.model_dump(mode="json"),
        message="Scenario comparison computed",
    )


@router.get(
    "",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="List saved scenarios",
)
async def list_scenarios(
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: ScenarioService = Depends(get_scenario_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the authenticated user's saved scenario history."""
    items = await service.list_scenarios(
        uuid.UUID(user_id), skip=offset, limit=limit
    )
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=[i.model_dump(mode="json") for i in items],
        message="Scenarios retrieved",
    )


@router.get(
    "/{scenario_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get a saved scenario",
)
async def get_scenario(
    scenario_id: uuid.UUID,
    request: Request,
    service: ScenarioService = Depends(get_scenario_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return a saved scenario's full result snapshot."""
    response = await service.get_scenario(uuid.UUID(user_id), scenario_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=response.model_dump(mode="json"),
        message="Scenario retrieved",
    )


@router.post(
    "/{scenario_id}/rerun",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Re-run a saved scenario on current data",
)
async def rerun_scenario(
    scenario_id: uuid.UUID,
    request: Request,
    service: ScenarioService = Depends(get_scenario_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Re-run with the stored inputs against today's baseline."""
    response = await service.rerun(uuid.UUID(user_id), scenario_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=response.model_dump(mode="json"),
        message="Scenario re-run",
    )


@router.delete(
    "/{scenario_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Delete a saved scenario",
)
async def delete_scenario(
    scenario_id: uuid.UUID,
    request: Request,
    service: ScenarioService = Depends(get_scenario_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Soft-delete a saved scenario (user-scoped)."""
    await service.delete_scenario(uuid.UUID(user_id), scenario_id)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(data={"id": str(scenario_id)}, message="Scenario deleted")
