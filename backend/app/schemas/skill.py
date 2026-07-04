from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SkillRead(BaseModel):
    """Canonical skill representation returned by the API."""

    id: str
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
