"""Database models registered in SQLAlchemy metadata."""

from app.models.activity import Activity
from app.models.skill import Skill, vacancy_skills
from app.models.vacancy import Vacancy

__all__ = ["Activity", "Skill", "Vacancy", "vacancy_skills"]
