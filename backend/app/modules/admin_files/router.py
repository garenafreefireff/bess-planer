from datetime import date
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.dependencies.authentication import AdminUserDep
from app.modules.admin_files.dependencies import AdminFilesServiceDep
from app.modules.admin_files.schemas import (
    AdminDatasetStatusFilter,
    AdminFileDetailResponse,
    AdminFileExtension,
    AdminFileListResponse,
    AdminFileSortBy,
    AdminFileSortOrder,
    AdminFilesOverviewResponse,
)
from app.modules.files.enums import FileKind, FileStatus
from app.shared.schemas.object_id import ObjectIdStr

router = APIRouter()


@router.get("", response_model=AdminFileListResponse)
async def list_admin_files(
    admin_user: AdminUserDep,
    admin_files_service: AdminFilesServiceDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
    search: Annotated[str | None, Query(max_length=160)] = None,
    kind: FileKind | None = None,
    file_status: FileStatus | None = None,
    dataset_status: AdminDatasetStatusFilter | None = None,
    extension: AdminFileExtension | None = None,
    user_id: Annotated[str | None, Query(max_length=24)] = None,
    project_id: Annotated[str | None, Query(max_length=24)] = None,
    company: Annotated[str | None, Query(max_length=160)] = None,
    active: bool | None = None,
    latest_only: bool = False,
    date_from: date | None = None,
    date_to: date | None = None,
    sort_by: AdminFileSortBy = AdminFileSortBy.CREATED_AT,
    sort_order: AdminFileSortOrder = AdminFileSortOrder.DESC,
) -> AdminFileListResponse:
    del admin_user
    return await admin_files_service.list_files(
        page=page,
        page_size=page_size,
        search=search,
        kind=kind,
        file_status=file_status,
        dataset_status=dataset_status,
        extension=extension,
        user_id=user_id,
        project_id=project_id,
        company=company,
        active=active,
        latest_only=latest_only,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/overview", response_model=AdminFilesOverviewResponse)
async def get_admin_files_overview(
    admin_user: AdminUserDep,
    admin_files_service: AdminFilesServiceDep,
    date_from: date | None = None,
    date_to: date | None = None,
    timezone: Annotated[str, Query(min_length=1, max_length=80)] = "Asia/Ho_Chi_Minh",
) -> AdminFilesOverviewResponse:
    del admin_user
    return await admin_files_service.get_overview(
        date_from=date_from,
        date_to=date_to,
        timezone=timezone,
    )


@router.get("/{file_id}", response_model=AdminFileDetailResponse)
async def get_admin_file_detail(
    file_id: ObjectIdStr,
    admin_user: AdminUserDep,
    admin_files_service: AdminFilesServiceDep,
) -> AdminFileDetailResponse:
    del admin_user
    return await admin_files_service.get_detail(file_id)


@router.get("/{file_id}/download")
async def download_admin_file(
    file_id: ObjectIdStr,
    admin_user: AdminUserDep,
    admin_files_service: AdminFilesServiceDep,
) -> StreamingResponse:
    del admin_user
    download = await admin_files_service.get_download(file_id)
    encoded_name = quote(download.original_name)
    return StreamingResponse(
        download.content,
        media_type=download.content_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_name}",
            "Content-Length": str(download.size_bytes),
        },
    )
