from fastapi import APIRouter, Request, Response, status

from app.core.config import Settings
from app.core.exceptions import UnauthorizedError
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
    response: Response,
    auth_service: AuthServiceDep,
) -> AuthTokenResponse:
    session = await auth_service.register(payload, _client_metadata(request))
    _set_refresh_cookie(response, session.refresh_token, request.app.state.settings)
    return session


@router.post("/login", response_model=AuthTokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    auth_service: AuthServiceDep,
) -> AuthTokenResponse:
    session = await auth_service.login(payload, _client_metadata(request))
    _set_refresh_cookie(response, session.refresh_token, request.app.state.settings)
    return session


@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    request: Request,
    response: Response,
    auth_service: AuthServiceDep,
) -> AuthTokenResponse:
    refresh_token_value = _resolve_refresh_token(payload.refresh_token, request)
    session = await auth_service.refresh(refresh_token_value, _client_metadata(request))
    _set_refresh_cookie(response, session.refresh_token, request.app.state.settings)
    return session


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: LogoutRequest,
    request: Request,
    response: Response,
    auth_service: AuthServiceDep,
) -> MessageResponse:
    refresh_token_value = _resolve_refresh_token(payload.refresh_token, request)
    await auth_service.logout(refresh_token_value)
    _delete_refresh_cookie(response, request.app.state.settings)
    return MessageResponse(message="Logged out.")


@router.get("/me", response_model=AuthUserResponse)
async def get_me(
    current_user: CurrentUserDep,
    auth_service: AuthServiceDep,
) -> AuthUserResponse:
    return await auth_service.get_user_by_id(current_user.id)


def _resolve_refresh_token(payload_token: str | None, request: Request) -> str:
    settings: Settings = request.app.state.settings
    token = payload_token or request.cookies.get(settings.refresh_cookie_name)
    if not token:
        raise UnauthorizedError("Refresh token is required.")
    return token


def _set_refresh_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        domain=settings.refresh_cookie_domain,
        path="/",
    )


def _delete_refresh_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        domain=settings.refresh_cookie_domain,
        path="/",
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=settings.refresh_cookie_samesite,
    )


def _client_metadata(request: Request) -> ClientMetadata:
    return ClientMetadata(
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
