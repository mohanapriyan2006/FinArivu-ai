from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.financial_profile import (
    AboutYouUpdate,
    CreditCardUpdate,
    ExpenseProfileUpdate,
    FixedDepositUpdate,
    GoalUpdate,
    IncomeProfileUpdate,
    InsuranceUpdate,
    InvestmentUpdate,
    LoanUpdate,
    ProfileCompletionResponse,
    SavingsUpdate,
    TaxProfileUpdate,
)
from app.services.financial_profile import FinancialProfileService
from app.utils.response import success_response

router = APIRouter(prefix="/financial-profile", tags=["Financial Profile"])


SECTION_SCHEMAS: dict[str, type[Any]] = {
    "aboutYou": AboutYouUpdate,
    "income": IncomeProfileUpdate,
    "expenses": ExpenseProfileUpdate,
    "savings": SavingsUpdate,
    "investments": InvestmentUpdate,
    "fixedDeposits": FixedDepositUpdate,
    "loans": LoanUpdate,
    "creditCards": CreditCardUpdate,
    "goals": GoalUpdate,
    "insurance": InsuranceUpdate,
    "taxProfile": TaxProfileUpdate,
}


def get_financial_profile_service(
    session: AsyncSession = Depends(get_db_session),
) -> FinancialProfileService:
    return FinancialProfileService(session)


@router.get("", response_model=dict, summary="Get full financial profile")
async def get_full_profile(
    request: Request,
    service: FinancialProfileService = Depends(get_financial_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the complete financial profile for the authenticated user."""
    data = await service.get_full_profile(uuid.UUID(user_id))
    request.state.user_id = uuid.UUID(user_id)
    return success_response(data=data, message="Financial profile retrieved")


@router.get("/completion", response_model=dict, summary="Get profile completion")
async def get_completion(
    request: Request,
    service: FinancialProfileService = Depends(get_financial_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return calculated profile completion for the authenticated user."""
    data = await service.get_completion(uuid.UUID(user_id))
    request.state.user_id = uuid.UUID(user_id)
    return success_response(data=ProfileCompletionResponse.model_validate(data).model_dump(), message="Completion retrieved")


@router.get("/summary", response_model=dict, summary="Get financial summary")
async def get_summary(
    request: Request,
    service: FinancialProfileService = Depends(get_financial_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return a high-level financial summary for the authenticated user."""
    data = await service.get_summary(uuid.UUID(user_id))
    request.state.user_id = uuid.UUID(user_id)
    return success_response(data=data, message="Financial summary retrieved")


@router.put("/{section}", response_model=dict, summary="Update a financial profile section")
async def update_section(
    section: str,
    data: dict[str, Any],
    request: Request,
    service: FinancialProfileService = Depends(get_financial_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Create or update a single onboarding section for the authenticated user."""
    if section not in SECTION_SCHEMAS:
        return success_response(
            data={},
            message=f"Unknown section: {section}",
            status_code=400,
        )
    schema = SECTION_SCHEMAS[section]
    payload = schema.model_validate(data)
    result = await service.update_section(uuid.UUID(user_id), section, payload)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(data=result, message=f"{section} updated")
