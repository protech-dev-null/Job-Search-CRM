from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.stats import StatsRead
from app.services.stats_service import calculate_stats

router = APIRouter(prefix=f"{settings.api_prefix}/stats", tags=["stats"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=StatsRead)
def read_stats(db: DbSession) -> StatsRead:
    """Return aggregate statistics for the dashboard."""
    return calculate_stats(db)
