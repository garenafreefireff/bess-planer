from typing import Annotated

from urllib.parse import quote

from fastapi import APIRouter, File, Form, UploadFile, status
from fastapi.responses import StreamingResponse

from app.dependencies.authentication import CurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.files.dependencies import FileServiceDep
from app.modules.files.enums import FileKind
from app.modules.files.schemas import FileResponse
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse
from app.shared.schemas.response import MessageResponse

router = APIRouter()


@router.post("", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    project_id: Annotated[str, Form(pattern=r"^[a-fA-F0-9]{24}$")],
    kind: Annotated[FileKind, Form()],
    upload: Annotated[UploadFile, File()],
    current_user: CurrentUserDep,
    file_service: FileServiceDep,
) -> FileResponse:
    return await file_service.upload_file(
        upload,
        project_id=project_id,
        kind=kind,
        user_id=current_user.id,
    )


@router.get("", response_model=PageResponse[FileResponse])
async def list_files(
    current_user: CurrentUserDep,
    pagination: PaginationDep,
    file_service: FileServiceDep,
) -> PageResponse[FileResponse]:
    return await file_service.list_files(
        current_user.id,
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
    )


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: ObjectIdStr,
    current_user: CurrentUserDep,
    file_service: FileServiceDep,
) -> FileResponse:
    return await file_service.get_file(file_id, current_user.id)


@router.get("/{file_id}/download")
async def download_file(
    file_id: ObjectIdStr,
    current_user: CurrentUserDep,
    file_service: FileServiceDep,
) -> StreamingResponse:
    content, file_document = await file_service.get_download(file_id, current_user.id)
    encoded_name = quote(file_document.original_name)
    return StreamingResponse(
        content,
        media_type=file_document.content_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_name}",
            "Content-Length": str(file_document.size_bytes),
        },
    )


@router.delete("/{file_id}", response_model=MessageResponse)
async def delete_file(
    file_id: ObjectIdStr,
    current_user: CurrentUserDep,
    file_service: FileServiceDep,
) -> MessageResponse:
    await file_service.delete_file(file_id, current_user.id)
    return MessageResponse(message="File deleted.")
