from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.reports.repository import ReportRepository
from app.modules.reports.service import ReportService


def get_report_repository(database: DatabaseDep) -> ReportRepository:
    return ReportRepository(database)


def get_report_service(
    report_repository: Annotated[ReportRepository, Depends(get_report_repository)],
) -> ReportService:
    return ReportService(report_repository)


ReportRepositoryDep = Annotated[ReportRepository, Depends(get_report_repository)]
ReportServiceDep = Annotated[ReportService, Depends(get_report_service)]
