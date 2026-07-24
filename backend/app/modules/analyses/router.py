from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies.authentication import CurrentUserDep, OptionalCurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.analyses.dependencies import AnalysisServiceDep
from app.modules.analyses.enums import AnalysisType
from app.modules.analyses.schemas import (
    AnalysisRunResponse,
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


@router.get("/{analysis_run_id}", response_model=AnalysisRunResponse)
async def get_analysis_run(
    analysis_run_id: ObjectIdStr,
    current_user: CurrentUserDep,
    analysis_service: AnalysisServiceDep,
) -> AnalysisRunResponse:
    return await analysis_service.get_analysis_run(analysis_run_id, current_user.id)
