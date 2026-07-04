from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ActivityKind(StrEnum):
    """Supported categories for vacancy history events."""

    STATUS_CHANGE = "status_change"
    NOTE = "note"
    CONTACT = "contact"
    INTERVIEW = "interview"
    TASK = "task"
    OTHER = "other"


class ActivityBase(BaseModel):
    """Shared fields for activity creation and representation."""

    kind: ActivityKind
    description: str = Field(min_length=1, max_length=2000)


class ActivityCreate(ActivityBase):
    """Payload for recording a vacancy activity."""

    occurred_at: datetime | None = None


class ActivityUpdate(BaseModel):
    """Payload for partially updating a vacancy activity."""

    kind: ActivityKind | None = None
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    occurred_at: datetime | None = None


class ActivityRead(ActivityBase):
    """Activity representation returned by the API."""

    id: str
    vacancy_id: str
    occurred_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
