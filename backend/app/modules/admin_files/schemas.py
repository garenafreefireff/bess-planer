from datetime import date, datetime
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.modules.datasets.enums import DatasetStatus, DatasetType
from app.modules.files.enums import FileKind, FileStatus
from app.modules.projects.enums import ProjectStatus, ProjectType


class AdminDatasetStatusFilter(StrEnum):
    READY = "ready"
    WARNING = "warning"
    INVALID = "invalid"
    MISSING = "missing"


class AdminFileExtension(StrEnum):
    CSV = "csv"
    XLSX = "xlsx"


class AdminFileSortBy(StrEnum):
    CREATED_AT = "created_at"
    SIZE_BYTES = "size_bytes"
    ORIGINAL_NAME = "original_name"
    VERSION = "version"


class AdminFileSortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class AdminFileOwnerSummary(BaseModel):
    id: str | None = None
    name: str
    email: str | None = None
    company_name: str | None = None


class AdminFileProjectSummary(BaseModel):
    id: str | None = None
    name: str
    project_type: ProjectType | None = None
    status: ProjectStatus | None = None


class AdminFileDatasetSummary(BaseModel):
    id: str
    dataset_type: DatasetType
    status: DatasetStatus
    version: int
    row_count: int
    valid_row_count: int
    interval_minutes: float | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    warning_count: int = 0


class AdminFileListItem(BaseModel):
    id: str
    original_name: str
    extension: AdminFileExtension
    content_type: str
    size_bytes: int
    sha256: str
    kind: FileKind
    status: FileStatus
    version: int
    supersedes_file_id: str | None = None
    created_at: datetime
    updated_at: datetime
    owner: AdminFileOwnerSummary
    project: AdminFileProjectSummary
    dataset: AdminFileDatasetSummary | None = None
    is_active: bool
    is_latest_version: bool
    analysis_reference_count: int
    can_delete: bool
    delete_block_reason: str | None = None


class AdminFilePageMeta(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)


class AdminFileListResponse(BaseModel):
    items: list[AdminFileListItem]
    meta: AdminFilePageMeta


class AdminFilePeriod(BaseModel):
    date_from: date
    date_to: date
    timezone: str


class AdminFilesUploadsTodayMetric(BaseModel):
    count: int
    total_size_bytes: int


class AdminFilesMetrics(BaseModel):
    total_files: int
    total_storage_bytes: int
    uploads_today: AdminFilesUploadsTodayMetric
    ready_datasets: int
    needs_attention: int


class AdminFileDistributionItem(BaseModel):
    key: str
    label: str
    count: int
    percentage: float


class AdminRecentUploadItem(BaseModel):
    id: str
    original_name: str
    kind: FileKind
    version: int
    size_bytes: int
    owner_name: str
    company_name: str | None = None
    project_name: str
    dataset_status: DatasetStatus | Literal["missing"]
    is_active: bool
    created_at: datetime


class AdminStorageByCompanyItem(BaseModel):
    company_name: str
    file_count: int
    storage_bytes: int
    percentage_of_total: float


class AdminFilesOverviewResponse(BaseModel):
    generated_at: datetime
    period: AdminFilePeriod
    metrics: AdminFilesMetrics
    recent_uploads: list[AdminRecentUploadItem]
    storage_by_company: list[AdminStorageByCompanyItem]
    kind_distribution: list[AdminFileDistributionItem]
    quality_distribution: list[AdminFileDistributionItem]


class AdminFileDatasetDetail(AdminFileDatasetSummary):
    quality_summary: dict[str, Any] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    columns: list[str] = Field(default_factory=list)
    timestamp_column: str | None = None
    value_column: str | None = None
    preview: list[dict[str, Any]] = Field(default_factory=list)


class AdminFileVersionSummary(BaseModel):
    id: str
    original_name: str
    version: int
    created_at: datetime


class AdminFileDetailResponse(BaseModel):
    id: str
    original_name: str
    extension: AdminFileExtension
    content_type: str
    size_bytes: int
    sha256: str
    kind: FileKind
    status: FileStatus
    version: int
    supersedes_file_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    owner: AdminFileOwnerSummary
    project: AdminFileProjectSummary
    dataset: AdminFileDatasetDetail | None = None
    is_active: bool
    is_latest_version: bool
    previous_version: AdminFileVersionSummary | None = None
    next_version: AdminFileVersionSummary | None = None
    analysis_reference_count: int
    physical_file_exists: bool
    can_download: bool
    can_delete: bool
    delete_block_reason: str | None = None
