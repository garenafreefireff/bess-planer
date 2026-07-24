from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.files.repository import FileRepository
from app.modules.files.service import FileService


def get_file_repository(database: DatabaseDep) -> FileRepository:
    return FileRepository(database)


def get_file_service(
    file_repository: Annotated[FileRepository, Depends(get_file_repository)],
) -> FileService:
    return FileService(file_repository)


FileRepositoryDep = Annotated[FileRepository, Depends(get_file_repository)]
FileServiceDep = Annotated[FileService, Depends(get_file_service)]
