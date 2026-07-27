import logging
from datetime import timedelta

from app.core.config import Settings
from app.core.exceptions import UnauthorizedError
from app.core.security import (
    TokenError,
    create_signed_token,
    decode_signed_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    utc_now,
    verify_password,
)
from app.models.auth_session import AuthSessionDocument
from app.models.user import UserDocument
from app.modules.auth.enums import AuthTokenType
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import (
    AuthTokenResponse,
    AuthUserResponse,
    LoginRequest,
    RegisterRequest,
)
from app.modules.leads.service import LeadService
from app.modules.users.enums import UserStatus
from app.modules.users.service import UserService

logger = logging.getLogger(__name__)


class ClientMetadata:
    def __init__(self, *, user_agent: str | None = None, ip_address: str | None = None) -> None:
        self.user_agent = user_agent
        self.ip_address = ip_address


class AuthService:
    def __init__(
        self,
        auth_repository: AuthRepository,
        settings: Settings,
        lead_service: LeadService,
        user_service: UserService,
    ) -> None:
        self.auth_repository = auth_repository
        self.settings = settings
        self.lead_service = lead_service
        self.user_service = user_service

    async def register(
        self,
        payload: RegisterRequest,
        metadata: ClientMetadata,
    ) -> AuthTokenResponse:
        user = UserDocument(
            email=payload.email,
            password_hash=hash_password(
                payload.password,
                iterations=self.settings.password_hash_iterations,
            ),
            company_name=payload.company_name,
            representative_name=payload.representative_name,
            phone=payload.phone,
            industry=payload.industry,
        )
        created_user = await self.auth_repository.create_user(user)
        try:
            created_user = await self.user_service.ensure_registration_organization(user=created_user)
        except Exception:
            logger.exception("Could not create organization for registered user.")
        try:
            await self.lead_service.capture_registration(
                user_id=created_user.id or "",
                email=created_user.email,
                full_name=created_user.representative_name,
                phone=created_user.phone,
                company_name=created_user.company_name,
                industry=created_user.industry,
            )
        except Exception:
            logger.exception("Could not synchronize registration into lead pipeline.")
        return await self._issue_token_pair(created_user, metadata)

    async def login(
        self,
        payload: LoginRequest,
        metadata: ClientMetadata,
    ) -> AuthTokenResponse:
        user = await self.auth_repository.get_user_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedError("Email or password is incorrect.")
        if user.status != UserStatus.ACTIVE:
            raise UnauthorizedError("User account is inactive.")

        return await self._issue_token_pair(user, metadata)

    async def refresh(
        self,
        refresh_token: str,
        metadata: ClientMetadata,
    ) -> AuthTokenResponse:
        session = await self.auth_repository.get_session_by_refresh_token_hash(
            hash_token(refresh_token)
        )
        if session is None:
            raise UnauthorizedError("Refresh token is invalid or expired.")

        user = await self.auth_repository.get_user_by_id(session.user_id)
        if user is None or user.status != UserStatus.ACTIVE:
            raise UnauthorizedError("User account is unavailable.")

        await self.auth_repository.revoke_session(session.id or "", utc_now())
        return await self._issue_token_pair(user, metadata)

    async def logout(self, refresh_token: str) -> None:
        session = await self.auth_repository.get_session_by_refresh_token_hash(
            hash_token(refresh_token)
        )
        if session is not None:
            await self.auth_repository.revoke_session(session.id or "", utc_now())

    async def get_user_from_access_token(self, access_token: str) -> AuthUserResponse:
        try:
            claims = decode_signed_token(
                access_token,
                secret_key=self.settings.auth_secret_key,
            )
        except TokenError as exc:
            raise UnauthorizedError("Access token is invalid or expired.") from exc

        if claims.get("type") != AuthTokenType.ACCESS:
            raise UnauthorizedError("Access token is invalid.")

        user_id = claims.get("sub")
        if not isinstance(user_id, str):
            raise UnauthorizedError("Access token is invalid.")

        user = await self.auth_repository.get_user_by_id(user_id)
        if user is None or user.status != UserStatus.ACTIVE:
            raise UnauthorizedError("User account is unavailable.")

        return self._to_user_response(user)

    async def get_user_by_id(self, user_id: str) -> AuthUserResponse:
        user = await self.auth_repository.get_user_by_id(user_id)
        if user is None or user.status != UserStatus.ACTIVE:
            raise UnauthorizedError("User account is unavailable.")

        return self._to_user_response(user)

    async def _issue_token_pair(
        self,
        user: UserDocument,
        metadata: ClientMetadata,
    ) -> AuthTokenResponse:
        access_token = self._create_access_token(user)
        refresh_token = generate_refresh_token()
        refresh_expires_at = utc_now() + timedelta(days=self.settings.refresh_token_expire_days)

        await self.auth_repository.create_session(
            AuthSessionDocument(
                user_id=user.id or "",
                refresh_token_hash=hash_token(refresh_token),
                expires_at=refresh_expires_at,
                user_agent=metadata.user_agent,
                ip_address=metadata.ip_address,
            )
        )

        return AuthTokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=self.settings.access_token_expire_minutes * 60,
            user=self._to_user_response(user),
        )

    def _create_access_token(self, user: UserDocument) -> str:
        return create_signed_token(
            {
                "sub": user.id,
                "email": user.email,
                "role": user.role,
                "type": AuthTokenType.ACCESS,
            },
            secret_key=self.settings.auth_secret_key,
            expires_delta=timedelta(minutes=self.settings.access_token_expire_minutes),
        )

    def _to_user_response(self, user: UserDocument) -> AuthUserResponse:
        return AuthUserResponse(
            id=user.id or "",
            email=user.email,
            company_name=user.company_name,
            representative_name=user.representative_name,
            phone=user.phone,
            industry=user.industry,
            organization_id=user.organization_id,
            role=user.role,
            status=user.status,
            preferences=user.preferences,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
