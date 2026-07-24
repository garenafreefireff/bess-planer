from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService


def get_user_repository(database: DatabaseDep) -> UserRepository:
    return UserRepository(database)


def get_user_service(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> UserService:
    return UserService(user_repository)


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
