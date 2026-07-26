from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies.authentication import AdminUserDep
from app.dependencies.common import PaginationDep
from app.modules.leads.dependencies import LeadServiceDep
from app.modules.leads.enums import LeadSource, LeadStatus
from app.modules.leads.schemas import (
    LeadAdminUpdateRequest,
    LeadCaptureResponse,
    LeadCreateRequest,
    LeadResponse,
    QuickSizingLeadCreateRequest,
)
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse

router = APIRouter()
admin_router = APIRouter()


@router.post("", response_model=LeadCaptureResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreateRequest,
    lead_service: LeadServiceDep,
) -> LeadCaptureResponse:
    return await lead_service.capture(payload)


@router.post(
    "/quick-sizing",
    response_model=LeadCaptureResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_quick_sizing_lead(
    payload: QuickSizingLeadCreateRequest,
    lead_service: LeadServiceDep,
) -> LeadCaptureResponse:
    return await lead_service.capture_quick_sizing(payload)


@admin_router.get("", response_model=PageResponse[LeadResponse])
async def list_leads(
    _: AdminUserDep,
    pagination: PaginationDep,
    lead_service: LeadServiceDep,
    lead_status: Annotated[LeadStatus | None, Query(alias="status")] = None,
    source: LeadSource | None = None,
    search: Annotated[str | None, Query(max_length=160)] = None,
) -> PageResponse[LeadResponse]:
    return await lead_service.list_admin(
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
        status=lead_status,
        source=source,
        search=search,
    )


@admin_router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: ObjectIdStr,
    payload: LeadAdminUpdateRequest,
    _: AdminUserDep,
    lead_service: LeadServiceDep,
) -> LeadResponse:
    return await lead_service.update_admin(lead_id, payload)
