from app.core.exceptions import NotFoundError
from app.core.security import utc_now
from app.models.analysis_run import AnalysisRunDocument
from app.modules.analyses.engine.bess_planner.optimizer import BessPlannerOptimizer
from app.modules.analyses.engine.quick_sizing.calculator import QuickSizingCalculator
from app.modules.analyses.enums import AnalysisRunStatus, AnalysisType
from app.modules.analyses.repository import AnalysisRepository
from app.modules.analyses.schemas import AnalysisRunResponse, QuickSizingStep1Request
from app.shared.schemas.pagination import PageMeta, PageResponse


class AnalysisService:
    def __init__(
        self,
        analysis_repository: AnalysisRepository,
        bess_planner_optimizer: BessPlannerOptimizer,
        quick_sizing_calculator: QuickSizingCalculator,
    ) -> None:
        self.analysis_repository = analysis_repository
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
