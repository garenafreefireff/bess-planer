from typing import ClassVar

from app.models.base import BaseDocument


class ReportDocument(BaseDocument):
    collection_name: ClassVar[str] = "reports"
