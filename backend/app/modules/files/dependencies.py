from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.dependencies.database import DatabaseDep
from app.dependencies.storage import StorageClientDep
from app.modules.analyses.repository import AnalysisRepository
from app.modules.datasets.repository import DatasetRepository
from app.modules.files.repository import FileRepository
from app.modules.files.service import FileService
from app.modules.projects.repository import ProjectRepository


def get_file_repository(database: DatabaseDep) -> FileRepository:
    return FileRepository(database)


def get_dataset_repository(database: DatabaseDep) -> DatasetRepository:
    return DatasetRepository(database)


def get_project_repository(database: DatabaseDep) -> ProjectRepository:
    return ProjectRepository(database)


def get_analysis_repository(database: DatabaseDep) -> AnalysisRepository:
    return AnalysisRepository(database)


def get_file_service(
    file_repository: Annotated[FileRepository, Depends(get_file_repository)],
    dataset_repository: Annotated[DatasetRepository, Depends(get_dataset_repository)],
    project_repository: Annotated[ProjectRepository, Depends(get_project_repository)],
    analysis_repository: Annotated[AnalysisRepository, Depends(get_analysis_repository)],
    storage_client: StorageClientDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> FileService:
    return FileService(
        file_repository,
        dataset_repository,
        project_repository,
        analysis_repository,
        storage_client,
        settings,
    )


FileRepositoryDep = Annotated[FileRepository, Depends(get_file_repository)]
FileServiceDep = Annotated[FileService, Depends(get_file_service)]
