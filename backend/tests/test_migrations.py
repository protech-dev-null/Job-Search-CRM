import json
from pathlib import Path

from alembic import command
from app.db.migrations import create_alembic_config
from sqlalchemy import create_engine, inspect, text


def test_upgrade_empty_database_to_head(tmp_path: Path) -> None:
    """Create the complete schema in an empty database through Alembic."""
    database_path = tmp_path / "migration_test.db"
    database_url = f"sqlite:///{database_path.as_posix()}"
    config = create_alembic_config()
    config.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(config, "head")

    engine = create_engine(database_url)
    inspector = inspect(engine)
    with engine.connect() as connection:
        revision = connection.scalar(text("SELECT version_num FROM alembic_version"))

    assert {
        "activities",
        "alembic_version",
        "skills",
        "vacancies",
        "vacancy_skills",
    }.issubset(inspector.get_table_names())
    assert revision == "20260704_0003"


def test_skill_migration_preserves_legacy_json_data(tmp_path: Path) -> None:
    """Move legacy JSON skills into canonical relational records."""
    database_path = tmp_path / "legacy_skills.db"
    database_url = f"sqlite:///{database_path.as_posix()}"
    config = create_alembic_config()
    config.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(config, "20260704_0002")

    engine = create_engine(database_url)
    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO vacancies ("
                "id, company, position, source, status, priority, work_format, "
                "skills, created_at, updated_at"
                ") VALUES ("
                ":id, :company, :position, :source, :status, :priority, "
                ":work_format, :skills, :created_at, :updated_at"
                ")"
            ),
            {
                "id": "vacancy-id",
                "company": "Orbit Labs",
                "position": "Frontend Developer",
                "source": "manual",
                "status": "interesting",
                "priority": "medium",
                "work_format": "remote",
                "skills": json.dumps(["React", "react", "TypeScript"]),
                "created_at": "2026-07-04 12:00:00",
                "updated_at": "2026-07-04 12:00:00",
            },
        )

    command.upgrade(config, "head")

    inspector = inspect(engine)
    vacancy_columns = {column["name"] for column in inspector.get_columns("vacancies")}
    with engine.connect() as connection:
        skill_names = connection.scalars(
            text("SELECT name FROM skills ORDER BY normalized_name")
        ).all()
        link_count = connection.scalar(text("SELECT count(*) FROM vacancy_skills"))

    assert "skills" not in vacancy_columns
    assert skill_names == ["React", "TypeScript"]
    assert link_count == 2
