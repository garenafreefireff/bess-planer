from fastapi import APIRouter, status

from app.dependencies.authentication import CurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.sites.dependencies import SiteServiceDep
from app.modules.sites.schemas import SiteCreateRequest, SiteResponse, SiteUpdateRequest
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse
from app.shared.schemas.response import MessageResponse

router = APIRouter()


@router.post("", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
async def create_site(
    payload: SiteCreateRequest,
    current_user: CurrentUserDep,
    site_service: SiteServiceDep,
) -> SiteResponse:
    return await site_service.create_site(payload, current_user.id)


@router.get("", response_model=PageResponse[SiteResponse])
async def list_sites(
    current_user: CurrentUserDep,
    pagination: PaginationDep,
    site_service: SiteServiceDep,
) -> PageResponse[SiteResponse]:
    return await site_service.list_sites(
        current_user.id,
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
    )


@router.get("/{site_id}", response_model=SiteResponse)
async def get_site(
    site_id: ObjectIdStr,
    current_user: CurrentUserDep,
    site_service: SiteServiceDep,
) -> SiteResponse:
    return await site_service.get_site(site_id, current_user.id)


@router.patch("/{site_id}", response_model=SiteResponse)
async def update_site(
    site_id: ObjectIdStr,
    payload: SiteUpdateRequest,
    current_user: CurrentUserDep,
    site_service: SiteServiceDep,
) -> SiteResponse:
    return await site_service.update_site(site_id, payload, current_user.id)


@router.delete("/{site_id}", response_model=MessageResponse)
async def delete_site(
    site_id: ObjectIdStr,
    current_user: CurrentUserDep,
    site_service: SiteServiceDep,
) -> MessageResponse:
    await site_service.delete_site(site_id, current_user.id)
    return MessageResponse(message="Site deleted.")
