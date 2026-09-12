from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.vacancy import Vacancy
from app.schemas.vacancy import (
    VacancyCreate,
    VacancyFilters,
    VacancyPage,
    VacancyRead,
    VacancyTransition,
    VacancyUpdate,
)
from app.services.vacancy_service import (
    apply_vacancy_update,
    apply_workflow_transition,
    build_vacancy,
    complete_next_action,
    create_status_change_activity,
    find_overdue_next_actions,
    find_vacancies,
)

router = APIRouter(prefix=f"{settings.api_prefix}/vacancies", tags=["vacancies"])

DbSession = Annotated[Session, Depends(get_db)]
VacancyFilterParams = Annotated[VacancyFilters, Query()]


def get_vacancy_or_404(vacancy_id: str, db: Session) -> Vacancy:
    """Return a vacancy or raise the API-level not found error."""
    vacancy = db.get(Vacancy, vacancy_id)
    if vacancy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacancy not found",
        )
    return vacancy


@router.get("", response_model=VacancyPage)
def list_vacancies(db: DbSession, filters: VacancyFilterParams) -> VacancyPage:
    """List one page of vacancies matching optional query filters."""
    vacancies, total = find_vacancies(db, filters)
    pages = (total + filters.page_size - 1) // filters.page_size

    return VacancyPage(
        items=[VacancyRead.model_validate(vacancy) for vacancy in vacancies],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        pages=pages,
    )


@router.post(
    "",
    response_model=VacancyRead,
    status_code=status.HTTP_201_CREATED,
)
def create_vacancy(payload: VacancyCreate, db: DbSession) -> Vacancy:
    """Create a new vacancy from validated API input."""
    vacancy = build_vacancy(db, payload)

    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)

    return vacancy


@router.get("/overdue-actions", response_model=list[VacancyRead])
def list_overdue_actions(db: DbSession) -> list[Vacancy]:
    """List vacancies with next actions overdue before today."""
    return find_overdue_next_actions(db, date.today())


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

    old_status = vacancy.status
    apply_vacancy_update(db, vacancy, payload)
    new_status = vacancy.status

    create_status_change_activity(vacancy, old_status, new_status)

    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)

    return vacancy


@router.post("/{vacancy_id}/complete-next-action", response_model=VacancyRead)
def complete_vacancy_next_action(vacancy_id: str, db: DbSession) -> Vacancy:
    """Mark a vacancy's next action complete and clear its deadline."""
    vacancy = get_vacancy_or_404(vacancy_id, db)
    if vacancy.next_action is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vacancy has no next action to complete.",
        )

    complete_next_action(vacancy)
    db.commit()
    db.refresh(vacancy)
    return vacancy


@router.post("/{vacancy_id}/transition", response_model=VacancyRead)
def transition_vacancy(
    vacancy_id: str,
    payload: VacancyTransition,
    db: DbSession,
) -> Vacancy:
    """Move a vacancy through an allowed workflow transition."""
    vacancy = get_vacancy_or_404(vacancy_id, db)
    try:
        apply_workflow_transition(vacancy, payload.status)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

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
