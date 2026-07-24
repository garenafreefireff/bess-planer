from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.bess_catalog.repository import BessCatalogRepository
from app.modules.bess_catalog.service import BessCatalogService


def get_bess_catalog_repository(database: DatabaseDep) -> BessCatalogRepository:
    return BessCatalogRepository(database)


def get_bess_catalog_service(
    bess_catalog_repository: Annotated[BessCatalogRepository, Depends(get_bess_catalog_repository)],
) -> BessCatalogService:
    return BessCatalogService(bess_catalog_repository)


BessCatalogRepositoryDep = Annotated[BessCatalogRepository, Depends(get_bess_catalog_repository)]
BessCatalogServiceDep = Annotated[BessCatalogService, Depends(get_bess_catalog_service)]
