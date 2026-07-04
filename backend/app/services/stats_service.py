from sqlalchemy import func, select
from sqlalchemy.orm import Session

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


def calculate_stats(db: Session, skills_limit: int = 10) -> StatsRead:
    """Combine vacancy counters into the dashboard statistics response."""
    return StatsRead(
        total=count_total_vacancies(db),
        by_status=count_vacancies_by_status(db),
        by_priority=count_vacancies_by_priority(db),
        top_skills=get_top_skills(db, limit=skills_limit),
    )
