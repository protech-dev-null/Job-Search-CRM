from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class VacancySource(StrEnum):
    """Supported places where a vacancy can be found."""

    HH = "hh"
    LINKEDIN = "linkedin"
    TELEGRAM = "telegram"
    MANUAL = "manual"
    OTHER = "other"


class VacancyStatus(StrEnum):
    """Supported workflow statuses for a vacancy."""

    INTERESTING = "interesting"
    APPLIED = "applied"
    INTERVIEW = "interview"
    TEST = "test"
    OFFER = "offer"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class VacancyPriority(StrEnum):
    """Supported priority levels for a vacancy."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class WorkFormat(StrEnum):
    """Supported work formats for a vacancy."""

    REMOTE = "remote"
    OFFICE = "office"
    HYBRID = "hybrid"


class VacancyFilters(BaseModel):
    """Optional query parameters for filtering the vacancy list."""

    search: str | None = Field(default=None, max_length=120)
    status: VacancyStatus | None = None
    priority: VacancyPriority | None = None
    work_format: WorkFormat | None = None
    source: VacancySource | None = None
    skill: str | None = Field(default=None, max_length=80)

    @field_validator("search", "skill")
    @classmethod
    def strip_non_empty_text(cls, value: str | None) -> str | None:
        """Trim optional text filters and reject blank values."""
        if value is None:
            return None

        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("value must not be blank")

        return stripped_value


class VacancyBase(BaseModel):
    """Shared vacancy fields used by create and read schemas."""

    company: str = Field(min_length=1, max_length=120)
    position: str = Field(min_length=1, max_length=160)
    url: str | None = Field(default=None, max_length=500)
    source: VacancySource = VacancySource.MANUAL
    status: VacancyStatus = VacancyStatus.INTERESTING
    priority: VacancyPriority = VacancyPriority.MEDIUM
    salary: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=120)
    work_format: WorkFormat = WorkFormat.REMOTE
    skills: list[str] = Field(default_factory=list)
    notes: str | None = None
    next_action: str | None = Field(default=None, max_length=240)


class VacancyCreate(VacancyBase):
    """Payload for creating a vacancy."""

    pass


class VacancyUpdate(BaseModel):
    """Payload for partially updating a vacancy."""

    company: str | None = Field(default=None, min_length=1, max_length=120)
    position: str | None = Field(default=None, min_length=1, max_length=160)
    url: str | None = Field(default=None, max_length=500)
    source: VacancySource | None = None
    status: VacancyStatus | None = None
    priority: VacancyPriority | None = None
    salary: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=120)
    work_format: WorkFormat | None = None
    skills: list[str] | None = None
    notes: str | None = None
    next_action: str | None = Field(default=None, max_length=240)


class VacancyRead(VacancyBase):
    """Vacancy representation returned by the API."""

    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
