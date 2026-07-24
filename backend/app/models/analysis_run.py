from datetime import datetime
from typing import Any, ClassVar

from pydantic import Field

from app.models.base import BaseDocument
from app.modules.analyses.enums import AnalysisRunStatus, AnalysisType


class AnalysisRunDocument(BaseDocument):
    collection_name: ClassVar[str] = "analysis_runs"
    user_id: str
    project_id: str | None = None
    bess_catalog_id: str | None = None
    analysis_type: AnalysisType
    status: AnalysisRunStatus = AnalysisRunStatus.QUEUED
    progress_pct: float = 0
    input_snapshot: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)
    artifacts: dict[str, Any] = Field(default_factory=dict)
    engine_version: str
    error: dict[str, Any] | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
