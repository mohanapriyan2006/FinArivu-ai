"""API v1 router aggregation."""

from fastapi import APIRouter

from app.users.router import router as users_router
from app.profile.router import router as profile_router
from app.income.router import router as income_router
from app.categories.router import router as categories_router
from app.expenses.router import router as expenses_router
from app.dashboard.router import router as dashboard_router
from app.budget.router import router as budget_router
from app.financial_health.router import router as financial_health_router
from app.goals.router import router as goals_router

api_router = APIRouter()

api_router.include_router(users_router, prefix="/v1/users")
api_router.include_router(profile_router, prefix="/v1")
api_router.include_router(income_router, prefix="/v1")
api_router.include_router(categories_router, prefix="/v1")
api_router.include_router(expenses_router, prefix="/v1")
api_router.include_router(dashboard_router, prefix="/v1")
api_router.include_router(budget_router, prefix="/v1")
api_router.include_router(financial_health_router, prefix="/v1")
api_router.include_router(goals_router, prefix="/v1")
