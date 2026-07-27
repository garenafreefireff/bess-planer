from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies.authentication import AdminUserDep, CurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.users.dependencies import UserServiceDep
from app.modules.users.enums import UserRole, UserStatus
from app.modules.users.schemas import (
    AdminUserUpdateRequest,
    OrganizationResponse,
    OrganizationUpdateRequest,
    UserResponse,
)
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse

router = APIRouter()
organization_router = APIRouter()
admin_router = APIRouter()


@organization_router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(
    current_user: CurrentUserDep,
    user_service: UserServiceDep,
) -> OrganizationResponse:
    return await user_service.get_current_organization(user_id=current_user.id)


@organization_router.patch("/current", response_model=OrganizationResponse)
async def update_current_organization(
    payload: OrganizationUpdateRequest,
    current_user: CurrentUserDep,
    user_service: UserServiceDep,
) -> OrganizationResponse:
    return await user_service.update_current_organization(
        user_id=current_user.id,
        payload=payload,
    )


@admin_router.get("/organizations", response_model=PageResponse[OrganizationResponse])
async def list_admin_organizations(
    admin_user: AdminUserDep,
    pagination: PaginationDep,
    user_service: UserServiceDep,
    search: Annotated[str | None, Query(max_length=160)] = None,
) -> PageResponse[OrganizationResponse]:
    del admin_user
    return await user_service.list_organizations_admin(
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
        search=search,
    )


@admin_router.get("", response_model=PageResponse[UserResponse])
async def list_admin_users(
    admin_user: AdminUserDep,
    pagination: PaginationDep,
    user_service: UserServiceDep,
    status: UserStatus | None = None,
    role: UserRole | None = None,
    search: Annotated[str | None, Query(max_length=160)] = None,
) -> PageResponse[UserResponse]:
    del admin_user
    return await user_service.list_admin(
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
        status=status,
        role=role,
        search=search,
    )


@admin_router.patch("/{user_id}", response_model=UserResponse)
async def update_admin_user(
    user_id: ObjectIdStr,
    payload: AdminUserUpdateRequest,
    admin_user: AdminUserDep,
    user_service: UserServiceDep,
) -> UserResponse:
    return await user_service.update_admin(
        user_id,
        payload,
        actor_user_id=admin_user.id,
    )
