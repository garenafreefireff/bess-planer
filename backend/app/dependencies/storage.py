from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Annotated, ContextManager, Protocol
from uuid import uuid4

from fastapi import Depends

from app.core.config import Settings, get_settings


class StorageClient(Protocol):
    def save(
        self,
        content: bytes,
        *,
        user_id: str,
        project_id: str,
        extension: str,
    ) -> tuple[str, str]: ...

    def exists(self, storage_path: str) -> bool: ...

    def delete(self, storage_path: str) -> None: ...

    def iter_bytes(
        self,
        storage_path: str,
        *,
        chunk_size: int = 1024 * 1024,
    ) -> Iterator[bytes]: ...

    def materialize(self, storage_path: str) -> ContextManager[Path]: ...


class LocalStorageClient:
    def __init__(self, root_directory: str) -> None:
        self.root = Path(root_directory).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def save(
        self,
        content: bytes,
        *,
        user_id: str,
        project_id: str,
        extension: str,
    ) -> tuple[str, str]:
        safe_extension = extension.lower().lstrip(".") or "bin"
        relative = Path(user_id) / project_id / f"{uuid4().hex}.{safe_extension}"
        destination = self._resolve(str(relative))
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return str(relative).replace("\\", "/"), str(destination)

    def exists(self, storage_path: str) -> bool:
        path = self._resolve(storage_path)
        return path.exists() and path.is_file()

    def delete(self, storage_path: str) -> None:
        path = self._resolve(storage_path)
        if path.exists() and path.is_file():
            path.unlink()

    def iter_bytes(
        self,
        storage_path: str,
        *,
        chunk_size: int = 1024 * 1024,
    ) -> Iterator[bytes]:
        path = self._resolve(storage_path)
        with path.open("rb") as source:
            while chunk := source.read(chunk_size):
                yield chunk

    @contextmanager
    def materialize(self, storage_path: str) -> Iterator[Path]:
        path = self._resolve(storage_path)
        if not path.exists():
            raise FileNotFoundError(storage_path)
        yield path

    def _resolve(self, storage_path: str) -> Path:
        candidate = (self.root / storage_path).resolve()
        if self.root != candidate and self.root not in candidate.parents:
            raise ValueError("Invalid storage path.")
        return candidate


def get_storage_client(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StorageClient:
    return LocalStorageClient(settings.storage_directory)


StorageClientDep = Annotated[StorageClient, Depends(get_storage_client)]
