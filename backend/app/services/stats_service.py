from collections import Counter
from collections.abc import Callable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.vacancy import Vacancy
from app.schemas.stats import SkillStat, StatsRead
from app.schemas.vacancy import VacancyPriority, VacancyStatus


def count_total_vacancies(db: Session) -> int:
    """Count all vacancies stored in the database."""
    return db.scalar(select(func.count(Vacancy.id))) or 0


def count_vacancies_by_status(db: Session) -> dict[Callable[[], str], int]:
    """Count vacancies for every supported workflow status."""
    by_status = {status.value: 0 for status in VacancyStatus}
    status_rows = db.execute(
        select(Vacancy.status, func.count(Vacancy.id)).group_by(Vacancy.status)
    ).all()
    for status_value, count in status_rows:
        by_status[status_value] = count

    return by_status


def count_vacancies_by_priority(db: Session) -> dict[Callable[[], str], int]:
    """Count vacancies for every supported priority level."""
    by_priority = {priority.value: 0 for priority in VacancyPriority}
    priority_rows = db.execute(
        select(Vacancy.priority, func.count(Vacancy.id)).group_by(Vacancy.priority)
    ).all()
    for priority_value, count in priority_rows:
        by_priority[priority_value] = count

    return by_priority


def count_unique_skills(db: Session) -> Counter[str]:
    """Count each skill at most once per vacancy."""
    skill_counts: Counter[str] = Counter()
    for vacancy_skills in db.scalars(select(Vacancy.skills)).all():
        unique_skills = {
            skill.strip()
            for skill in vacancy_skills
            if isinstance(skill, str) and skill.strip()
        }
        skill_counts.update(unique_skills)

    return skill_counts


def build_top_skills(skill_counts: Counter[str], limit: int) -> list[SkillStat]:
    """Build a deterministic list of the most frequently used skills."""
    return [
        SkillStat(name=name, count=count)
        for name, count in sorted(
            skill_counts.items(),
            key=lambda item: (-item[1], item[0].lower()),
        )[:limit]
    ]


def calculate_stats(db: Session, skills_limit: int = 10) -> StatsRead:
    """Combine vacancy counters into the dashboard statistics response."""
    skill_counts = count_unique_skills(db)

    return StatsRead(
        total=count_total_vacancies(db),
        by_status=count_vacancies_by_status(db),
        by_priority=count_vacancies_by_priority(db),
        top_skills=build_top_skills(skill_counts, limit=skills_limit),
    )
