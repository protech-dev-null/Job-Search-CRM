from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.vacancies import get_vacancy_or_404
from app.core.config import settings
from app.db.session import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityRead, ActivityUpdate

router = APIRouter(
    prefix=f"{settings.api_prefix}/vacancies/{{vacancy_id}}/activities",
    tags=["activities"],
)

DbSession = Annotated[Session, Depends(get_db)]


def get_activity_or_404(
    vacancy_id: str,
    activity_id: str,
    db: Session,
) -> Activity:
    """Return a vacancy activity or raise an API-level not found error."""
    activity = db.scalar(
        select(Activity).where(
            Activity.id == activity_id,
            Activity.vacancy_id == vacancy_id,
        )
    )
    if activity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )
    return activity


@router.get("", response_model=list[ActivityRead])
def list_activities(vacancy_id: str, db: DbSession) -> list[Activity]:
    """List vacancy activities from newest to oldest."""
    get_vacancy_or_404(vacancy_id, db)
    statement = (
        select(Activity)
        .where(Activity.vacancy_id == vacancy_id)
        .order_by(Activity.occurred_at.desc(), Activity.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.post("", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
def create_activity(
    vacancy_id: str,
    payload: ActivityCreate,
    db: DbSession,
) -> Activity:
    """Record a new event in a vacancy history."""
    get_vacancy_or_404(vacancy_id, db)
    activity = Activity(
        vacancy_id=vacancy_id,
        **payload.model_dump(exclude_none=True),
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.patch("/{activity_id}", response_model=ActivityRead)
def update_activity(
    vacancy_id: str,
    activity_id: str,
    payload: ActivityUpdate,
    db: DbSession,
) -> Activity:
    """Partially update an event in a vacancy history."""
    get_vacancy_or_404(vacancy_id, db)
    activity = get_activity_or_404(vacancy_id, activity_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)

    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    vacancy_id: str,
    activity_id: str,
    db: DbSession,
) -> Response:
    """Delete an event from a vacancy history."""
    get_vacancy_or_404(vacancy_id, db)
    activity = get_activity_or_404(vacancy_id, activity_id, db)
    db.delete(activity)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
