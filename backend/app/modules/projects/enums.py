from enum import StrEnum


class ProjectType(StrEnum):
    QUICK_SIZING = "quick_sizing"
    BESS_PLANNING = "bess_planning"


class ProjectStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
