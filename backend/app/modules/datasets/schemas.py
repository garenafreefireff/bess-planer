from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.datasets.enums import DatasetStatus, DatasetType
from app.shared.schemas.object_id import ObjectIdStr


class DatasetCreateRequest(BaseModel):
    project_id: ObjectIdStr
    file_id: ObjectIdStr
    dataset_type: DatasetType
    activate: bool = True


class DatasetResponse(BaseModel):
    id: str
    user_id: str
    project_id: str
    file_id: str
    dataset_type: DatasetType
    status: DatasetStatus
    version: int = 1
    row_count: int
    valid_row_count: int
    interval_minutes: float | None = None
    columns: list[str] = Field(default_factory=list)
    timestamp_column: str | None = None
    value_column: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    quality_summary: dict = Field(default_factory=dict)
    preview: list[dict] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
