from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies.authentication import CurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.tariffs.dependencies import TariffServiceDep
from app.modules.tariffs.enums import TariffStatus
from app.modules.tariffs.schemas import (
    TariffCreateRequest,
    TariffResponse,
    TariffUpdateRequest,
)
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse
from app.shared.schemas.response import MessageResponse

router = APIRouter()


@router.post("", response_model=TariffResponse, status_code=status.HTTP_201_CREATED)
async def create_tariff(
    payload: TariffCreateRequest,
    _current_user: CurrentUserDep,
    tariff_service: TariffServiceDep,
) -> TariffResponse:
    return await tariff_service.create_tariff(payload)


@router.get("", response_model=PageResponse[TariffResponse])
async def list_tariffs(
    _current_user: CurrentUserDep,
    pagination: PaginationDep,
    tariff_service: TariffServiceDep,
    tariff_status: Annotated[TariffStatus | None, Query(alias="status")] = None,
) -> PageResponse[TariffResponse]:
    return await tariff_service.list_tariffs(
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
        tariff_status=tariff_status,
    )


@router.get("/{tariff_id}", response_model=TariffResponse)
async def get_tariff(
    tariff_id: ObjectIdStr,
    _current_user: CurrentUserDep,
    tariff_service: TariffServiceDep,
) -> TariffResponse:
    return await tariff_service.get_tariff(tariff_id)


@router.patch("/{tariff_id}", response_model=TariffResponse)
async def update_tariff(
    tariff_id: ObjectIdStr,
    payload: TariffUpdateRequest,
    _current_user: CurrentUserDep,
    tariff_service: TariffServiceDep,
) -> TariffResponse:
    return await tariff_service.update_tariff(tariff_id, payload)


@router.delete("/{tariff_id}", response_model=MessageResponse)
async def delete_tariff(
    tariff_id: ObjectIdStr,
    _current_user: CurrentUserDep,
    tariff_service: TariffServiceDep,
) -> MessageResponse:
    await tariff_service.delete_tariff(tariff_id)
    return MessageResponse(message="Tariff deleted.")
