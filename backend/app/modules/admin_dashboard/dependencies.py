from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.admin_dashboard.repository import AdminDashboardRepository
from app.modules.admin_dashboard.service import AdminDashboardService


def get_admin_dashboard_repository(database: DatabaseDep) -> AdminDashboardRepository:
    return AdminDashboardRepository(database)


def get_admin_dashboard_service(
    repository: Annotated[
        AdminDashboardRepository,
        Depends(get_admin_dashboard_repository),
    ],
) -> AdminDashboardService:
    return AdminDashboardService(repository)


AdminDashboardRepositoryDep = Annotated[
    AdminDashboardRepository,
    Depends(get_admin_dashboard_repository),
]
AdminDashboardServiceDep = Annotated[
    AdminDashboardService,
    Depends(get_admin_dashboard_service),
]
