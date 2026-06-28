from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.vacancy import Vacancy
from app.schemas.vacancy import VacancyCreate

SAMPLE_VACANCIES = (
    VacancyCreate(
        company="Orbit Labs",
        position="React Developer",
        source="hh",
        status="applied",
        priority="high",
        salary="160-220k RUB",
        location="Remote",
        work_format="remote",
        skills=["React", "TypeScript", "REST API"],
        notes="Product team with a modern frontend stack.",
        next_action="Send follow-up",
    ),
    VacancyCreate(
        company="CloudFox",
        position="Frontend Intern",
        source="other",
        status="interview",
        priority="high",
        location="Moscow",
        work_format="hybrid",
        skills=["JavaScript", "CSS", "React"],
        notes="HR interview scheduled.",
        next_action="Prepare interview questions",
    ),
    VacancyCreate(
        company="Marketly",
        position="UI Developer",
        source="linkedin",
        status="test",
        priority="high",
        work_format="remote",
        skills=["React", "Tailwind CSS", "Forms"],
        notes="Test task is focused on form UX.",
        next_action="Finish test task",
    ),
    VacancyCreate(
        company="Northwind",
        position="Frontend Developer",
        source="hh",
        status="interesting",
        priority="medium",
        work_format="remote",
        skills=["React", "TypeScript", "Git"],
        next_action="Review vacancy requirements",
    ),
    VacancyCreate(
        company="BrightApps",
        position="Frontend Trainee",
        source="telegram",
        status="offer",
        priority="high",
        location="Saint Petersburg",
        work_format="office",
        skills=["HTML", "CSS", "JavaScript"],
        notes="Waiting for final offer details.",
    ),
    VacancyCreate(
        company="LedgerWorks",
        position="Junior Frontend Developer",
        source="hh",
        status="rejected",
        priority="low",
        work_format="hybrid",
        skills=["Vue", "TypeScript", "Vitest"],
        notes="Use requirements as a learning checklist.",
    ),
    VacancyCreate(
        company="FinStack",
        position="Frontend Engineer",
        source="linkedin",
        status="applied",
        priority="medium",
        work_format="hybrid",
        skills=["React", "TypeScript", "Storybook"],
        next_action="Wait for recruiter response",
    ),
    VacancyCreate(
        company="PixelDesk",
        position="Junior React Developer",
        source="telegram",
        status="interesting",
        priority="medium",
        work_format="remote",
        skills=["React", "Tailwind CSS", "Git"],
        next_action="Adapt CV",
    ),
    VacancyCreate(
        company="DataWorks",
        position="Python Backend Developer",
        source="hh",
        status="interview",
        priority="high",
        work_format="remote",
        skills=["Python", "FastAPI", "SQLAlchemy", "PostgreSQL"],
        next_action="Review FastAPI and SQLAlchemy",
    ),
    VacancyCreate(
        company="DevCore",
        position="Junior Fullstack Developer",
        source="other",
        status="applied",
        priority="medium",
        work_format="remote",
        skills=["Python", "React", "TypeScript"],
        next_action="Send portfolio link",
    ),
    VacancyCreate(
        company="ShopHub",
        position="Web Developer",
        source="hh",
        status="archived",
        priority="low",
        location="Moscow",
        work_format="office",
        skills=["JavaScript", "HTML", "CSS"],
        notes="Archived because the role is office-only.",
    ),
    VacancyCreate(
        company="NovaSoft",
        position="Junior Python Developer",
        source="telegram",
        status="interesting",
        priority="medium",
        work_format="hybrid",
        skills=["Python", "FastAPI", "Docker"],
        next_action="Study Docker basics",
    ),
)


def seed_vacancies(db: Session) -> int:
    """Insert missing sample vacancies and return the number added."""
    existing_vacancies = set(
        db.execute(select(Vacancy.company, Vacancy.position)).all()
    )
    vacancies_to_add = [
        Vacancy(**payload.model_dump())
        for payload in SAMPLE_VACANCIES
        if (payload.company, payload.position) not in existing_vacancies
    ]

    db.add_all(vacancies_to_add)
    db.commit()

    return len(vacancies_to_add)


def main() -> None:
    """Create tables and populate the configured database with sample data."""
    init_db()
    with SessionLocal() as db:
        added_count = seed_vacancies(db)

    print(f"Seed complete: {added_count} vacancies added.")


if __name__ == "__main__":
    main()
