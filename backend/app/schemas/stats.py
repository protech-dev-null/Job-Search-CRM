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
