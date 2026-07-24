from app.core.exceptions import AppError, NotFoundError
from app.core.security import utc_now
from app.models.analysis_run import AnalysisRunDocument
from app.modules.analyses.engine.bess_planner.optimizer import BessPlannerOptimizer
from app.modules.analyses.engine.quick_sizing.calculator import QuickSizingCalculator
from app.modules.analyses.enums import AnalysisRunStatus, AnalysisType
from app.modules.analyses.repository import AnalysisRepository
from app.modules.analyses.schemas import (
    AnalysisRunResponse,
    BessPlannerAnalysisRequest,
    QuickSizingStep1Request,
)
from app.modules.datasets.repository import DatasetRepository
from app.modules.projects.repository import ProjectRepository
from app.shared.schemas.pagination import PageMeta, PageResponse


class AnalysisService:
    def __init__(
        self,
        analysis_repository: AnalysisRepository,
        project_repository: ProjectRepository,
        dataset_repository: DatasetRepository,
        bess_planner_optimizer: BessPlannerOptimizer,
        quick_sizing_calculator: QuickSizingCalculator,
    ) -> None:
        self.analysis_repository = analysis_repository
        self.project_repository = project_repository
        self.dataset_repository = dataset_repository
        self.bess_planner_optimizer = bess_planner_optimizer
        self.quick_sizing_calculator = quick_sizing_calculator

    async def create_quick_sizing_run(
        self,
        payload: QuickSizingStep1Request,
        user_id: str | None,
    ) -> AnalysisRunResponse:
        started_at = utc_now()
        result = self.quick_sizing_calculator.calculate(payload.to_engine_input())
        completed_at = utc_now()
        result_payload = result.to_dict()

        if user_id is None:
            return AnalysisRunResponse(
                id=None,
                user_id=None,
                project_id=payload.project_id,
                bess_catalog_id=payload.bess_catalog_id,
                analysis_type=AnalysisType.QUICK_SIZING,
                status=AnalysisRunStatus.COMPLETED,
                progress_pct=100,
                input_snapshot={
                    "project_id": payload.project_id,
                    "bess_catalog_id": payload.bess_catalog_id,
                    "step1": result_payload["normalized_input"],
                },
                result=result_payload,
                artifacts={},
                engine_version=str(result_payload["config_versions"]["engine"]),
                error=None,
                created_at=started_at,
                updated_at=completed_at,
                started_at=started_at,
                completed_at=completed_at,
            )

        analysis_run = AnalysisRunDocument(
            user_id=user_id,
            project_id=payload.project_id,
            bess_catalog_id=payload.bess_catalog_id,
            analysis_type=AnalysisType.QUICK_SIZING,
            status=AnalysisRunStatus.COMPLETED,
            progress_pct=100,
            input_snapshot={
                "project_id": payload.project_id,
                "bess_catalog_id": payload.bess_catalog_id,
                "step1": result_payload["normalized_input"],
            },
            result=result_payload,
            artifacts={},
            engine_version=str(result_payload["config_versions"]["engine"]),
            error=None,
            started_at=started_at,
            completed_at=completed_at,
        )
        created = await self.analysis_repository.create_analysis_run(analysis_run)
        return self._to_response(created)

    async def create_bess_planner_run(
        self,
        payload: BessPlannerAnalysisRequest,
        user_id: str,
    ) -> AnalysisRunResponse:
        project = await self.project_repository.get_by_id_for_user(payload.project_id, user_id)
        if project is None:
            raise NotFoundError("Project not found.")

        datasets = await self.dataset_repository.list_by_user(
            user_id,
            skip=0,
            limit=1000,
            project_id=payload.project_id,
        )
        dataset_snapshots = [dataset.model_dump(mode="json") for dataset in datasets]
        if not any(item.get("dataset_type") == "load_profile" for item in dataset_snapshots):
            raise AppError(
                "Cần có dataset phụ tải trước khi bắt đầu BESS Planner precheck.",
                code="load_dataset_required",
            )

        started_at = utc_now()
        result = self.bess_planner_optimizer.precheck(
            configuration=project.configuration,
            datasets=dataset_snapshots,
        )
        completed_at = utc_now()
        analysis_run = AnalysisRunDocument(
            user_id=user_id,
            project_id=project.id,
            bess_catalog_id=project.bess_catalog_id,
            analysis_type=AnalysisType.BESS_PLANNER,
            status=AnalysisRunStatus.COMPLETED,
            progress_pct=100,
            input_snapshot={
                "project_id": project.id,
                "bess_catalog_id": project.bess_catalog_id,
                "configuration": project.configuration,
                "dataset_ids": project.dataset_ids,
            },
            result=result,
            artifacts={},
            engine_version=self.bess_planner_optimizer.engine_version,
            error=None,
            started_at=started_at,
            completed_at=completed_at,
        )
        created = await self.analysis_repository.create_analysis_run(analysis_run)
        if created.id is not None and project.id is not None:
            await self.project_repository.update_by_id_for_user(
                project.id,
                user_id,
                {"latest_analysis_run_id": created.id},
            )
        return self._to_response(created)

    async def list_analysis_runs(
        self,
        user_id: str,
        *,
        page: int,
        page_size: int,
        skip: int,
        analysis_type: AnalysisType | None = None,
    ) -> PageResponse[AnalysisRunResponse]:
        total = await self.analysis_repository.count_by_user(user_id, analysis_type)
        runs = await self.analysis_repository.list_by_user(
            user_id,
            skip=skip,
            limit=page_size,
            analysis_type=analysis_type,
        )
        return PageResponse[AnalysisRunResponse](
            items=[self._to_response(run) for run in runs],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def get_analysis_run(
        self,
        analysis_run_id: str,
        user_id: str,
    ) -> AnalysisRunResponse:
        analysis_run = await self.analysis_repository.get_by_id_for_user(
            analysis_run_id,
            user_id,
        )
        if analysis_run is None:
            raise NotFoundError("Analysis run not found.")

        return self._to_response(analysis_run)

    def _to_response(self, analysis_run: AnalysisRunDocument) -> AnalysisRunResponse:
        return AnalysisRunResponse.model_validate(analysis_run)
