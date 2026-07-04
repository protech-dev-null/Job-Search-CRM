from pathlib import Path

from alembic import command
from alembic.config import Config

BACKEND_DIR = Path(__file__).resolve().parents[2]


def create_alembic_config() -> Config:
    """Build an Alembic configuration independent of the current directory."""
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    return config


def upgrade_database() -> None:
    """Upgrade the configured application database to the latest revision."""
    command.upgrade(create_alembic_config(), "head")
