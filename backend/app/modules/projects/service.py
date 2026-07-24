from app.core.exceptions import NotFoundError
from app.dependencies.storage import LocalStorageClient
from app.models.project import ProjectDocument
from app.modules.datasets.repository import DatasetRepository
from app.modules.files.repository import FileRepository
from app.modules.projects.repository import ProjectRepository
from app.modules.projects.schemas import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
)
from app.shared.schemas.pagination import PageMeta, PageResponse


class ProjectService:
    def __init__(
        self,
        project_repository: ProjectRepository,
        dataset_repository: DatasetRepository,
        file_repository: FileRepository,
        storage_client: LocalStorageClient,
    ) -> None:
        self.project_repository = project_repository
        self.dataset_repository = dataset_repository
        self.file_repository = file_repository
        self.storage_client = storage_client

    async def create_project(
        self,
        payload: ProjectCreateRequest,
        user_id: str,
    ) -> ProjectResponse:
        project = ProjectDocument(
            user_id=user_id,
            site_id=payload.site_id,
            bess_catalog_id=payload.bess_catalog_id,
            name=payload.name,
            project_type=payload.project_type,
            status=payload.status,
            configuration=payload.configuration,
            scenarios=payload.scenarios,
            dataset_ids=payload.dataset_ids,
        )
        created = await self.project_repository.create_project(project)
        return self._to_response(created)

    async def list_projects(
        self,
        user_id: str,
        *,
        page: int,
        page_size: int,
        skip: int,
    ) -> PageResponse[ProjectResponse]:
        total = await self.project_repository.count_by_user(user_id)
        projects = await self.project_repository.list_by_user(
            user_id,
            skip=skip,
            limit=page_size,
        )
        return PageResponse[ProjectResponse](
            items=[self._to_response(project) for project in projects],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def get_project(
        self,
        project_id: str,
        user_id: str,
    ) -> ProjectResponse:
        project = await self.project_repository.get_by_id_for_user(project_id, user_id)
        if project is None:
            raise NotFoundError("Project not found.")

        return self._to_response(project)

    async def update_project(
        self,
        project_id: str,
        payload: ProjectUpdateRequest,
        user_id: str,
    ) -> ProjectResponse:
        updates = payload.model_dump(exclude_unset=True)
        project = await self.project_repository.update_by_id_for_user(
            project_id,
            user_id,
            updates,
        )
        if project is None:
            raise NotFoundError("Project not found.")

        return self._to_response(project)

    async def delete_project(self, project_id: str, user_id: str) -> None:
        project = await self.project_repository.get_by_id_for_user(project_id, user_id)
        if project is None:
            raise NotFoundError("Project not found.")

        files = await self.file_repository.list_by_project_for_user(project_id, user_id)
        await self.dataset_repository.delete_by_project_for_user(project_id, user_id)
        await self.file_repository.delete_by_project_for_user(project_id, user_id)
        for file_document in files:
            self.storage_client.delete(file_document.storage_path)

        deleted = await self.project_repository.delete_by_id_for_user(
            project_id,
            user_id,
        )
        if not deleted:
            raise NotFoundError("Project not found.")

    def _to_response(self, project: ProjectDocument) -> ProjectResponse:
        return ProjectResponse.model_validate(project)
