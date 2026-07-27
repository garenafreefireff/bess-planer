from app.core.exceptions import AppError, NotFoundError
from app.models.organization import OrganizationDocument
from app.models.user import UserDocument
from app.modules.users.enums import UserRole, UserStatus
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import (
    AdminUserUpdateRequest,
    OrganizationResponse,
    OrganizationUpdateRequest,
    UserResponse,
)
from app.shared.schemas.pagination import PageMeta, PageResponse


class UserService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    async def ensure_registration_organization(
        self,
        *,
        user: UserDocument,
    ) -> UserDocument:
        if user.organization_id or not user.company_name or not user.id:
            return user
        existing = await self.user_repository.get_organization_for_user(user.id, None)
        organization = existing or await self.user_repository.create_organization(
            OrganizationDocument(
                owner_user_id=user.id,
                name=user.company_name,
                industry=user.industry,
                phone=user.phone,
                member_user_ids=[user.id],
            )
        )
        linked = await self.user_repository.link_user_to_organization(user.id, organization.id or "")
        return linked or user

    async def get_current_organization(
        self,
        *,
        user_id: str,
    ) -> OrganizationResponse:
        user = await self.user_repository.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found.")
        organization = await self.user_repository.get_organization_for_user(
            user.id or "",
            user.organization_id,
        )
        if organization is None:
            if not user.id:
                raise NotFoundError("Organization not found.")
            organization = await self.user_repository.create_organization(
                OrganizationDocument(
                    owner_user_id=user.id,
                    name=user.company_name or f"Workspace {user.representative_name}",
                    industry=user.industry,
                    phone=user.phone,
                    member_user_ids=[user.id],
                )
            )
            await self.user_repository.link_user_to_organization(user.id, organization.id or "")
        return OrganizationResponse.model_validate(organization)

    async def update_current_organization(
        self,
        *,
        user_id: str,
        payload: OrganizationUpdateRequest,
    ) -> OrganizationResponse:
        user = await self.user_repository.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found.")
        organization = await self.user_repository.get_organization_for_user(
            user.id or "",
            user.organization_id,
        )
        if organization is None or organization.id is None:
            raise NotFoundError("Organization not found.")
        updated = await self.user_repository.update_organization_for_owner(
            organization.id,
            user.id or "",
            payload.model_dump(exclude_unset=True),
        )
        if updated is None:
            raise AppError(
                "Chỉ chủ sở hữu organization mới có thể cập nhật thông tin.",
                code="organization_owner_required",
                status_code=403,
            )
        return OrganizationResponse.model_validate(updated)

    async def list_organizations_admin(
        self,
        *,
        page: int,
        page_size: int,
        skip: int,
        search: str | None,
    ) -> PageResponse[OrganizationResponse]:
        total = await self.user_repository.count_organizations_admin(search)
        organizations = await self.user_repository.list_organizations_admin(
            skip=skip,
            limit=page_size,
            search=search,
        )
        return PageResponse[OrganizationResponse](
            items=[OrganizationResponse.model_validate(item) for item in organizations],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def list_admin(
        self,
        *,
        page: int,
        page_size: int,
        skip: int,
        status: UserStatus | None,
        role: UserRole | None,
        search: str | None,
    ) -> PageResponse[UserResponse]:
        total = await self.user_repository.count_admin(status=status, role=role, search=search)
        users = await self.user_repository.list_admin(
            skip=skip,
            limit=page_size,
            status=status,
            role=role,
            search=search,
        )
        return PageResponse[UserResponse](
            items=[self._to_response(user) for user in users],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def update_admin(
        self,
        user_id: str,
        payload: AdminUserUpdateRequest,
        *,
        actor_user_id: str,
    ) -> UserResponse:
        updates = payload.model_dump(mode="json", exclude_unset=True)
        if user_id == actor_user_id and ("role" in updates or "status" in updates):
            raise AppError(
                "Admin không thể tự thay đổi vai trò hoặc khóa chính tài khoản đang đăng nhập.",
                code="admin_self_lockout_blocked",
            )
        user = await self.user_repository.update_admin(user_id, updates)
        if user is None:
            raise NotFoundError("User not found.")
        return self._to_response(user)

    @staticmethod
    def _to_response(user: UserDocument) -> UserResponse:
        return UserResponse.model_validate(user)
