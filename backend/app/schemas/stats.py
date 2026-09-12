from pydantic import BaseModel, Field


class SkillStat(BaseModel):
    """Aggregated usage count for a vacancy skill."""

    name: str
    count: int = Field(ge=1)


class StatsRead(BaseModel):
    """Dashboard statistics calculated from stored vacancies."""

    total: int = Field(ge=0)
    by_status: dict[str, int]
    by_priority: dict[str, int]
    top_skills: list[SkillStat]
    due_today: int = Field(ge=0)
    overdue_actions: int = Field(ge=0)
    applied_to_interview_conversion: float | None = Field(default=None, ge=0, le=100)
    average_days_by_status: dict[str, float]
