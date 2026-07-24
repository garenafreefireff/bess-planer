from typing import ClassVar

from app.models.base import BaseDocument


class LeadDocument(BaseDocument):
    collection_name: ClassVar[str] = "leads"
