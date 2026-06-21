"""Insight service layer."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from engines.insights_engine import InsightInput, InsightsEngine
from models.insight import Insight
from repositories.insight_repository import insight_repository
from schemas.insight import InsightCreate
from utils.exceptions import DatabaseError, ResourceNotFoundError


class InsightService:
    """Service for insight operations."""

    async def get_user_insights(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Insight]:
        """Get all insights for a user."""
        return await insight_repository.get_by_user_id(session, user_id, skip, limit)

    async def get_unread_insights(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> list[Insight]:
        """Get unread insights for a user."""
        return await insight_repository.get_unread_by_user(session, user_id)

    async def mark_insight_read(
        self,
        session: AsyncSession,
        insight_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Insight:
        """Mark a single insight as read."""
        try:
            item = await insight_repository.get_by_id_with_owner(
                session, insight_id, user_id
            )
            if item is None:
                raise ResourceNotFoundError("Insight not found")

            item = await insight_repository.update(session, item, {"is_read": True})
            await session.commit()
            return item
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            logger.error("Failed to mark insight read", extra={"insight_id": str(insight_id)})
            raise DatabaseError("Failed to mark insight as read") from exc

    async def mark_all_read(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> int:
        """Mark all insights as read."""
        try:
            count = await insight_repository.mark_all_read(session, user_id)
            await session.commit()
            return count
        except Exception as exc:
            logger.error("Failed to mark all insights read", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to mark all insights as read") from exc

    async def generate_insights(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: InsightInput,
    ) -> list[Insight]:
        """Generate and save insights for a user."""
        try:
            results = InsightsEngine.generate(data)
            created: list[Insight] = []
            for result in results:
                item = await insight_repository.create(
                    session,
                    {
                        "user_id": user_id,
                        "category": result.category,
                        "title": result.title,
                        "description": result.description,
                        "priority": result.priority,
                        "action": result.action,
                        "is_read": False,
                    },
                )
                created.append(item)
            await session.commit()
            logger.info(
                "Insights generated",
                extra={"user_id": str(user_id), "count": len(created)},
            )
            return created
        except Exception as exc:
            logger.error("Failed to generate insights", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to generate insights") from exc


insight_service = InsightService()
