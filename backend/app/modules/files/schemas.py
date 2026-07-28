from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.files.enums import FileKind, FileStatus


class FileResponse(BaseModel):
    id: str
    user_id: str
    project_id: str
    original_name: str
    storage_name: str
    content_type: str
    extension: str
    size_bytes: int
    sha256: str
    kind: FileKind
    status: FileStatus
    version: int = 1
    supersedes_file_id: str | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
