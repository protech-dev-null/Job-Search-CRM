from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.vacancy import Vacancy
from app.schemas.vacancy import VacancyFilters


def find_vacancies(db: Session, filters: VacancyFilters) -> list[Vacancy]:
    """Return vacancies matching the validated list filters."""
    statement = select(Vacancy)

    if filters.status is not None:
        statement = statement.where(Vacancy.status == filters.status.value)
    if filters.priority is not None:
        statement = statement.where(Vacancy.priority == filters.priority.value)
    if filters.work_format is not None:
        statement = statement.where(Vacancy.work_format == filters.work_format.value)
    if filters.source is not None:
        statement = statement.where(Vacancy.source == filters.source.value)
    if filters.search is not None:
        search_pattern = f"%{filters.search}%"
        statement = statement.where(
            or_(
                Vacancy.company.ilike(search_pattern),
                Vacancy.position.ilike(search_pattern),
                Vacancy.location.ilike(search_pattern),
            )
        )

    statement = statement.order_by(Vacancy.created_at.desc())
    vacancies = list(db.scalars(statement).all())

    if filters.skill is None:
        return vacancies

    requested_skill = filters.skill.casefold()
    return [
        vacancy
        for vacancy in vacancies
        if any(skill.casefold() == requested_skill for skill in vacancy.skills)
    ]
