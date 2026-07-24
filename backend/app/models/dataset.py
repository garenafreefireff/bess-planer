from datetime import datetime
from typing import ClassVar

from pydantic import Field

from app.models.base import BaseDocument
from app.modules.datasets.enums import DatasetStatus, DatasetType


class DatasetDocument(BaseDocument):
    collection_name: ClassVar[str] = "datasets"
    user_id: str
    project_id: str
    file_id: str
    dataset_type: DatasetType
    status: DatasetStatus
    row_count: int = 0
    valid_row_count: int = 0
    interval_minutes: float | None = None
    columns: list[str] = Field(default_factory=list)
    timestamp_column: str | None = None
    value_column: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    quality_summary: dict = Field(default_factory=dict)
    preview: list[dict] = Field(default_factory=list)
