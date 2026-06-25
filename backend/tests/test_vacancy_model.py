from app.db.base import Base
from app.models.vacancy import Vacancy
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker


def test_vacancy_table_is_registered() -> None:
    assert "vacancies" in Base.metadata.tables


def test_vacancy_model_can_be_persisted() -> None:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    testing_session_local = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    Base.metadata.create_all(bind=engine)

    with testing_session_local() as db:
        vacancy = Vacancy(
            company="Orbit Labs",
            position="React Developer",
            skills=["React", "TypeScript"],
        )

        db.add(vacancy)
        db.commit()

        saved_vacancy = db.scalar(select(Vacancy).where(Vacancy.id == vacancy.id))

    assert saved_vacancy is not None
    assert saved_vacancy.company == "Orbit Labs"
    assert saved_vacancy.position == "React Developer"
    assert saved_vacancy.status == "interesting"
    assert saved_vacancy.priority == "medium"
    assert saved_vacancy.work_format == "remote"
    assert saved_vacancy.skills == ["React", "TypeScript"]
    assert saved_vacancy.created_at is not None
    assert saved_vacancy.updated_at is not None
