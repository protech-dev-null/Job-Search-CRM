from collections import defaultdict
from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.skill import Skill, vacancy_skills
from app.models.vacancy import Vacancy
from app.schemas.stats import SkillStat, StatsRead
from app.schemas.vacancy import VacancyPriority, VacancyStatus


def count_total_vacancies(db: Session) -> int:
    """Count all vacancies stored in the database."""
    return db.scalar(select(func.count(Vacancy.id))) or 0


def count_vacancies_by_status(db: Session) -> dict[str, int]:
    """Count vacancies for every supported workflow status."""
    by_status = {status.value: 0 for status in VacancyStatus}
    status_rows = db.execute(
        select(Vacancy.status, func.count(Vacancy.id)).group_by(Vacancy.status)
    ).all()
    for status_value, count in status_rows:
        by_status[status_value] = count

    return by_status


def count_vacancies_by_priority(db: Session) -> dict[str, int]:
    """Count vacancies for every supported priority level."""
    by_priority = {priority.value: 0 for priority in VacancyPriority}
    priority_rows = db.execute(
        select(Vacancy.priority, func.count(Vacancy.id)).group_by(Vacancy.priority)
    ).all()
    for priority_value, count in priority_rows:
        by_priority[priority_value] = count

    return by_priority


def get_top_skills(db: Session, limit: int) -> list[SkillStat]:
    """Return the most frequently linked canonical skills."""
    vacancy_count = func.count(vacancy_skills.c.vacancy_id)
    rows = db.execute(
        select(Skill.name, vacancy_count)
        .join(vacancy_skills, Skill.id == vacancy_skills.c.skill_id)
        .group_by(Skill.id, Skill.name)
        .order_by(vacancy_count.desc(), func.lower(Skill.name))
        .limit(limit)
    ).all()
    return [SkillStat(name=name, count=count) for name, count in rows]


def count_actions_due_on(db: Session, due_date: date) -> int:
    """Count vacancies with a next action scheduled for the given date."""
    return db.scalar(
        select(func.count(Vacancy.id)).where(
            Vacancy.next_action.is_not(None),
            Vacancy.next_action_at == due_date,
        )
    ) or 0


def count_overdue_actions(db: Session, today: date) -> int:
    """Count vacancies with a next action deadline before the given date."""
    return db.scalar(
        select(func.count(Vacancy.id)).where(
            Vacancy.next_action.is_not(None),
            Vacancy.next_action_at.is_not(None),
            Vacancy.next_action_at < today,
        )
    ) or 0


def calculate_applied_to_interview_conversion(db: Session) -> float | None:
    """Calculate interview conversion from structured recorded status entries."""
    status_rows = db.execute(
        select(Activity.vacancy_id, Activity.to_status).where(
            Activity.to_status.is_not(None)
        )
    ).all()
    applied_ids: set[str] = set()
    interview_ids: set[str] = set()
    applied_or_later = {"applied", "interview", "test", "offer"}
    interview_or_later = {"interview", "test", "offer"}

    for vacancy in db.scalars(select(Vacancy)).all():
        if vacancy.status in applied_or_later:
            applied_ids.add(vacancy.id)
        if vacancy.status in interview_or_later:
            interview_ids.add(vacancy.id)

    for vacancy_id, status in status_rows:
        if status in applied_or_later:
            applied_ids.add(vacancy_id)
        if status in interview_or_later:
            interview_ids.add(vacancy_id)

    if not applied_ids:
        return None
    return round(len(interview_ids) / len(applied_ids) * 100, 1)


def as_utc(value: datetime) -> datetime:
    """Treat naive database timestamps as UTC for duration calculations."""
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def calculate_average_days_by_status(db: Session, now: datetime) -> dict[str, float]:
    """Average recorded time spent in each vacancy status in days."""
    durations: dict[str, list[float]] = defaultdict(list)
    status_events: dict[str, list[tuple[str, datetime]]] = defaultdict(list)
    rows = db.execute(
        select(Activity.vacancy_id, Activity.to_status, Activity.occurred_at)
        .where(Activity.to_status.is_not(None))
        .order_by(Activity.vacancy_id, Activity.occurred_at)
    ).all()

    for vacancy_id, status, occurred_at in rows:
        status_events[vacancy_id].append((status, as_utc(occurred_at)))

    for events in status_events.values():
        for index, (status, started_at) in enumerate(events):
            ended_at = events[index + 1][1] if index + 1 < len(events) else now
            duration_days = max(
                (ended_at - started_at).total_seconds(),
                0,
            ) / 86_400
            durations[status].append(duration_days)

    legacy_vacancies = db.scalars(
        select(Vacancy).where(
            ~Vacancy.id.in_(status_events.keys()) if status_events else True
        )
    ).all()
    for vacancy in legacy_vacancies:
        durations[vacancy.status].append(
            max((now - as_utc(vacancy.created_at)).total_seconds(), 0) / 86_400
        )

    averages: dict[str, float] = {}
    for status in VacancyStatus:
        status_durations = durations[status.value]
        averages[status.value] = (
            round(sum(status_durations) / len(status_durations), 1)
            if status_durations
            else 0.0
        )
    return averages


def calculate_stats(
    db: Session,
    skills_limit: int = 10,
    today: date | None = None,
    now: datetime | None = None,
) -> StatsRead:
    """Combine vacancy counters into the dashboard statistics response."""
    current_date = today or date.today()
    current_time = now or datetime.now(UTC)
    return StatsRead(
        total=count_total_vacancies(db),
        by_status=count_vacancies_by_status(db),
        by_priority=count_vacancies_by_priority(db),
        top_skills=get_top_skills(db, limit=skills_limit),
        due_today=count_actions_due_on(db, current_date),
        overdue_actions=count_overdue_actions(db, current_date),
        applied_to_interview_conversion=calculate_applied_to_interview_conversion(db),
        average_days_by_status=calculate_average_days_by_status(db, current_time),
    )
