"""Normalize vacancy skills.

Revision ID: 20260704_0003
Revises: 20260704_0002
Create Date: 2026-07-04
"""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op

revision: str = "20260704_0003"
down_revision: str | None = "20260704_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Move JSON skill names into normalized relational tables."""
    op.create_table(
        "skills",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("normalized_name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_skills_normalized_name"),
        "skills",
        ["normalized_name"],
        unique=True,
    )
    op.create_table(
        "vacancy_skills",
        sa.Column("vacancy_id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skills.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["vacancy_id"],
            ["vacancies.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("vacancy_id", "skill_id"),
    )

    connection = op.get_bind()
    legacy_vacancies = sa.table(
        "vacancies",
        sa.column("id", sa.String()),
        sa.column("skills", sa.JSON()),
    )
    skill_table = sa.table(
        "skills",
        sa.column("id", sa.String()),
        sa.column("name", sa.String()),
        sa.column("normalized_name", sa.String()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    link_table = sa.table(
        "vacancy_skills",
        sa.column("vacancy_id", sa.String()),
        sa.column("skill_id", sa.String()),
    )

    skills_by_name: dict[str, str] = {}
    linked_pairs: set[tuple[str, str]] = set()
    for vacancy_id, skill_names in connection.execute(
        sa.select(legacy_vacancies.c.id, legacy_vacancies.c.skills)
    ):
        for raw_name in skill_names or []:
            name = raw_name.strip()
            normalized_name = name.casefold()
            if not name:
                continue
            skill_id = skills_by_name.get(normalized_name)
            if skill_id is None:
                skill_id = str(uuid.uuid4())
                skills_by_name[normalized_name] = skill_id
                connection.execute(
                    skill_table.insert().values(
                        id=skill_id,
                        name=name,
                        normalized_name=normalized_name,
                        created_at=datetime.now(UTC),
                    )
                )
            pair = (vacancy_id, skill_id)
            if pair not in linked_pairs:
                connection.execute(
                    link_table.insert().values(
                        vacancy_id=vacancy_id,
                        skill_id=skill_id,
                    )
                )
                linked_pairs.add(pair)

    with op.batch_alter_table("vacancies") as batch_op:
        batch_op.drop_column("skills")


def downgrade() -> None:
    """Restore JSON skill names on vacancies."""
    with op.batch_alter_table("vacancies") as batch_op:
        batch_op.add_column(
            sa.Column(
                "skills",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'[]'"),
            )
        )

    connection = op.get_bind()
    rows = connection.execute(
        sa.text(
            "SELECT vacancy_skills.vacancy_id, skills.name "
            "FROM vacancy_skills "
            "JOIN skills ON skills.id = vacancy_skills.skill_id "
            "ORDER BY skills.normalized_name"
        )
    )
    names_by_vacancy: dict[str, list[str]] = {}
    for vacancy_id, name in rows:
        names_by_vacancy.setdefault(vacancy_id, []).append(name)

    vacancies = sa.table(
        "vacancies",
        sa.column("id", sa.String()),
        sa.column("skills", sa.JSON()),
    )
    for vacancy_id, names in names_by_vacancy.items():
        connection.execute(
            vacancies.update().where(vacancies.c.id == vacancy_id).values(skills=names)
        )

    op.drop_table("vacancy_skills")
    op.drop_index(op.f("ix_skills_normalized_name"), table_name="skills")
    op.drop_table("skills")
