from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.dependencies.database import DatabaseDep
from app.dependencies.storage import StorageClientDep
from app.modules.analyses.engine.bess_planner.optimizer import BessPlannerOptimizer
from app.modules.analyses.engine.quick_sizing.calculator import QuickSizingCalculator
from app.modules.analyses.repository import AnalysisRepository
from app.modules.analyses.service import AnalysisService
from app.modules.datasets.repository import DatasetRepository
from app.modules.files.repository import FileRepository
from app.modules.projects.repository import ProjectRepository


def get_analysis_repository(database: DatabaseDep) -> AnalysisRepository:
    return AnalysisRepository(database)


def get_project_repository(database: DatabaseDep) -> ProjectRepository:
    return ProjectRepository(database)


def get_dataset_repository(database: DatabaseDep) -> DatasetRepository:
    return DatasetRepository(database)


def get_file_repository(database: DatabaseDep) -> FileRepository:
    return FileRepository(database)


def get_bess_planner_optimizer() -> BessPlannerOptimizer:
    return BessPlannerOptimizer()


def get_quick_sizing_calculator() -> QuickSizingCalculator:
    return QuickSizingCalculator()


def get_analysis_service(
    analysis_repository: Annotated[AnalysisRepository, Depends(get_analysis_repository)],
    project_repository: Annotated[ProjectRepository, Depends(get_project_repository)],
    dataset_repository: Annotated[DatasetRepository, Depends(get_dataset_repository)],
    file_repository: Annotated[FileRepository, Depends(get_file_repository)],
    storage_client: StorageClientDep,
    settings: Annotated[Settings, Depends(get_settings)],
    bess_planner_optimizer: Annotated[BessPlannerOptimizer, Depends(get_bess_planner_optimizer)],
    quick_sizing_calculator: Annotated[
        QuickSizingCalculator,
        Depends(get_quick_sizing_calculator),
    ],
) -> AnalysisService:
    return AnalysisService(
        analysis_repository,
        project_repository,
        dataset_repository,
        file_repository,
        storage_client,
        settings,
        bess_planner_optimizer,
        quick_sizing_calculator,
    )


AnalysisRepositoryDep = Annotated[AnalysisRepository, Depends(get_analysis_repository)]
BessPlannerOptimizerDep = Annotated[BessPlannerOptimizer, Depends(get_bess_planner_optimizer)]
QuickSizingCalculatorDep = Annotated[
    QuickSizingCalculator,
    Depends(get_quick_sizing_calculator),
]
AnalysisServiceDep = Annotated[AnalysisService, Depends(get_analysis_service)]
