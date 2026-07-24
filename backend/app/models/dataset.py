from typing import ClassVar

from app.models.base import BaseDocument


class DatasetDocument(BaseDocument):
    collection_name: ClassVar[str] = "datasets"
