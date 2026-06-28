from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.vacancy import Vacancy
from app.schemas.vacancy import VacancyFilters


def build_vacancy_statement(
    filters: VacancyFilters,
) -> Select[tuple[Vacancy]]:
    """Build a database query from vacancy filters except skill."""
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

    return statement


def vacancy_has_skill(vacancy: Vacancy, requested_skill: str) -> bool:
    """Check whether a vacancy contains a skill ignoring letter case."""
    normalized_skill = requested_skill.casefold()
    return any(skill.casefold() == normalized_skill for skill in vacancy.skills)


def paginate_items(
    vacancies: list[Vacancy],
    page: int,
    page_size: int,
) -> list[Vacancy]:
    """Return one page from an in-memory vacancy list."""
    start = (page - 1) * page_size
    return vacancies[start : start + page_size]


def find_vacancies(
    db: Session,
    filters: VacancyFilters,
) -> tuple[list[Vacancy], int]:
    """Return one page of matching vacancies and their total count."""
    statement = build_vacancy_statement(filters)
    ordered_statement = statement.order_by(Vacancy.created_at.desc())

    if filters.skill is not None:
        matching_vacancies = [
            vacancy
            for vacancy in db.scalars(ordered_statement).all()
            if vacancy_has_skill(vacancy, filters.skill)
        ]
        return (
            paginate_items(matching_vacancies, filters.page, filters.page_size),
            len(matching_vacancies),
        )

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    offset = (filters.page - 1) * filters.page_size
    vacancies = list(
        db.scalars(ordered_statement.offset(offset).limit(filters.page_size)).all()
    )
    return vacancies, total
