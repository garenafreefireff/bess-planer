from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.sites.repository import SiteRepository
from app.modules.sites.service import SiteService


def get_site_repository(database: DatabaseDep) -> SiteRepository:
    return SiteRepository(database)


def get_site_service(
    site_repository: Annotated[SiteRepository, Depends(get_site_repository)],
) -> SiteService:
    return SiteService(site_repository)


SiteRepositoryDep = Annotated[SiteRepository, Depends(get_site_repository)]
SiteServiceDep = Annotated[SiteService, Depends(get_site_service)]
