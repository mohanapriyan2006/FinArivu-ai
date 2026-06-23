"""Initialize PostgreSQL database and run migrations."""

import asyncio
import sys

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

from core.config import settings


async def create_database():
    """Create the finarivu database if it doesn't exist."""
    # Connect to default 'postgres' database to create our db
    db_url = settings.database_url
    # Replace the database name with 'postgres' to connect to default db
    default_url = db_url.rsplit('/', 1)[0] + '/postgres'
    
    engine = create_async_engine(default_url, isolation_level="AUTOCOMMIT")
    
    db_name = db_url.rsplit('/', 1)[1]
    
    async with engine.connect() as conn:
        # Check if database exists
        result = await conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
            {"db_name": db_name}
        )
        exists = result.scalar()
        
        if not exists:
            await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            print(f"Database '{db_name}' created successfully.")
        else:
            print(f"Database '{db_name}' already exists.")
    
    await engine.dispose()


def run_migrations():
    """Run alembic migrations."""
    import subprocess
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        print("Migration error:", result.stderr)
        sys.exit(1)
    print("Migrations completed successfully.")


async def main():
    await create_database()
    run_migrations()


if __name__ == "__main__":
    asyncio.run(main())
