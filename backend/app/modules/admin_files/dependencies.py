from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.dependencies.storage import StorageClientDep
from app.modules.admin_files.repository import AdminFilesRepository
from app.modules.admin_files.service import AdminFilesService


def get_admin_files_repository(database: DatabaseDep) -> AdminFilesRepository:
    return AdminFilesRepository(database)


def get_admin_files_service(
    repository: Annotated[
        AdminFilesRepository,
        Depends(get_admin_files_repository),
    ],
    storage_client: StorageClientDep,
) -> AdminFilesService:
    return AdminFilesService(repository, storage_client)


AdminFilesRepositoryDep = Annotated[
    AdminFilesRepository,
    Depends(get_admin_files_repository),
]
AdminFilesServiceDep = Annotated[
    AdminFilesService,
    Depends(get_admin_files_service),
]
