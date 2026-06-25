from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.vacancy import Vacancy
from app.schemas.vacancy import VacancyCreate, VacancyRead, VacancyUpdate

router = APIRouter(prefix=f"{settings.api_prefix}/vacancies", tags=["vacancies"])

DbSession = Annotated[Session, Depends(get_db)]


def get_vacancy_or_404(vacancy_id: str, db: Session) -> Vacancy:
    """Return a vacancy or raise the API-level not found error."""
    vacancy = db.get(Vacancy, vacancy_id)
    if vacancy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacancy not found",
        )
    return vacancy


@router.get("", response_model=list[VacancyRead])
def list_vacancies(db: DbSession) -> list[Vacancy]:
    """List vacancies ordered from newest to oldest."""
    statement = select(Vacancy).order_by(Vacancy.created_at.desc())
    return list(db.scalars(statement).all())


@router.post(
    "",
    response_model=VacancyRead,
    status_code=status.HTTP_201_CREATED,
)
def create_vacancy(payload: VacancyCreate, db: DbSession) -> Vacancy:
    """Create a new vacancy from validated API input."""
    vacancy = Vacancy(**payload.model_dump())

    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)

    return vacancy


@router.get("/{vacancy_id}", response_model=VacancyRead)
def read_vacancy(vacancy_id: str, db: DbSession) -> Vacancy:
    """Read a single vacancy by identifier."""
    return get_vacancy_or_404(vacancy_id, db)


@router.patch("/{vacancy_id}", response_model=VacancyRead)
def update_vacancy(
    vacancy_id: str,
    payload: VacancyUpdate,
    db: DbSession,
) -> Vacancy:
    """Partially update a vacancy by identifier."""
    vacancy = get_vacancy_or_404(vacancy_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vacancy, field, value)

    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)

    return vacancy


@router.delete("/{vacancy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vacancy(vacancy_id: str, db: DbSession) -> Response:
    """Delete a vacancy by identifier."""
    vacancy = get_vacancy_or_404(vacancy_id, db)

    db.delete(vacancy)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
