"""Goal service layer."""

import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import logger
from models.goal import Goal
from repositories.goal_repository import goal_repository
from schemas.goal import GoalCreate, GoalUpdate
from utils.exceptions import ResourceNotFoundError, DatabaseError, ValidationError


class GoalService:
    """Service for goal operations."""

    async def get_user_goals(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Goal]:
        """Get all goals for a user."""
        return await goal_repository.get_by_user_id(session, user_id, skip, limit)

    async def create_goal(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: GoalCreate,
    ) -> Goal:
        """Create a new goal."""
        try:
            if data.target_date < date.today():
                raise ValidationError("Target date must be in the future")

            item = await goal_repository.create(
                session,
                {
                    "user_id": user_id,
                    "goal_name": data.goal_name,
                    "goal_type": data.goal_type,
                    "target_amount": data.target_amount,
                    "current_amount": data.current_amount,
                    "target_date": data.target_date,
                    "status": data.status,
                },
            )
            await session.commit()
            logger.info(
                "Goal created",
                extra={"user_id": str(user_id), "goal_name": data.goal_name},
            )
            return item
        except ValidationError:
            raise
        except Exception as exc:
            logger.error("Failed to create goal", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to create goal") from exc

    async def update_goal(
        self,
        session: AsyncSession,
        goal_id: uuid.UUID,
        user_id: uuid.UUID,
        data: GoalUpdate,
    ) -> Goal:
        """Update an existing goal."""
        try:
            item = await goal_repository.get_by_id_with_owner(session, goal_id, user_id)
            if item is None:
                raise ResourceNotFoundError("Goal not found")

            update_data = data.model_dump(exclude_unset=True)

            if "target_date" in update_data and update_data["target_date"] < date.today():
                if item.status != "Completed":
                    raise ValidationError("Target date must be in the future for active goals")

            item = await goal_repository.update(session, item, update_data)
            await session.commit()
            logger.info(
                "Goal updated",
                extra={"goal_id": str(goal_id), "user_id": str(user_id)},
            )
            return item
        except (ResourceNotFoundError, ValidationError):
            raise
        except Exception as exc:
            logger.error(
                "Failed to update goal",
                extra={"goal_id": str(goal_id), "user_id": str(user_id)},
            )
            raise DatabaseError("Failed to update goal") from exc

    async def delete_goal(
        self,
        session: AsyncSession,
        goal_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Delete a goal."""
        try:
            item = await goal_repository.get_by_id_with_owner(session, goal_id, user_id)
            if item is None:
                raise ResourceNotFoundError("Goal not found")

            await goal_repository.delete(session, item)
            await session.commit()
            logger.info(
                "Goal deleted",
                extra={"goal_id": str(goal_id), "user_id": str(user_id)},
            )
        except ResourceNotFoundError:
            raise
        except Exception as exc:
            logger.error(
                "Failed to delete goal",
                extra={"goal_id": str(goal_id), "user_id": str(user_id)},
            )
            raise DatabaseError("Failed to delete goal") from exc

    async def get_summary(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        """Get goal summary statistics."""
        try:
            goals = await goal_repository.get_by_user_id(session, user_id)

            total = len(goals)
            completed = sum(1 for g in goals if g.status == "Completed")
            active_goals = [g for g in goals if g.status == "Active"]

            avg_progress = 0.0
            if active_goals:
                progress_values = [
                    float(g.current_amount / g.target_amount * 100)
                    for g in active_goals
                    if g.target_amount > 0
                ]
                if progress_values:
                    avg_progress = round(sum(progress_values) / len(progress_values), 1)

            upcoming = await goal_repository.get_upcoming_deadlines(session, user_id)

            return {
                "total_goals": total,
                "completed_goals": completed,
                "average_progress": avg_progress,
                "upcoming_deadlines": upcoming,
            }
        except Exception as exc:
            logger.error("Failed to get goal summary", extra={"user_id": str(user_id)})
            raise DatabaseError("Failed to get goal summary") from exc


goal_service = GoalService()
