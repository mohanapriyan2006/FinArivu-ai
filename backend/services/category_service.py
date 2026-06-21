"""Category service layer."""

from sqlalchemy.ext.asyncio import AsyncSession

from models.expense_category import ExpenseCategory
from repositories.base import BaseRepository
from utils.exceptions import DatabaseError

category_repository = BaseRepository(ExpenseCategory)


class CategoryService:
    """Service for category operations."""

    async def get_all_categories(
        self,
        session: AsyncSession,
    ) -> list[ExpenseCategory]:
        """Get all expense categories."""
        try:
            return await category_repository.get_all(session)
        except Exception as exc:
            raise DatabaseError("Failed to fetch categories") from exc


category_service = CategoryService()
