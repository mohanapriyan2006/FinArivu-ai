from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.categories import (
    ExpenseCategoryCreate,
    ExpenseCategoryListResponse,
    ExpenseCategoryResponse,
    ExpenseCategoryUpdate,
)
from app.services.categories import ExpenseCategoryService
from app.utils.response import success_response

router = APIRouter(prefix="/categories", tags=["Categories"])


def get_category_service(session: AsyncSession = Depends(get_db_session)) -> ExpenseCategoryService:
    return ExpenseCategoryService(session)


@router.get("", response_model=dict, summary="List expense categories")
async def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: str | None = Query(None, description="Search category name"),
    service: ExpenseCategoryService = Depends(get_category_service),
    _: str = Depends(get_current_user_id),
) -> dict:
    """List all expense categories, optionally filtered by name."""
    if search:
        items = await service._repo.search(
            term=search,
            fields=["name"],
            skip=skip,
            limit=limit,
        )
    else:
        items = await service.list(skip=skip, limit=limit, order_by="display_order", descending=False)
    total = len(items)  # categories are small; use in-memory count
    data = [ExpenseCategoryResponse.model_validate(c).model_dump() for c in items]
    return success_response(
        data=ExpenseCategoryListResponse(
            items=data,
            meta={"page": (skip // limit) + 1, "per_page": limit, "total": total, "pages": (total // limit) or 1},
        ).model_dump(),
        message="Categories retrieved successfully",
    )


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Create expense category")
async def create_category(
    data: ExpenseCategoryCreate,
    service: ExpenseCategoryService = Depends(get_category_service),
    _: str = Depends(get_current_user_id),
) -> dict:
    """Create a new expense category (admin logic can be added later)."""
    category = await service.create(data)
    return success_response(
        data=ExpenseCategoryResponse.model_validate(category).model_dump(),
        message="Category created successfully",
    )


@router.get("/{category_id}", response_model=dict, summary="Get category by ID")
async def get_category(
    category_id: uuid.UUID,
    service: ExpenseCategoryService = Depends(get_category_service),
    _: str = Depends(get_current_user_id),
) -> dict:
    """Fetch an expense category by its ID."""
    category = await service.get(category_id)
    return success_response(
        data=ExpenseCategoryResponse.model_validate(category).model_dump(),
        message="Category retrieved successfully",
    )


@router.put("/{category_id}", response_model=dict, summary="Update category")
async def update_category(
    category_id: uuid.UUID,
    data: ExpenseCategoryUpdate,
    service: ExpenseCategoryService = Depends(get_category_service),
    _: str = Depends(get_current_user_id),
) -> dict:
    """Update an expense category."""
    category = await service.update(category_id, data)
    return success_response(
        data=ExpenseCategoryResponse.model_validate(category).model_dump(),
        message="Category updated successfully",
    )


@router.delete("/{category_id}", response_model=dict, summary="Delete category")
async def delete_category(
    category_id: uuid.UUID,
    service: ExpenseCategoryService = Depends(get_category_service),
    _: str = Depends(get_current_user_id),
) -> dict:
    """Soft-delete an expense category."""
    await service.delete(category_id, soft=True)
    return success_response(message="Category deleted successfully")
