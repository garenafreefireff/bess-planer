from hashlib import sha256
from pathlib import Path

from fastapi import UploadFile

from app.core.config import Settings
from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.dependencies.storage import LocalStorageClient
from app.models.file import FileDocument
from app.modules.datasets.repository import DatasetRepository
from app.modules.files.enums import FileKind
from app.modules.files.repository import FileRepository
from app.modules.files.schemas import FileResponse
from app.modules.projects.repository import ProjectRepository
from app.shared.schemas.pagination import PageMeta, PageResponse

ALLOWED_EXTENSIONS = {"csv", "xlsx"}


class FileService:
    def __init__(
        self,
        file_repository: FileRepository,
        dataset_repository: DatasetRepository,
        project_repository: ProjectRepository,
        storage_client: LocalStorageClient,
        settings: Settings,
    ) -> None:
        self.file_repository = file_repository
        self.dataset_repository = dataset_repository
        self.project_repository = project_repository
        self.storage_client = storage_client
        self.settings = settings

    async def upload_file(
        self,
        upload: UploadFile,
        *,
        project_id: str,
        kind: FileKind,
        user_id: str,
    ) -> FileResponse:
        project = await self.project_repository.get_by_id_for_user(project_id, user_id)
        if project is None:
            raise NotFoundError("Project not found.")

        original_name = Path(upload.filename or "upload.bin").name
        extension = Path(original_name).suffix.lower().lstrip(".")
        if extension not in ALLOWED_EXTENSIONS:
            raise AppError("Only CSV and XLSX files are supported.", code="unsupported_file_type")

        max_size = self.settings.max_upload_size_mb * 1024 * 1024
        content = await upload.read(max_size + 1)
        await upload.close()
        if not content:
            raise AppError("Uploaded file is empty.", code="empty_file")
        if len(content) > max_size:
            raise AppError(
                f"File exceeds the {self.settings.max_upload_size_mb} MB upload limit.",
                code="file_too_large",
            )

        relative_path, _ = self.storage_client.save(
            content,
            user_id=user_id,
            project_id=project_id,
            extension=extension,
        )
        file_document = FileDocument(
            user_id=user_id,
            project_id=project_id,
            original_name=original_name,
            storage_name=Path(relative_path).name,
            storage_path=relative_path,
            content_type=upload.content_type or "application/octet-stream",
            extension=extension,
            size_bytes=len(content),
            sha256=sha256(content).hexdigest(),
            kind=kind,
            metadata={},
        )
        try:
            created = await self.file_repository.create_file(file_document)
        except Exception:
            self.storage_client.delete(relative_path)
            raise
        return self._to_response(created)

    async def list_files(
        self,
        user_id: str,
        *,
        page: int,
        page_size: int,
        skip: int,
    ) -> PageResponse[FileResponse]:
        total = await self.file_repository.count_by_user(user_id)
        files = await self.file_repository.list_by_user(user_id, skip=skip, limit=page_size)
        return PageResponse[FileResponse](
            items=[self._to_response(item) for item in files],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def get_file(self, file_id: str, user_id: str) -> FileResponse:
        file_document = await self._get_document(file_id, user_id)
        return self._to_response(file_document)

    async def get_download(self, file_id: str, user_id: str) -> tuple[Path, FileDocument]:
        file_document = await self._get_document(file_id, user_id)
        path = self.storage_client.resolve(file_document.storage_path)
        if not path.exists():
            raise NotFoundError("Stored file is missing.")
        return path, file_document

    async def delete_file(self, file_id: str, user_id: str) -> None:
        if await self.dataset_repository.count_by_file_for_user(file_id, user_id):
            raise ConflictError("Delete the derived dataset before deleting this file.")
        deleted = await self.file_repository.delete_by_id_for_user(file_id, user_id)
        if deleted is None:
            raise NotFoundError("File not found.")
        self.storage_client.delete(deleted.storage_path)

    async def _get_document(self, file_id: str, user_id: str) -> FileDocument:
        file_document = await self.file_repository.get_by_id_for_user(file_id, user_id)
        if file_document is None:
            raise NotFoundError("File not found.")
        return file_document

    @staticmethod
    def _to_response(file_document: FileDocument) -> FileResponse:
        return FileResponse.model_validate(file_document)
