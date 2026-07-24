from typing import ClassVar

from app.models.base import BaseDocument


class FileDocument(BaseDocument):
    collection_name: ClassVar[str] = "files"
