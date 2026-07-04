from app.db.migrations import upgrade_database


def init_db() -> None:
    """Upgrade the configured database schema to the latest revision."""
    upgrade_database()
