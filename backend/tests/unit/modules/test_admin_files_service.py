from datetime import UTC, date, datetime
from typing import Any

import pytest

from app.core.exceptions import NotFoundError
from app.modules.admin_files.schemas import AdminDatasetStatusFilter
from app.modules.admin_files.service import AdminFilesService
from app.modules.files.enums import FileKind


def utc(year: int, month: int, day: int, hour: int = 0) -> datetime:
    return datetime(year, month, day, hour, tzinfo=UTC)


class FakeStorage:
    def __init__(self) -> None:
        self.contents = {"u1/p1/file.csv": b"timestamp,value\n2026-01-01,10\n"}

    def exists(self, storage_path: str) -> bool:
        return storage_path in self.contents

    def iter_bytes(self, storage_path: str, *, chunk_size: int = 1024 * 1024):
        yield self.contents[storage_path]


class FakeAdminFilesRepository:
    def __init__(self) -> None:
        self.rows = [active_old_file(), latest_file(), missing_dataset_file()]

    async def list_files(self, **kwargs: Any):
        rows = self.rows
        dataset_status = kwargs.get("dataset_status")
        if dataset_status == AdminDatasetStatusFilter.MISSING:
            rows = [row for row in rows if row.get("dataset_doc") is None]
        kind = kwargs.get("kind")
        if kind is not None:
            rows = [row for row in rows if row["kind"] == kind.value]
        latest_only = kwargs.get("latest_only")
        if latest_only:
            rows = [row for row in rows if row["is_latest_version"]]
        active = kwargs.get("active")
        if active is not None:
            rows = [row for row in rows if row["is_active"] is active]
        return rows, len(rows)

    async def overview_totals(self, **kwargs: Any):
        return {
            "total_files": 3,
            "total_storage_bytes": 600,
            "uploads_today_count": 1,
            "uploads_today_size_bytes": 300,
            "ready_datasets": 1,
            "needs_attention": 2,
        }

    async def recent_uploads(self, *, limit: int):
        return self.rows[:limit]

    async def storage_by_company(self, *, limit: int):
        return [
            {"_id": "Alpha", "file_count": 2, "storage_bytes": 500},
            {"_id": "Chưa cập nhật công ty", "file_count": 1, "storage_bytes": 100},
        ][:limit]

    async def kind_distribution(self):
        return {"load_profile": 2, "pv_profile": 1, "other": 0}

    async def quality_distribution(self):
        return {"ready": 1, "warning": 1, "invalid": 0, "missing": 1}

    async def get_file_detail(self, file_id: str):
        return next((row for row in self.rows if row["_id"] == file_id), None)

    async def get_storage_document(self, file_id: str):
        row = await self.get_file_detail(file_id)
        return row


def active_old_file() -> dict[str, Any]:
    return {
        "_id": "file-active-old",
        "original_name": "load_v1.csv",
        "extension": "csv",
        "content_type": "text/csv",
        "size_bytes": 100,
        "sha256": "a" * 64,
        "kind": "load_profile",
        "status": "validated",
        "version": 1,
        "created_at": utc(2026, 7, 1),
        "updated_at": utc(2026, 7, 1),
        "storage_path": "u1/p1/file.csv",
        "owner_doc": {"_id": "u1", "email": "a@example.com", "representative_name": "Admin A", "company_name": "Alpha"},
        "project_doc": {"_id": "p1", "name": "Project A", "project_type": "bess_planning", "status": "active"},
        "dataset_doc": {"_id": "d1", "dataset_type": "load_profile", "status": "ready", "version": 1, "row_count": 10, "valid_row_count": 10, "quality_summary": {}},
        "is_active": True,
        "is_latest_version": False,
        "analysis_reference_count": 0,
    }


def latest_file() -> dict[str, Any]:
    row = active_old_file().copy()
    row.update({"_id": "file-latest", "original_name": "load_v2.csv", "version": 2, "is_active": False, "is_latest_version": True, "analysis_reference_count": 2})
    row["dataset_doc"] = {"_id": "d2", "dataset_type": "load_profile", "status": "warning", "version": 2, "row_count": 10, "valid_row_count": 8, "quality_summary": {"warnings": ["missing rows"]}}
    return row


def missing_dataset_file() -> dict[str, Any]:
    row = active_old_file().copy()
    row.update({"_id": "file-missing", "original_name": "pv.xlsx", "extension": "xlsx", "kind": "pv_profile", "version": 1, "dataset_doc": None, "is_active": False, "is_latest_version": True, "storage_path": "missing/path.xlsx"})
    return row


@pytest.mark.asyncio
async def test_list_admin_files_maps_active_and_latest_independently() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    response = await service.list_files(page=1, page_size=20)

    assert response.items[0].is_active is True
    assert response.items[0].is_latest_version is False
    assert response.items[1].is_active is False
    assert response.items[1].is_latest_version is True


@pytest.mark.asyncio
async def test_missing_dataset_is_returned_as_null_and_filterable() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    response = await service.list_files(page=1, page_size=20, dataset_status=AdminDatasetStatusFilter.MISSING)

    assert response.meta.total == 1
    assert response.items[0].dataset is None


@pytest.mark.asyncio
async def test_latest_only_does_not_mean_active_only() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    response = await service.list_files(page=1, page_size=20, latest_only=True)

    assert {item.id for item in response.items} == {"file-latest", "file-missing"}
    assert all(item.is_latest_version for item in response.items)


@pytest.mark.asyncio
async def test_filter_active_uses_project_pointer_state() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    response = await service.list_files(page=1, page_size=20, active=True)

    assert [item.id for item in response.items] == ["file-active-old"]


@pytest.mark.asyncio
async def test_overview_metrics_are_from_repository_totals() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    overview = await service.get_overview(date_from=date(2026, 7, 1), date_to=date(2026, 7, 28))

    assert overview.metrics.total_files == 3
    assert overview.metrics.total_storage_bytes == 600
    assert overview.metrics.uploads_today.count == 1
    assert overview.metrics.ready_datasets == 1
    assert overview.metrics.needs_attention == 2


@pytest.mark.asyncio
async def test_quality_distribution_keeps_warning_and_missing_separate() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    overview = await service.get_overview(date_from=date(2026, 7, 1), date_to=date(2026, 7, 28))

    counts = {item.key: item.count for item in overview.quality_distribution}
    assert counts["ready"] == 1
    assert counts["warning"] == 1
    assert counts["missing"] == 1


@pytest.mark.asyncio
async def test_storage_by_company_uses_file_size_bytes() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    overview = await service.get_overview(date_from=date(2026, 7, 1), date_to=date(2026, 7, 28))

    assert overview.storage_by_company[0].company_name == "Alpha"
    assert overview.storage_by_company[0].storage_bytes == 500
    assert overview.storage_by_company[1].company_name == "Chưa cập nhật công ty"


@pytest.mark.asyncio
async def test_detail_does_not_expose_storage_path() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    detail = await service.get_detail("file-active-old")

    assert not hasattr(detail, "storage_path")
    assert detail.physical_file_exists is True
    assert detail.can_download is True


@pytest.mark.asyncio
async def test_download_streams_existing_storage_object() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    download = await service.get_download("file-active-old")

    assert download.original_name == "load_v1.csv"
    assert b"".join(download.content).startswith(b"timestamp")


@pytest.mark.asyncio
async def test_download_missing_physical_file_returns_clear_error() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    with pytest.raises(NotFoundError, match="File vật lý"):
        await service.get_download("file-missing")


@pytest.mark.asyncio
async def test_filter_kind_uses_file_kind() -> None:
    service = AdminFilesService(FakeAdminFilesRepository(), FakeStorage())  # type: ignore[arg-type]

    response = await service.list_files(page=1, page_size=20, kind=FileKind.PV_PROFILE)

    assert [item.kind for item in response.items] == [FileKind.PV_PROFILE]
