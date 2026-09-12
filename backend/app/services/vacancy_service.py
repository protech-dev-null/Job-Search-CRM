from collections.abc import Iterable
from datetime import date

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models import Activity
from app.models.skill import Skill
from app.models.vacancy import Vacancy
from app.schemas.activity import ActivityKind
from app.schemas.vacancy import VacancyCreate, VacancyFilters, VacancyUpdate

WORKFLOW_TRANSITIONS = {
    "interesting": {"applied"},
    "applied": {"interview", "rejected"},
    "interview": {"test", "rejected"},
    "test": {"offer", "rejected"},
    "offer": {"archived"},
    "rejected": {"archived"},
    "archived": set(),
}

VACANCY_STATUS_LABELS = {
    "interesting": "Интересно",
    "applied": "Отклик",
    "interview": "Интервью",
    "test": "Тестовое",
    "offer": "Оффер",
    "rejected": "Отказ",
    "archived": "Архив",
}


def get_or_create_skills(db: Session, names: Iterable[str]) -> list[Skill]:
    """Resolve canonical skills, creating missing records when necessary."""
    unique_names = {name.casefold(): name for name in names}
    if not unique_names:
        return []

    skills_by_name = {
        skill.normalized_name: skill
        for skill in db.new
        if isinstance(skill, Skill) and skill.normalized_name in unique_names
    }
    missing_names = unique_names.keys() - skills_by_name.keys()
    if missing_names:
        with db.no_autoflush:
            existing_skills = db.scalars(
                select(Skill).where(Skill.normalized_name.in_(missing_names))
            ).all()
        skills_by_name.update(
            {skill.normalized_name: skill for skill in existing_skills}
        )

    for normalized_name, display_name in unique_names.items():
        if normalized_name not in skills_by_name:
            skill = Skill(name=display_name, normalized_name=normalized_name)
            db.add(skill)
            skills_by_name[normalized_name] = skill

    return [skills_by_name[name] for name in unique_names]


def build_vacancy(db: Session, payload: VacancyCreate) -> Vacancy:
    """Build a vacancy model and resolve its normalized skill records."""
    values = payload.model_dump(exclude={"skills"})
    vacancy = Vacancy(**values)
    vacancy.skills = get_or_create_skills(db, payload.skills)
    return vacancy


def apply_vacancy_update(
    db: Session,
    vacancy: Vacancy,
    payload: VacancyUpdate,
) -> None:
    """Apply validated scalar and skill changes to a vacancy model."""
    values = payload.model_dump(exclude_unset=True, exclude={"skills"})
    for field, value in values.items():
        setattr(vacancy, field, value)

    if "skills" in payload.model_fields_set:
        vacancy.skills = get_or_create_skills(db, payload.skills or [])


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
    if filters.skill is not None:
        statement = statement.join(Vacancy.skills).where(
            Skill.normalized_name == filters.skill.casefold()
        )

    return statement


def find_vacancies(
    db: Session,
    filters: VacancyFilters,
) -> tuple[list[Vacancy], int]:
    """Return one page of matching vacancies and their total count."""
    statement = build_vacancy_statement(filters)
    ordered_statement = statement.order_by(Vacancy.created_at.desc())

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    offset = (filters.page - 1) * filters.page_size
    vacancies = list(
        db.scalars(ordered_statement.offset(offset).limit(filters.page_size)).all()
    )
    return vacancies, total


def find_overdue_next_actions(db: Session, today: date) -> list[Vacancy]:
    """Return vacancies whose next action deadline is before the given date."""
    statement = (
        select(Vacancy)
        .where(
            Vacancy.next_action.is_not(None),
            Vacancy.next_action_at.is_not(None),
            Vacancy.next_action_at < today,
        )
        .order_by(Vacancy.next_action_at.asc(), Vacancy.created_at.desc())
    )
    return list(db.scalars(statement).all())


def complete_next_action(vacancy: Vacancy) -> Activity:
    """Clear a vacancy action and record its completion in the timeline."""
    completed_action = vacancy.next_action
    if completed_action is None:
        raise ValueError("Vacancy has no next action to complete.")

    activity = Activity(
        vacancy_id=vacancy.id,
        kind=ActivityKind.TASK,
        description=f"Выполнено: {completed_action}",
    )
    vacancy.next_action = None
    vacancy.next_action_at = None
    vacancy.activities.append(activity)
    return activity


def has_status_changed(old_status: str, new_status: str) -> bool:
    """Return whether a vacancy status differs from its previous value."""
    return old_status != new_status


def is_workflow_transition_allowed(old_status: str, new_status: str) -> bool:
    """Return whether a status change is permitted by the vacancy workflow."""
    return new_status in WORKFLOW_TRANSITIONS.get(old_status, set())


def build_status_change_description(old_status: str, new_status: str) -> str:
    """Build a human-readable description for a vacancy status transition."""
    old_label = VACANCY_STATUS_LABELS.get(old_status, old_status)
    new_label = VACANCY_STATUS_LABELS.get(new_status, new_status)
    return f"Статус изменён: {old_label} -> {new_label}"


def create_status_change_activity(
    vacancy: Vacancy,
    old_status: str,
    new_status: str,
) -> Activity | None:
    """Create and attach an activity when a vacancy status has changed."""
    if not has_status_changed(old_status, new_status):
        return None

    description = build_status_change_description(old_status, new_status)

    new_activity = Activity(
        vacancy_id=vacancy.id,
        description=description,
        kind=ActivityKind.STATUS_CHANGE,
    )

    vacancy.activities.append(new_activity)
    return new_activity


def apply_workflow_transition(vacancy: Vacancy, new_status: str) -> Activity:
    """Apply an allowed workflow transition and record its status activity."""
    old_status = vacancy.status
    if not is_workflow_transition_allowed(old_status, new_status):
        raise ValueError(
            f"Transition from {old_status} to {new_status} is not allowed."
        )

    vacancy.status = new_status
    activity = create_status_change_activity(vacancy, old_status, new_status)
    if activity is None:
        raise RuntimeError("Workflow transition did not create a status activity.")
    return activity
