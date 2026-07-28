from typing import ClassVar

from pydantic import Field

from app.models.base import BaseDocument
from app.modules.files.enums import FileKind, FileStatus


class FileDocument(BaseDocument):
    collection_name: ClassVar[str] = "files"
    user_id: str
    project_id: str
    original_name: str
    storage_name: str
    storage_path: str
    content_type: str
    extension: str
    size_bytes: int
    sha256: str
    kind: FileKind
    status: FileStatus = FileStatus.UPLOADED
    version: int = 1
    supersedes_file_id: str | None = None
    metadata: dict = Field(default_factory=dict)
