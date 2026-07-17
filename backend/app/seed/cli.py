from __future__ import annotations

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine
from app.core.migrations import apply_migrations
from app.seed.categories import seed_expense_categories


async def _run_seed(session: AsyncSession) -> int:
    count = await seed_expense_categories(session)
    print(f"Seeded {count} expense categories")
    return count


async def main() -> None:
    """CLI entrypoint to seed master data."""
    await apply_migrations(engine)

    async with AsyncSession(engine) as session:
        try:
            await _run_seed(session)
            await session.commit()
        except Exception:
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())
