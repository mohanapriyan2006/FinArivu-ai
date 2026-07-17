from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.categories import ExpenseCategory

DEFAULT_EXPENSE_CATEGORIES = [
    {"name": "Food", "icon": "🍽️", "color": "#FF7043", "display_order": 1, "is_system": True},
    {"name": "Rent", "icon": "🏠", "color": "#29B6F6", "display_order": 2, "is_system": True},
    {"name": "Travel", "icon": "🚗", "color": "#66BB6A", "display_order": 3, "is_system": True},
    {"name": "Utilities", "icon": "💡", "color": "#FFCA28", "display_order": 4, "is_system": True},
    {"name": "Healthcare", "icon": "🏥", "color": "#EF5350", "display_order": 5, "is_system": True},
    {"name": "Entertainment", "icon": "🎬", "color": "#AB47BC", "display_order": 6, "is_system": True},
    {"name": "Education", "icon": "📚", "color": "#5C6BC0", "display_order": 7, "is_system": True},
    {"name": "Shopping", "icon": "🛍️", "color": "#EC407A", "display_order": 8, "is_system": True},
    {"name": "Insurance", "icon": "🛡️", "color": "#78909C", "display_order": 9, "is_system": True},
    {"name": "Other", "icon": "📦", "color": "#B0BEC5", "display_order": 10, "is_system": True},
]


async def seed_expense_categories(session: AsyncSession) -> int:
    """Seed default expense categories if they do not already exist."""
    inserted = 0
    for data in DEFAULT_EXPENSE_CATEGORIES:
        existing = (
            await session.execute(select(ExpenseCategory).where(ExpenseCategory.name == data["name"]))
        ).scalar_one_or_none()
        if existing is None:
            category = ExpenseCategory(**data)
            session.add(category)
            inserted += 1
    await session.flush()
    return inserted
