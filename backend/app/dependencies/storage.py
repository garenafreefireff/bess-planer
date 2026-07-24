from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import Depends

from app.core.config import Settings, get_settings


class LocalStorageClient:
    def __init__(self, root_directory: str) -> None:
        self.root = Path(root_directory).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, content: bytes, *, user_id: str, project_id: str, extension: str) -> tuple[str, str]:
        safe_extension = extension.lower().lstrip(".") or "bin"
        relative = Path(user_id) / project_id / f"{uuid4().hex}.{safe_extension}"
        destination = (self.root / relative).resolve()
        if self.root not in destination.parents:
            raise ValueError("Invalid storage path.")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return str(relative).replace("\\", "/"), str(destination)

    def resolve(self, relative_path: str) -> Path:
        candidate = (self.root / relative_path).resolve()
        if self.root != candidate and self.root not in candidate.parents:
            raise ValueError("Invalid storage path.")
        return candidate

    def delete(self, relative_path: str) -> None:
        path = self.resolve(relative_path)
        if path.exists() and path.is_file():
            path.unlink()


def get_storage_client(settings: Annotated[Settings, Depends(get_settings)]) -> LocalStorageClient:
    return LocalStorageClient(settings.storage_directory)


StorageClientDep = Annotated[LocalStorageClient, Depends(get_storage_client)]
