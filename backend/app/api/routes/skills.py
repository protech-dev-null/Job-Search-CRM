from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.skill import Skill
from app.schemas.skill import SkillRead

router = APIRouter(prefix=f"{settings.api_prefix}/skills", tags=["skills"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[SkillRead])
def list_skills(
    db: DbSession,
    search: Annotated[str | None, Query(max_length=80)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[Skill]:
    """List canonical skills for filters and autocomplete controls."""
    statement = select(Skill).order_by(Skill.normalized_name).limit(limit)
    if search:
        statement = statement.where(Skill.name.ilike(f"%{search.strip()}%"))
    return list(db.scalars(statement).all())
