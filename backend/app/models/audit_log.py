from typing import ClassVar

from app.models.base import BaseDocument


class AuditLogDocument(BaseDocument):
    collection_name: ClassVar[str] = "audit_logs"
