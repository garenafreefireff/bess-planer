from enum import StrEnum


class AnalysisType(StrEnum):
    QUICK_SIZING = "quick_sizing"
    BESS_PLANNER = "bess_planning"
    TECHNICAL = "technical"
    FINANCIAL = "financial"


class AnalysisRunStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
