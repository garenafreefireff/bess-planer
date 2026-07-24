from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies.authentication import CurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.datasets.dependencies import DatasetServiceDep
from app.modules.datasets.schemas import DatasetCreateRequest, DatasetResponse
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse
from app.shared.schemas.response import MessageResponse

router = APIRouter()


@router.post("", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    payload: DatasetCreateRequest,
    current_user: CurrentUserDep,
    dataset_service: DatasetServiceDep,
) -> DatasetResponse:
    return await dataset_service.create_dataset(payload, current_user.id)


@router.get("", response_model=PageResponse[DatasetResponse])
async def list_datasets(
    current_user: CurrentUserDep,
    pagination: PaginationDep,
    dataset_service: DatasetServiceDep,
    project_id: Annotated[str | None, Query(pattern=r"^[a-fA-F0-9]{24}$")] = None,
) -> PageResponse[DatasetResponse]:
    return await dataset_service.list_datasets(
        current_user.id,
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
        project_id=project_id,
    )


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: ObjectIdStr,
    current_user: CurrentUserDep,
    dataset_service: DatasetServiceDep,
) -> DatasetResponse:
    return await dataset_service.get_dataset(dataset_id, current_user.id)


@router.delete("/{dataset_id}", response_model=MessageResponse)
async def delete_dataset(
    dataset_id: ObjectIdStr,
    current_user: CurrentUserDep,
    dataset_service: DatasetServiceDep,
) -> MessageResponse:
    await dataset_service.delete_dataset(dataset_id, current_user.id)
    return MessageResponse(message="Dataset deleted.")
