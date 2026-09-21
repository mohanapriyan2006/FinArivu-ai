from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    assets,
    auth,
    budgets,
    categories,
    chat,
    expenses,
    financial,
    financial_profile,
    goals,
    income,
    insights,
    liabilities,
    profiles,
    reports,
    users,
)
from app.actions.router import router as copilot_actions_router
from app.ai.router import router as copilot_router
from app.action_plan.router import router as action_plan_router
from app.data_ingestion.router import router as imports_router
from app.money_radar.router import router as money_radar_router
from app.scenarios.router import router as scenarios_router
from app.utils.response import success_response

api_router = APIRouter(prefix="/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(profiles.router)
api_router.include_router(categories.router)
api_router.include_router(income.router)
api_router.include_router(expenses.router)
api_router.include_router(budgets.router)
api_router.include_router(goals.router)
api_router.include_router(assets.router)
api_router.include_router(liabilities.router)
api_router.include_router(financial_profile.router)
api_router.include_router(financial.router)
api_router.include_router(insights.router)
api_router.include_router(reports.router)
api_router.include_router(chat.router)
api_router.include_router(copilot_router)
api_router.include_router(copilot_actions_router)
api_router.include_router(scenarios_router)
api_router.include_router(money_radar_router)
api_router.include_router(action_plan_router)
api_router.include_router(imports_router)


@api_router.get("/health", tags=["Health"], summary="Service health check")
async def health_check() -> dict:
    """Return a standard health response."""
    return success_response(
        data={"status": "ok"},
        message="Service is healthy",
    )
