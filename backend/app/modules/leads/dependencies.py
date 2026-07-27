from typing import Annotated

from fastapi import Depends

from app.core.config import get_settings
from app.dependencies.database import DatabaseDep
from app.modules.leads.repository import LeadRepository
from app.modules.leads.service import LeadService
from app.modules.reports.dependencies import ReportServiceDep


def get_lead_repository(database: DatabaseDep) -> LeadRepository:
    return LeadRepository(database)


def get_lead_service(
    lead_repository: Annotated[LeadRepository, Depends(get_lead_repository)],
    report_service: ReportServiceDep,
) -> LeadService:
    return LeadService(lead_repository, report_service, get_settings())


LeadRepositoryDep = Annotated[LeadRepository, Depends(get_lead_repository)]
LeadServiceDep = Annotated[LeadService, Depends(get_lead_service)]
