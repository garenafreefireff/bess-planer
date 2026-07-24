from typing import Annotated

from fastapi import Depends

from app.core.config import get_settings
from app.dependencies.database import DatabaseDep
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService


def get_auth_repository(database: DatabaseDep) -> AuthRepository:
    return AuthRepository(database)


def get_auth_service(
    auth_repository: Annotated[AuthRepository, Depends(get_auth_repository)],
) -> AuthService:
    return AuthService(auth_repository, get_settings())


AuthRepositoryDep = Annotated[AuthRepository, Depends(get_auth_repository)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
