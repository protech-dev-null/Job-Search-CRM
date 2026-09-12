"""Add next action deadlines.

Revision ID: 20260912_0004
Revises: 20260704_0003
Create Date: 2026-09-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260912_0004"
down_revision: str | None = "20260704_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add a nullable date deadline for a vacancy's next action."""
    with op.batch_alter_table("vacancies") as batch_op:
        batch_op.add_column(sa.Column("next_action_at", sa.Date(), nullable=True))
        batch_op.create_index(
            "ix_vacancies_next_action_at",
            ["next_action_at"],
            unique=False,
        )


def downgrade() -> None:
    """Remove the next action deadline from vacancies."""
    with op.batch_alter_table("vacancies") as batch_op:
        batch_op.drop_index("ix_vacancies_next_action_at")
        batch_op.drop_column("next_action_at")
