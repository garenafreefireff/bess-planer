import asyncio
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta, timezone as datetime_timezone, tzinfo
from math import ceil
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.core.exceptions import AppError, NotFoundError
from app.core.security import utc_now
from app.dependencies.storage import StorageClient
from app.modules.admin_files.repository import UNKNOWN_COMPANY, AdminFilesRepository
from app.modules.admin_files.schemas import (
    AdminDatasetStatusFilter,
    AdminFileDatasetDetail,
    AdminFileDatasetSummary,
    AdminFileDetailResponse,
    AdminFileDistributionItem,
    AdminFileExtension,
    AdminFileListItem,
    AdminFileListResponse,
    AdminFileOwnerSummary,
    AdminFilePageMeta,
    AdminFilePeriod,
    AdminFileProjectSummary,
    AdminFileSortBy,
    AdminFileSortOrder,
    AdminFilesMetrics,
    AdminFilesOverviewResponse,
    AdminFilesUploadsTodayMetric,
    AdminRecentUploadItem,
    AdminStorageByCompanyItem,
    AdminFileVersionSummary,
)
from app.modules.files.enums import FileKind, FileStatus

DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh"
MAX_SEARCH_LENGTH = 160
MAX_OVERVIEW_RANGE_DAYS = 366
QUALITY_LABELS = {
    "ready": "Sẵn sàng",
    "warning": "Có cảnh báo",
    "invalid": "Không hợp lệ",
    "missing": "Chưa tạo dataset",
}
KIND_LABELS = {
    "load_profile": "Dữ liệu phụ tải",
    "pv_profile": "Dữ liệu PV",
    "other": "Khác",
}


@dataclass(frozen=True)
class AdminFileDownload:
    content: Iterator[bytes]
    original_name: str
    content_type: str
    size_bytes: int


@dataclass(frozen=True)
class AdminFileWindow:
    date_from: date
    date_to: date
    timezone_name: str
    zone: tzinfo
    start_utc: datetime
    end_utc: datetime


class AdminFilesService:
    def __init__(
        self,
        repository: AdminFilesRepository,
        storage_client: StorageClient,
    ) -> None:
        self.repository = repository
        self.storage_client = storage_client

    async def list_files(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        kind: FileKind | None = None,
        file_status: FileStatus | None = None,
        dataset_status: AdminDatasetStatusFilter | None = None,
        extension: AdminFileExtension | None = None,
        user_id: str | None = None,
        project_id: str | None = None,
        company: str | None = None,
        active: bool | None = None,
        latest_only: bool = False,
        date_from: date | None = None,
        date_to: date | None = None,
        sort_by: AdminFileSortBy = AdminFileSortBy.CREATED_AT,
        sort_order: AdminFileSortOrder = AdminFileSortOrder.DESC,
    ) -> AdminFileListResponse:
        if date_from and date_to and date_from > date_to:
            raise AppError("date_from không được lớn hơn date_to.", code="invalid_date_range")
        start_utc = datetime.combine(date_from, time.min, tzinfo=UTC) if date_from else None
        end_utc = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC) if date_to else None
        normalized_search = _normalize_search(search)
        normalized_company = _normalize_search(company)
        rows, total = await self.repository.list_files(
            page=page,
            page_size=page_size,
            search=normalized_search,
            kind=kind,
            file_status=file_status,
            dataset_status=dataset_status,
            extension=extension,
            user_id=user_id,
            project_id=project_id,
            company=normalized_company,
            active=active,
            latest_only=latest_only,
            date_from_utc=start_utc,
            date_to_utc=end_utc,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return AdminFileListResponse(
            items=[self._to_list_item(row) for row in rows],
            meta=AdminFilePageMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=ceil(total / page_size) if total else 0,
            ),
        )

    async def get_overview(
        self,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        timezone: str = DEFAULT_TIMEZONE,
    ) -> AdminFilesOverviewResponse:
        window = _build_window(date_from=date_from, date_to=date_to, timezone_name=timezone)
        today_local = utc_now().astimezone(window.zone).date()
        today_start_utc = datetime.combine(today_local, time.min, tzinfo=window.zone).astimezone(UTC)
        today_end_utc = datetime.combine(today_local + timedelta(days=1), time.min, tzinfo=window.zone).astimezone(UTC)
        totals = await self.repository.overview_totals(
            today_start_utc=today_start_utc,
            today_end_utc=today_end_utc,
        )
        recent_rows = await self.repository.recent_uploads(limit=5)
        storage_rows = await self.repository.storage_by_company(limit=6)
        kind_counts = await self.repository.kind_distribution()
        quality_counts = await self.repository.quality_distribution()
        total_storage = totals["total_storage_bytes"]
        return AdminFilesOverviewResponse(
            generated_at=utc_now(),
            period=AdminFilePeriod(
                date_from=window.date_from,
                date_to=window.date_to,
                timezone=window.timezone_name,
            ),
            metrics=AdminFilesMetrics(
                total_files=totals["total_files"],
                total_storage_bytes=total_storage,
                uploads_today=AdminFilesUploadsTodayMetric(
                    count=totals["uploads_today_count"],
                    total_size_bytes=totals["uploads_today_size_bytes"],
                ),
                ready_datasets=totals["ready_datasets"],
                needs_attention=totals["needs_attention"],
            ),
            recent_uploads=[self._to_recent_upload(row) for row in recent_rows],
            storage_by_company=[
                AdminStorageByCompanyItem(
                    company_name=str(row.get("_id") or row.get("company_name") or UNKNOWN_COMPANY),
                    file_count=int(row.get("file_count") or 0),
                    storage_bytes=int(row.get("storage_bytes") or 0),
                    percentage_of_total=_percentage(int(row.get("storage_bytes") or 0), total_storage),
                )
                for row in storage_rows
            ],
            kind_distribution=_distribution(kind_counts, KIND_LABELS),
            quality_distribution=_distribution(quality_counts, QUALITY_LABELS),
        )

    async def get_detail(self, file_id: str) -> AdminFileDetailResponse:
        row = await self.repository.get_file_detail(file_id)
        if row is None:
            raise NotFoundError("File not found.")
        storage_path = row.get("storage_path")
        physical_exists = False
        if isinstance(storage_path, str) and storage_path:
            physical_exists = await asyncio.to_thread(self.storage_client.exists, storage_path)
        list_item = self._to_list_item(row)
        return AdminFileDetailResponse(
            id=list_item.id,
            original_name=list_item.original_name,
            extension=list_item.extension,
            content_type=list_item.content_type,
            size_bytes=list_item.size_bytes,
            sha256=list_item.sha256,
            kind=list_item.kind,
            status=list_item.status,
            version=list_item.version,
            supersedes_file_id=list_item.supersedes_file_id,
            metadata=_safe_dict(row.get("metadata")),
            created_at=list_item.created_at,
            updated_at=list_item.updated_at,
            owner=list_item.owner,
            project=list_item.project,
            dataset=self._to_dataset_detail(row.get("dataset_doc")),
            is_active=list_item.is_active,
            is_latest_version=list_item.is_latest_version,
            previous_version=_to_version_summary(row.get("previous_version_doc")),
            next_version=_to_version_summary(row.get("next_version_doc")),
            analysis_reference_count=list_item.analysis_reference_count,
            physical_file_exists=physical_exists,
            can_download=physical_exists,
            can_delete=False,
            delete_block_reason=list_item.delete_block_reason,
        )

    async def get_download(self, file_id: str) -> AdminFileDownload:
        row = await self.repository.get_storage_document(file_id)
        if row is None:
            raise NotFoundError("File not found.")
        storage_path = row.get("storage_path")
        if not isinstance(storage_path, str) or not storage_path:
            raise NotFoundError("File vật lý không còn tồn tại.")
        exists = await asyncio.to_thread(self.storage_client.exists, storage_path)
        if not exists:
            raise NotFoundError("File vật lý không còn tồn tại.")
        return AdminFileDownload(
            content=self.storage_client.iter_bytes(storage_path),
            original_name=str(row.get("original_name") or "download.bin"),
            content_type=str(row.get("content_type") or "application/octet-stream"),
            size_bytes=int(row.get("size_bytes") or 0),
        )

    def _to_list_item(self, row: dict[str, Any]) -> AdminFileListItem:
        dataset_doc = row.get("dataset_doc") if isinstance(row.get("dataset_doc"), dict) else None
        analysis_count = int(row.get("analysis_reference_count") or 0)
        is_active = bool(row.get("is_active"))
        return AdminFileListItem(
            id=str(row.get("_id") or ""),
            original_name=str(row.get("original_name") or "Không tên"),
            extension=AdminFileExtension(str(row.get("extension") or "csv")),
            content_type=str(row.get("content_type") or "application/octet-stream"),
            size_bytes=int(row.get("size_bytes") or 0),
            sha256=str(row.get("sha256") or ""),
            kind=FileKind(str(row.get("kind") or FileKind.OTHER.value)),
            status=FileStatus(str(row.get("status") or FileStatus.UPLOADED.value)),
            version=int(row.get("version") or 1),
            supersedes_file_id=_optional_str(row.get("supersedes_file_id")),
            created_at=_datetime_value(row.get("created_at")),
            updated_at=_datetime_value(row.get("updated_at")),
            owner=_owner_summary(row.get("owner_doc")),
            project=_project_summary(row.get("project_doc")),
            dataset=self._to_dataset_summary(dataset_doc),
            is_active=is_active,
            is_latest_version=bool(row.get("is_latest_version")),
            analysis_reference_count=analysis_count,
            can_delete=False,
            delete_block_reason=_delete_block_reason(
                has_dataset=dataset_doc is not None,
                is_active=is_active,
                analysis_reference_count=analysis_count,
            ),
        )

    def _to_recent_upload(self, row: dict[str, Any]) -> AdminRecentUploadItem:
        list_item = self._to_list_item(row)
        dataset_status = list_item.dataset.status if list_item.dataset else "missing"
        return AdminRecentUploadItem(
            id=list_item.id,
            original_name=list_item.original_name,
            kind=list_item.kind,
            version=list_item.version,
            size_bytes=list_item.size_bytes,
            owner_name=list_item.owner.name,
            company_name=list_item.owner.company_name,
            project_name=list_item.project.name,
            dataset_status=dataset_status,
            is_active=list_item.is_active,
            created_at=list_item.created_at,
        )

    def _to_dataset_summary(self, dataset_doc: dict[str, Any] | None) -> AdminFileDatasetSummary | None:
        if dataset_doc is None:
            return None
        return AdminFileDatasetSummary(
            id=str(dataset_doc.get("_id") or ""),
            dataset_type=dataset_doc.get("dataset_type") or FileKind.LOAD_PROFILE.value,
            status=dataset_doc.get("status") or "invalid",
            version=int(dataset_doc.get("version") or 1),
            row_count=int(dataset_doc.get("row_count") or 0),
            valid_row_count=int(dataset_doc.get("valid_row_count") or 0),
            interval_minutes=dataset_doc.get("interval_minutes"),
            start_at=dataset_doc.get("start_at"),
            end_at=dataset_doc.get("end_at"),
            warning_count=_warning_count(dataset_doc),
        )

    def _to_dataset_detail(self, dataset_doc: dict[str, Any] | None) -> AdminFileDatasetDetail | None:
        summary = self._to_dataset_summary(dataset_doc)
        if summary is None or dataset_doc is None:
            return None
        quality_summary = _safe_dict(dataset_doc.get("quality_summary"))
        return AdminFileDatasetDetail(
            **summary.model_dump(),
            quality_summary=quality_summary,
            warnings=_warning_messages(dataset_doc),
            columns=_safe_str_list(dataset_doc.get("columns")),
            timestamp_column=_optional_str(dataset_doc.get("timestamp_column")),
            value_column=_optional_str(dataset_doc.get("value_column")),
            preview=_preview_rows(dataset_doc.get("preview")),
        )


def _normalize_search(value: str | None) -> str | None:
    normalized = (value or "").strip()
    if not normalized:
        return None
    return normalized[:MAX_SEARCH_LENGTH]


def _build_window(*, date_from: date | None, date_to: date | None, timezone_name: str) -> AdminFileWindow:
    zone = _validate_timezone(timezone_name)
    now_local = utc_now().astimezone(zone)
    effective_date_to = date_to or now_local.date()
    effective_date_from = date_from or effective_date_to.replace(day=1)
    if effective_date_from > effective_date_to:
        raise AppError("date_from không được lớn hơn date_to.", code="invalid_date_range")
    if (effective_date_to - effective_date_from).days + 1 > MAX_OVERVIEW_RANGE_DAYS:
        raise AppError("Khoảng thời gian không được vượt quá 366 ngày.", code="date_range_too_large")
    start_utc = datetime.combine(effective_date_from, time.min, tzinfo=zone).astimezone(UTC)
    end_utc = datetime.combine(effective_date_to + timedelta(days=1), time.min, tzinfo=zone).astimezone(UTC)
    return AdminFileWindow(
        date_from=effective_date_from,
        date_to=effective_date_to,
        timezone_name=timezone_name,
        zone=zone,
        start_utc=start_utc,
        end_utc=end_utc,
    )


def _validate_timezone(timezone_name: str) -> tzinfo:
    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        if timezone_name == DEFAULT_TIMEZONE:
            return datetime_timezone(timedelta(hours=7), DEFAULT_TIMEZONE)
        raise AppError("Timezone không hợp lệ.", code="invalid_timezone") from exc


def _owner_summary(value: Any) -> AdminFileOwnerSummary:
    owner = value if isinstance(value, dict) else {}
    name = str(owner.get("representative_name") or owner.get("email") or "Không xác định")
    return AdminFileOwnerSummary(
        id=_optional_str(owner.get("_id")),
        name=name,
        email=_optional_str(owner.get("email")),
        company_name=_optional_str(owner.get("company_name")),
    )


def _project_summary(value: Any) -> AdminFileProjectSummary:
    project = value if isinstance(value, dict) else {}
    project_type = project.get("project_type")
    status = project.get("status")
    return AdminFileProjectSummary(
        id=_optional_str(project.get("_id")),
        name=str(project.get("name") or "Không tìm thấy dự án"),
        project_type=project_type if project_type else None,
        status=status if status else None,
    )


def _delete_block_reason(*, has_dataset: bool, is_active: bool, analysis_reference_count: int) -> str:
    if is_active:
        return "active_dataset"
    if analysis_reference_count > 0:
        return "dataset_used_by_analysis"
    if has_dataset:
        return "dataset_exists"
    return "admin_delete_disabled"


def _warning_count(dataset_doc: dict[str, Any]) -> int:
    summary = _safe_dict(dataset_doc.get("quality_summary"))
    value = summary.get("warning_count") or summary.get("warnings_count")
    if isinstance(value, int | float):
        return int(value)
    warnings = _warning_messages(dataset_doc)
    if warnings:
        return len(warnings)
    return 1 if dataset_doc.get("status") == "warning" else 0


def _warning_messages(dataset_doc: dict[str, Any]) -> list[str]:
    summary = _safe_dict(dataset_doc.get("quality_summary"))
    candidates = [summary.get("warnings"), summary.get("warning_messages"), summary.get("issues")]
    messages: list[str] = []
    for candidate in candidates:
        if isinstance(candidate, list):
            for item in candidate:
                if isinstance(item, str):
                    messages.append(item)
                elif isinstance(item, dict):
                    message = item.get("message") or item.get("detail") or item.get("reason")
                    if message:
                        messages.append(str(message))
    if not messages and dataset_doc.get("status") == "warning":
        messages.append("Dataset có cảnh báo chất lượng.")
    if not messages and dataset_doc.get("status") == "invalid":
        messages.append("Dataset không hợp lệ.")
    return messages


def _preview_rows(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [row for row in value[:10] if isinstance(row, dict)]


def _safe_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _safe_str_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item) for item in value]


def _optional_str(value: Any) -> str | None:
    if value is None or value == "":
        return None
    return str(value)


def _datetime_value(value: Any) -> datetime:
    return value if isinstance(value, datetime) else utc_now()


def _to_version_summary(value: Any) -> AdminFileVersionSummary | None:
    if not isinstance(value, dict) or not value:
        return None
    return AdminFileVersionSummary(
        id=str(value.get("_id") or ""),
        original_name=str(value.get("original_name") or "Không tên"),
        version=int(value.get("version") or 1),
        created_at=_datetime_value(value.get("created_at")),
    )


def _percentage(value: int, total: int) -> float:
    if total <= 0:
        return 0
    return round(value / total * 100, 1)


def _distribution(counts: dict[str, int], labels: dict[str, str]) -> list[AdminFileDistributionItem]:
    total = sum(counts.values())
    return [
        AdminFileDistributionItem(
            key=key,
            label=label,
            count=int(counts.get(key, 0)),
            percentage=_percentage(int(counts.get(key, 0)), total),
        )
        for key, label in labels.items()
    ]
