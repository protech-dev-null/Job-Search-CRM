"""Add structured status transitions to activities.

Revision ID: 20260912_0005
Revises: 20260912_0004
Create Date: 2026-09-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260912_0005"
down_revision: str | None = "20260912_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Store source and target statuses for automatic status activities."""
    with op.batch_alter_table("activities") as batch_op:
        batch_op.add_column(
            sa.Column("from_status", sa.String(length=40), nullable=True)
        )
        batch_op.add_column(sa.Column("to_status", sa.String(length=40), nullable=True))


def downgrade() -> None:
    """Remove structured status transition fields from activities."""
    with op.batch_alter_table("activities") as batch_op:
        batch_op.drop_column("to_status")
        batch_op.drop_column("from_status")
