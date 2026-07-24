from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies.authentication import CurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.bess_catalog.dependencies import BessCatalogServiceDep
from app.modules.bess_catalog.enums import BessCatalogStatus
from app.modules.bess_catalog.schemas import (
    BessCatalogCreateRequest,
    BessCatalogResponse,
    BessCatalogUpdateRequest,
)
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse
from app.shared.schemas.response import MessageResponse

router = APIRouter()


@router.post("", response_model=BessCatalogResponse, status_code=status.HTTP_201_CREATED)
async def create_bess_catalog_item(
    payload: BessCatalogCreateRequest,
    _current_user: CurrentUserDep,
    bess_catalog_service: BessCatalogServiceDep,
) -> BessCatalogResponse:
    return await bess_catalog_service.create_item(payload)


@router.get("", response_model=PageResponse[BessCatalogResponse])
async def list_bess_catalog_items(
    _current_user: CurrentUserDep,
    pagination: PaginationDep,
    bess_catalog_service: BessCatalogServiceDep,
    catalog_status: Annotated[BessCatalogStatus | None, Query(alias="status")] = None,
) -> PageResponse[BessCatalogResponse]:
    return await bess_catalog_service.list_items(
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
        catalog_status=catalog_status,
    )


@router.get("/{item_id}", response_model=BessCatalogResponse)
async def get_bess_catalog_item(
    item_id: ObjectIdStr,
    _current_user: CurrentUserDep,
    bess_catalog_service: BessCatalogServiceDep,
) -> BessCatalogResponse:
    return await bess_catalog_service.get_item(item_id)


@router.patch("/{item_id}", response_model=BessCatalogResponse)
async def update_bess_catalog_item(
    item_id: ObjectIdStr,
    payload: BessCatalogUpdateRequest,
    _current_user: CurrentUserDep,
    bess_catalog_service: BessCatalogServiceDep,
) -> BessCatalogResponse:
    return await bess_catalog_service.update_item(item_id, payload)


@router.delete("/{item_id}", response_model=MessageResponse)
async def delete_bess_catalog_item(
    item_id: ObjectIdStr,
    _current_user: CurrentUserDep,
    bess_catalog_service: BessCatalogServiceDep,
) -> MessageResponse:
    await bess_catalog_service.delete_item(item_id)
    return MessageResponse(message="BESS catalog item deleted.")
