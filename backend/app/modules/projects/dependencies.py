from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.dependencies.storage import StorageClientDep
from app.modules.datasets.repository import DatasetRepository
from app.modules.files.repository import FileRepository
from app.modules.projects.repository import ProjectRepository
from app.modules.projects.service import ProjectService


def get_project_repository(database: DatabaseDep) -> ProjectRepository:
    return ProjectRepository(database)


def get_dataset_repository(database: DatabaseDep) -> DatasetRepository:
    return DatasetRepository(database)


def get_file_repository(database: DatabaseDep) -> FileRepository:
    return FileRepository(database)


def get_project_service(
    project_repository: Annotated[ProjectRepository, Depends(get_project_repository)],
    dataset_repository: Annotated[DatasetRepository, Depends(get_dataset_repository)],
    file_repository: Annotated[FileRepository, Depends(get_file_repository)],
    storage_client: StorageClientDep,
) -> ProjectService:
    return ProjectService(
        project_repository,
        dataset_repository,
        file_repository,
        storage_client,
    )


ProjectRepositoryDep = Annotated[ProjectRepository, Depends(get_project_repository)]
ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]
