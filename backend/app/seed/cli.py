from __future__ import annotations

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine
from app.models.base import Base
from app.seed.categories import seed_expense_categories


async def _run_seed(session: AsyncSession) -> None:
    count = await seed_expense_categories(session)
    print(f"Seeded {count} expense categories")


async def main() -> None:
    """CLI entrypoint to seed master data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        try:
            await _run_seed(session)
            await session.commit()
        except Exception:
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())
