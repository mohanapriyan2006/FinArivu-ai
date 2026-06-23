"""Add password_hash to users, make clerk_id nullable

Revision ID: 006
Revises: 005
Create Date: 2026-06-23 12:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make clerk_id nullable
    op.alter_column("users", "clerk_id", existing_type=sa.String(length=255), nullable=True)
    # Add password_hash column
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=False, server_default=""))
    # Drop unique constraint on clerk_id (it may have nulls now)
    op.drop_constraint("users_clerk_id_key", "users", type_="unique")


def downgrade() -> None:
    op.drop_column("users", "password_hash")
    op.alter_column("users", "clerk_id", existing_type=sa.String(length=255), nullable=False)
    op.create_unique_constraint("users_clerk_id_key", "users", ["clerk_id"])
