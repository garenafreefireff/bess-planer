from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.projects.repository import ProjectRepository
from app.modules.projects.service import ProjectService


def get_project_repository(database: DatabaseDep) -> ProjectRepository:
    return ProjectRepository(database)


def get_project_service(
    project_repository: Annotated[ProjectRepository, Depends(get_project_repository)],
) -> ProjectService:
    return ProjectService(project_repository)


ProjectRepositoryDep = Annotated[ProjectRepository, Depends(get_project_repository)]
ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]
