from app.db.base import Base
from app.db.seed import SAMPLE_VACANCIES, seed_vacancies
from app.models.vacancy import Vacancy
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker


def test_seed_vacancies_is_idempotent() -> None:
    """Seed data should be inserted once without creating duplicates."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    testing_session_local = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    with testing_session_local() as db:
        first_added_count = seed_vacancies(db)
        second_added_count = seed_vacancies(db)
        total = db.scalar(select(func.count(Vacancy.id)))

    assert first_added_count == len(SAMPLE_VACANCIES)
    assert second_added_count == 0
    assert total == len(SAMPLE_VACANCIES)
