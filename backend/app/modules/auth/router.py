from fastapi import APIRouter, Request, status

from app.dependencies.authentication import CurrentUserDep
from app.modules.auth.dependencies import AuthServiceDep
from app.modules.auth.schemas import (
    AuthTokenResponse,
    AuthUserResponse,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
)
from app.modules.auth.service import ClientMetadata
from app.shared.schemas.response import MessageResponse

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    request: Request,
    auth_service: AuthServiceDep,
) -> AuthTokenResponse:
    return await auth_service.register(payload, _client_metadata(request))


@router.post("/login", response_model=AuthTokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    auth_service: AuthServiceDep,
) -> AuthTokenResponse:
    return await auth_service.login(payload, _client_metadata(request))


@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    request: Request,
    auth_service: AuthServiceDep,
) -> AuthTokenResponse:
    return await auth_service.refresh(payload.refresh_token, _client_metadata(request))


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: LogoutRequest,
    auth_service: AuthServiceDep,
) -> MessageResponse:
    await auth_service.logout(payload.refresh_token)
    return MessageResponse(message="Logged out.")


@router.get("/me", response_model=AuthUserResponse)
async def get_me(
    current_user: CurrentUserDep,
    auth_service: AuthServiceDep,
) -> AuthUserResponse:
    return await auth_service.get_user_by_id(current_user.id)


def _client_metadata(request: Request) -> ClientMetadata:
    return ClientMetadata(
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
