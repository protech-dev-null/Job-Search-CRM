import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import utc_now
from app.models.skill import Skill, vacancy_skills

if TYPE_CHECKING:
    from app.models.activity import Activity


class Vacancy(Base):
    """Persisted job vacancy tracked by the CRM."""

    __tablename__ = "vacancies"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    company: Mapped[str] = mapped_column(String(120), nullable=False)
    position: Mapped[str] = mapped_column(String(160), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source: Mapped[str] = mapped_column(String(40), nullable=False, default="manual")
    status: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default="interesting",
    )
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    salary: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    work_format: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="remote",
    )
    skills: Mapped[list[Skill]] = relationship(
        secondary=vacancy_skills,
        back_populates="vacancies",
        order_by=Skill.normalized_name,
        lazy="selectin",
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_action: Mapped[str | None] = mapped_column(String(240), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )
    activities: Mapped[list["Activity"]] = relationship(
        back_populates="vacancy",
        cascade="all, delete-orphan",
    )
