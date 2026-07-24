from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.exceptions import UnauthorizedError
from app.modules.auth.dependencies import AuthServiceDep

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    email: str | None = None
    representative_name: str | None = None
    role: str | None = None


async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth_service: AuthServiceDep,
) -> CurrentUser:
    if getattr(request.app.state, "mongodb_available", True) is False:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is unavailable.",
        )

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    try:
        user = await auth_service.get_user_from_access_token(credentials.credentials)
    except UnauthorizedError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
        ) from exc

    return CurrentUser(
        id=user.id,
        email=user.email,
        representative_name=user.representative_name,
        role=user.role,
    )


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]


async def get_optional_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth_service: AuthServiceDep,
) -> CurrentUser | None:
    if credentials is None:
        return None
    if getattr(request.app.state, "mongodb_available", True) is False:
        return None

    try:
        user = await auth_service.get_user_from_access_token(credentials.credentials)
    except UnauthorizedError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
        ) from exc

    return CurrentUser(
        id=user.id,
        email=user.email,
        representative_name=user.representative_name,
        role=user.role,
    )


OptionalCurrentUserDep = Annotated[CurrentUser | None, Depends(get_optional_current_user)]
