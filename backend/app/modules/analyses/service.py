import asyncio
from contextlib import ExitStack
from pathlib import Path

from fastapi import UploadFile

from app.core.config import Settings
from app.core.exceptions import AppError, NotFoundError
from app.core.security import utc_now
from app.dependencies.storage import StorageClient
from app.models.analysis_run import AnalysisRunDocument
from app.modules.analyses.engine.bess_planner.optimizer import BessPlannerOptimizer
from app.modules.analyses.engine.quick_sizing.calculator import QuickSizingCalculator
from app.modules.analyses.enums import AnalysisRunStatus, AnalysisType
from app.modules.analyses.repository import AnalysisRepository
from app.modules.analyses.schemas import (
    AnalysisRunResponse,
    ApplySizingSelectionRequest,
    ApplySizingSelectionResponse,
    BessPlannerAnalysisRequest,
    QuickSizingStep1Request,
)
from app.modules.datasets.repository import DatasetRepository
from app.modules.files.repository import FileRepository
from app.modules.projects.repository import ProjectRepository
from app.shared.schemas.pagination import PageMeta, PageResponse


def _run_optimizer_with_materialized_files(
    storage_client: StorageClient,
    optimizer: BessPlannerOptimizer,
    configuration: dict,
    datasets: list[dict],
) -> dict:
    with ExitStack() as stack:
        materialized: list[dict] = []
        for snapshot in datasets:
            item = dict(snapshot)
            storage_path = item.pop("storage_path", None)
            if storage_path:
                source_path = stack.enter_context(
                    storage_client.materialize(str(storage_path))
                )
                item["source_path"] = str(source_path)
            materialized.append(item)
        return optimizer.optimize(
            configuration=configuration,
            datasets=materialized,
        )


def _run_optimizer_with_transient_uploads(
    optimizer: BessPlannerOptimizer,
    configuration: dict,
    load_content: bytes,
    load_name: str,
    pv_content: bytes | None,
    pv_name: str | None,
) -> dict:
    load_extension = Path(load_name).suffix.lower()
    datasets: list[dict] = [
        {
            "dataset_type": "load_profile",
            "status": "ready",
            "source_bytes": load_content,
            "source_extension": load_extension,
            "original_name": f"transient-load{load_extension}",
            "quality_summary": {},
        }
    ]
    if pv_content is not None and pv_name is not None:
        pv_extension = Path(pv_name).suffix.lower()
        datasets.append(
            {
                "dataset_type": "pv_profile",
                "status": "ready",
                "source_bytes": pv_content,
                "source_extension": pv_extension,
                "original_name": f"transient-pv{pv_extension}",
                "quality_summary": {},
            }
        )
    return optimizer.optimize(configuration=configuration, datasets=datasets)


async def _read_transient_upload(
    upload: UploadFile,
    *,
    max_size_bytes: int,
    label: str,
) -> tuple[bytes, str]:
    original_name = Path(upload.filename or f"{label}.bin").name
    extension = Path(original_name).suffix.lower()
    if extension not in {".csv", ".xlsx"}:
        await upload.close()
        raise AppError(
            f"{label} chỉ hỗ trợ file CSV hoặc XLSX.",
            code="unsupported_file_type",
        )
    content = await upload.read(max_size_bytes + 1)
    await upload.close()
    if not content:
        raise AppError(f"{label} đang rỗng.", code="empty_file")
    if len(content) > max_size_bytes:
        raise AppError(
            f"{label} vượt giới hạn {max_size_bytes // (1024 * 1024)} MB.",
            code="file_too_large",
        )
    return content, original_name


class AnalysisService:
    def __init__(
        self,
        analysis_repository: AnalysisRepository,
        project_repository: ProjectRepository,
        dataset_repository: DatasetRepository,
        file_repository: FileRepository,
        storage_client: StorageClient,
        settings: Settings,
        bess_planner_optimizer: BessPlannerOptimizer,
        quick_sizing_calculator: QuickSizingCalculator,
    ) -> None:
        self.analysis_repository = analysis_repository
        self.project_repository = project_repository
        self.dataset_repository = dataset_repository
        self.file_repository = file_repository
        self.storage_client = storage_client
        self.settings = settings
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
        file_documents = await self.file_repository.list_by_project_for_user(
            payload.project_id,
            user_id,
        )
        files_by_id = {item.id: item for item in file_documents if item.id is not None}
        dataset_snapshots = []
        for dataset in datasets:
            snapshot = dataset.model_dump(mode="json")
            source_file = files_by_id.get(dataset.file_id)
            if source_file is not None:
                snapshot["storage_path"] = source_file.storage_path
                snapshot["original_name"] = source_file.original_name
            dataset_snapshots.append(snapshot)
        if not any(item.get("dataset_type") == "load_profile" for item in dataset_snapshots):
            raise AppError(
                "Cần có dataset phụ tải trước khi bắt đầu Sizing Lab.",
                code="load_dataset_required",
            )

        started_at = utc_now()
        result = await asyncio.to_thread(
            _run_optimizer_with_materialized_files,
            self.storage_client,
            self.bess_planner_optimizer,
            project.configuration,
            dataset_snapshots,
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
                "effective_ems_parity": result.get("parity"),
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
                {"latest_analysis_run_id": created.id, "status": "completed"},
            )
        return self._to_response(created)

    async def create_transient_bess_planner_run(
        self,
        *,
        project_id: str,
        load_upload: UploadFile,
        pv_upload: UploadFile | None,
        user_id: str,
    ) -> AnalysisRunResponse:
        project = await self.project_repository.get_by_id_for_user(project_id, user_id)
        if project is None:
            raise NotFoundError("Project not found.")

        max_size_bytes = self.settings.max_upload_size_mb * 1024 * 1024
        load_content, load_name = await _read_transient_upload(
            load_upload,
            max_size_bytes=max_size_bytes,
            label="File phụ tải",
        )
        pv_content: bytes | None = None
        pv_name: str | None = None
        if pv_upload is not None:
            pv_content, pv_name = await _read_transient_upload(
                pv_upload,
                max_size_bytes=max_size_bytes,
                label="File điện mặt trời",
            )

        started_at = utc_now()
        result = await asyncio.to_thread(
            _run_optimizer_with_transient_uploads,
            self.bess_planner_optimizer,
            project.configuration,
            load_content,
            load_name,
            pv_content,
            pv_name,
        )
        del load_content, pv_content
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
                "effective_ems_parity": result.get("parity"),
                "input_mode": "transient_upload",
                "files_persisted": False,
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
                {"latest_analysis_run_id": created.id, "status": "completed"},
            )
        return self._to_response(created)

    async def apply_sizing_selection(
        self,
        analysis_run_id: str,
        payload: ApplySizingSelectionRequest,
        user_id: str,
    ) -> ApplySizingSelectionResponse:
        analysis_run = await self.analysis_repository.get_by_id_for_user(
            analysis_run_id,
            user_id,
        )
        if analysis_run is None:
            raise NotFoundError("Analysis run not found.")
        if analysis_run.project_id is None:
            raise AppError("Analysis run is not linked to a project.", code="analysis_project_missing")

        candidates = analysis_run.result.get("candidates")
        candidate = next(
            (
                item
                for item in candidates
                if isinstance(item, dict) and item.get("id") == payload.candidate_id
            ),
            None,
        ) if isinstance(candidates, list) else None
        if candidate is None:
            raise NotFoundError("Sizing candidate not found in this analysis run.")

        project = await self.project_repository.get_by_id_for_user(
            analysis_run.project_id,
            user_id,
        )
        if project is None:
            raise NotFoundError("Project not found.")

        energy_kwh = float(candidate.get("energy_kwh", 0))
        power_kw = float(candidate.get("power_kw", 0))
        contract_pmax_kw = float(candidate.get("contract_pmax_kw", 0))
        if energy_kwh <= 0 or power_kw <= 0:
            raise AppError("Sizing candidate is invalid.", code="invalid_sizing_candidate")

        applied_at = utc_now().isoformat()
        configuration = {
            **project.configuration,
            "energyKwh": energy_kwh,
            "powerKw": power_kw,
            "selectedSizingCandidateId": payload.candidate_id,
            "selectedContractPmaxKw": contract_pmax_kw,
            "sizingAppliedAt": applied_at,
        }
        scenarios = list(project.scenarios)
        if payload.create_scenario:
            scenarios.append(
                {
                    "name": f"Sizing Lab — {energy_kwh:g} kWh / {power_kw:g} kW",
                    "source": "sizing_lab",
                    "analysis_run_id": analysis_run_id,
                    "candidate_id": payload.candidate_id,
                    "applied_at": applied_at,
                    "energy_kwh": energy_kwh,
                    "power_kw": power_kw,
                    "contract_pmax_kw": contract_pmax_kw,
                    "capex_vnd": candidate.get("capex_vnd"),
                    "annual_saving_vnd": candidate.get("annual_saving_vnd"),
                }
            )

        updated = await self.project_repository.update_by_id_for_user(
            analysis_run.project_id,
            user_id,
            {"configuration": configuration, "scenarios": scenarios},
        )
        if updated is None:
            raise NotFoundError("Project not found while applying sizing selection.")

        return ApplySizingSelectionResponse(
            project_id=analysis_run.project_id,
            analysis_run_id=analysis_run_id,
            candidate_id=payload.candidate_id,
            energy_kwh=energy_kwh,
            power_kw=power_kw,
            contract_pmax_kw=contract_pmax_kw,
            scenario_created=payload.create_scenario,
        )

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
