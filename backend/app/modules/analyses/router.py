from typing import Annotated

from fastapi import APIRouter, File, Form, Query, UploadFile, status

from app.dependencies.authentication import CurrentUserDep, OptionalCurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.analyses.dependencies import AnalysisServiceDep
from app.modules.analyses.enums import AnalysisType
from app.modules.analyses.schemas import (
    AnalysisRunResponse,
    ApplySizingSelectionRequest,
    ApplySizingSelectionResponse,
    BessPlannerAnalysisRequest,
    QuickSizingStep1Request,
)
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse

router = APIRouter()


@router.post(
    "/quick-sizing",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_quick_sizing_run(
    payload: QuickSizingStep1Request,
    current_user: OptionalCurrentUserDep,
    analysis_service: AnalysisServiceDep,
) -> AnalysisRunResponse:
    return await analysis_service.create_quick_sizing_run(
        payload,
        current_user.id if current_user else None,
    )


@router.post(
    "/sizing-lab/transient",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_transient_sizing_lab_run(
    project_id: Annotated[str, Form(pattern=r"^[a-fA-F0-9]{24}$")],
    load_file: Annotated[UploadFile, File()],
    current_user: CurrentUserDep,
    analysis_service: AnalysisServiceDep,
    pv_file: Annotated[UploadFile | None, File()] = None,
) -> AnalysisRunResponse:
    return await analysis_service.create_transient_bess_planner_run(
        project_id=project_id,
        load_upload=load_file,
        pv_upload=pv_file,
        user_id=current_user.id,
    )


@router.post(
    "/sizing-lab",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_sizing_lab_run(
    payload: BessPlannerAnalysisRequest,
    current_user: CurrentUserDep,
    analysis_service: AnalysisServiceDep,
) -> AnalysisRunResponse:
    return await analysis_service.create_bess_planner_run(payload, current_user.id)


@router.post(
    "/bess-planner",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_bess_planner_run(
    payload: BessPlannerAnalysisRequest,
    current_user: CurrentUserDep,
    analysis_service: AnalysisServiceDep,
) -> AnalysisRunResponse:
    return await analysis_service.create_bess_planner_run(payload, current_user.id)


@router.get("", response_model=PageResponse[AnalysisRunResponse])
async def list_analysis_runs(
    current_user: CurrentUserDep,
    pagination: PaginationDep,
    analysis_service: AnalysisServiceDep,
    analysis_type: Annotated[AnalysisType | None, Query(alias="type")] = None,
) -> PageResponse[AnalysisRunResponse]:
    return await analysis_service.list_analysis_runs(
        current_user.id,
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
        analysis_type=analysis_type,
    )


@router.post(
    "/{analysis_run_id}/apply-selection",
    response_model=ApplySizingSelectionResponse,
)
async def apply_sizing_selection(
    analysis_run_id: ObjectIdStr,
    payload: ApplySizingSelectionRequest,
    current_user: CurrentUserDep,
    analysis_service: AnalysisServiceDep,
) -> ApplySizingSelectionResponse:
    return await analysis_service.apply_sizing_selection(
        analysis_run_id,
        payload,
        current_user.id,
    )


@router.get("/{analysis_run_id}", response_model=AnalysisRunResponse)
async def get_analysis_run(
    analysis_run_id: ObjectIdStr,
    current_user: CurrentUserDep,
    analysis_service: AnalysisServiceDep,
) -> AnalysisRunResponse:
    return await analysis_service.get_analysis_run(analysis_run_id, current_user.id)
