from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.datasets.repository import DatasetRepository
from app.modules.datasets.service import DatasetService


def get_dataset_repository(database: DatabaseDep) -> DatasetRepository:
    return DatasetRepository(database)


def get_dataset_service(
    dataset_repository: Annotated[DatasetRepository, Depends(get_dataset_repository)],
) -> DatasetService:
    return DatasetService(dataset_repository)


DatasetRepositoryDep = Annotated[DatasetRepository, Depends(get_dataset_repository)]
DatasetServiceDep = Annotated[DatasetService, Depends(get_dataset_service)]
