from fastapi import APIRouter, status

from app.dependencies.authentication import CurrentUserDep
from app.dependencies.common import PaginationDep
from app.modules.projects.dependencies import ProjectServiceDep
from app.modules.projects.schemas import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
)
from app.shared.schemas.object_id import ObjectIdStr
from app.shared.schemas.pagination import PageResponse
from app.shared.schemas.response import MessageResponse

router = APIRouter()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreateRequest,
    current_user: CurrentUserDep,
    project_service: ProjectServiceDep,
) -> ProjectResponse:
    return await project_service.create_project(payload, current_user.id)


@router.get("", response_model=PageResponse[ProjectResponse])
async def list_projects(
    current_user: CurrentUserDep,
    pagination: PaginationDep,
    project_service: ProjectServiceDep,
) -> PageResponse[ProjectResponse]:
    return await project_service.list_projects(
        current_user.id,
        page=pagination.page,
        page_size=pagination.page_size,
        skip=pagination.skip,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: ObjectIdStr,
    current_user: CurrentUserDep,
    project_service: ProjectServiceDep,
) -> ProjectResponse:
    return await project_service.get_project(project_id, current_user.id)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: ObjectIdStr,
    payload: ProjectUpdateRequest,
    current_user: CurrentUserDep,
    project_service: ProjectServiceDep,
) -> ProjectResponse:
    return await project_service.update_project(project_id, payload, current_user.id)


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: ObjectIdStr,
    current_user: CurrentUserDep,
    project_service: ProjectServiceDep,
) -> MessageResponse:
    await project_service.delete_project(project_id, current_user.id)
    return MessageResponse(message="Project deleted.")
