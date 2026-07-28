from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies.authentication import AdminUserDep
from app.modules.admin_dashboard.dependencies import AdminDashboardServiceDep
from app.modules.admin_dashboard.schemas import (
    AdminDashboardOverviewResponse,
    DashboardGranularity,
)

router = APIRouter()


@router.get("/overview", response_model=AdminDashboardOverviewResponse)
async def get_admin_dashboard_overview(
    admin_user: AdminUserDep,
    dashboard_service: AdminDashboardServiceDep,
    date_from: Annotated[date | None, Query(description="Inclusive start date")] = None,
    date_to: Annotated[date | None, Query(description="Inclusive end date")] = None,
    timezone: Annotated[str, Query(min_length=1, max_length=80)] = "Asia/Ho_Chi_Minh",
    granularity: DashboardGranularity = "day",
) -> AdminDashboardOverviewResponse:
    del admin_user
    return await dashboard_service.get_overview(
        date_from=date_from,
        date_to=date_to,
        timezone=timezone,
        granularity=granularity,
    )
