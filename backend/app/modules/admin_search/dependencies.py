from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.admin_search.repository import AdminSearchRepository
from app.modules.admin_search.service import AdminSearchService


def get_admin_search_repository(database: DatabaseDep) -> AdminSearchRepository:
    return AdminSearchRepository(database)


def get_admin_search_service(
    repository: Annotated[
        AdminSearchRepository,
        Depends(get_admin_search_repository),
    ],
) -> AdminSearchService:
    return AdminSearchService(repository)


AdminSearchRepositoryDep = Annotated[
    AdminSearchRepository,
    Depends(get_admin_search_repository),
]
AdminSearchServiceDep = Annotated[
    AdminSearchService,
    Depends(get_admin_search_service),
]
