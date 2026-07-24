from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.analyses.engine.bess_planner.optimizer import BessPlannerOptimizer
from app.modules.analyses.engine.quick_sizing.calculator import QuickSizingCalculator
from app.modules.analyses.repository import AnalysisRepository
from app.modules.analyses.service import AnalysisService
from app.modules.datasets.repository import DatasetRepository
from app.modules.projects.repository import ProjectRepository


def get_analysis_repository(database: DatabaseDep) -> AnalysisRepository:
    return AnalysisRepository(database)


def get_project_repository(database: DatabaseDep) -> ProjectRepository:
    return ProjectRepository(database)


def get_dataset_repository(database: DatabaseDep) -> DatasetRepository:
    return DatasetRepository(database)


def get_bess_planner_optimizer() -> BessPlannerOptimizer:
    return BessPlannerOptimizer()


def get_quick_sizing_calculator() -> QuickSizingCalculator:
    return QuickSizingCalculator()


def get_analysis_service(
    analysis_repository: Annotated[AnalysisRepository, Depends(get_analysis_repository)],
    project_repository: Annotated[ProjectRepository, Depends(get_project_repository)],
    dataset_repository: Annotated[DatasetRepository, Depends(get_dataset_repository)],
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
