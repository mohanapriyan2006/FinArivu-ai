"""Income service layer."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from models.income import Income
from repositories.income_repository import income_repository
from schemas.income import IncomeCreate, IncomeUpdate
from utils.exceptions import ResourceNotFoundError, DatabaseError


class IncomeService:
    """Service for income operations."""

    async def get_user_income(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Income]:
        """Get all income records for a user."""
        return await income_repository.get_by_user_id(session, user_id, skip, limit)

    async def create_income(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: IncomeCreate,
    ) -> Income:
        """Create a new income record."""
        try:
            item = await income_repository.create(
                session,
                {
                    "user_id": user_id,
                    "source": data.source,
                    "amount": data.amount,
                    "income_date": data.income_date,
                    "notes": data.notes,
                },
            )
            await session.commit()
            return item
        except Exception as exc:
            logger.error("Failed to create income", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to create income") from exc

    async def update_income(
        self,
        session: AsyncSession,
        income_id: uuid.UUID,
        user_id: uuid.UUID,
        data: IncomeUpdate,
    ) -> Income:
        """Update an existing income record."""
        try:
            item = await income_repository.get_by_id(session, income_id)
            if item is None or item.user_id != user_id:
                raise ResourceNotFoundError("Income not found")

            update_data = data.model_dump(exclude_unset=True)
            item = await income_repository.update(session, item, update_data)
            await session.commit()
            return item
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            logger.error("Failed to update income", extra={"income_id": str(income_id)})
            raise DatabaseError("Failed to update income") from exc

    async def delete_income(
        self,
        session: AsyncSession,
        income_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Delete an income record."""
        try:
            item = await income_repository.get_by_id(session, income_id)
            if item is None or item.user_id != user_id:
                raise ResourceNotFoundError("Income not found")

            await income_repository.delete(session, item)
            await session.commit()
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            logger.error("Failed to delete income", extra={"income_id": str(income_id)})
            raise DatabaseError("Failed to delete income") from exc


income_service = IncomeService()
