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
    goals,
    income,
    liabilities,
    profiles,
    reports,
    users,
)
from app.ai.router import router as copilot_router
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
api_router.include_router(financial.router)
api_router.include_router(reports.router)
api_router.include_router(chat.router)
api_router.include_router(copilot_router)


@api_router.get("/health", tags=["Health"], summary="Service health check")
async def health_check() -> dict:
    """Return a standard health response."""
    return success_response(
        data={"status": "ok"},
        message="Service is healthy",
    )
