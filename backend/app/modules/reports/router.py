from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies.authentication import AdminUserDep
from app.dependencies.common import PaginationDep
from app.modules.reports.dependencies import ReportServiceDep
from app.modules.reports.schemas import NotificationOutboxResponse
from app.shared.schemas.pagination import PageResponse

router = APIRouter()
admin_router = APIRouter()


@admin_router.get("/notifications", response_model=PageResponse[NotificationOutboxResponse])
async def list_notification_outbox(
    admin_user: AdminUserDep,
    pagination: PaginationDep,
    report_service: ReportServiceDep,
    status: Annotated[str | None, Query(max_length=40)] = None,
) -> PageResponse[NotificationOutboxResponse]:
    del admin_user
    return await report_service.list_notifications_admin(
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
        status=status,
    )
