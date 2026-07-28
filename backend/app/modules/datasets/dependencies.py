from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.dependencies.storage import StorageClientDep
from app.modules.analyses.repository import AnalysisRepository
from app.modules.datasets.repository import DatasetRepository
from app.modules.datasets.service import DatasetService
from app.modules.files.repository import FileRepository
from app.modules.projects.repository import ProjectRepository


def get_dataset_repository(database: DatabaseDep) -> DatasetRepository:
    return DatasetRepository(database)


def get_file_repository(database: DatabaseDep) -> FileRepository:
    return FileRepository(database)


def get_project_repository(database: DatabaseDep) -> ProjectRepository:
    return ProjectRepository(database)


def get_analysis_repository(database: DatabaseDep) -> AnalysisRepository:
    return AnalysisRepository(database)


def get_dataset_service(
    dataset_repository: Annotated[DatasetRepository, Depends(get_dataset_repository)],
    file_repository: Annotated[FileRepository, Depends(get_file_repository)],
    project_repository: Annotated[ProjectRepository, Depends(get_project_repository)],
    analysis_repository: Annotated[AnalysisRepository, Depends(get_analysis_repository)],
    storage_client: StorageClientDep,
) -> DatasetService:
    return DatasetService(
        dataset_repository,
        file_repository,
        project_repository,
        analysis_repository,
        storage_client,
    )


DatasetRepositoryDep = Annotated[DatasetRepository, Depends(get_dataset_repository)]
DatasetServiceDep = Annotated[DatasetService, Depends(get_dataset_service)]
