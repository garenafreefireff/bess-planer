from datetime import datetime
from typing import Any, ClassVar

from pydantic import Field

from app.models.base import BaseDocument


class NotificationOutboxDocument(BaseDocument):
    collection_name: ClassVar[str] = "notification_outbox"
    channel: str = "email"
    event_type: str
    recipient: str
    subject: str
    template_key: str
    payload: dict[str, Any] = Field(default_factory=dict)
    status: str = "pending"
    attempts: int = 0
    last_error: str | None = None
    sent_at: datetime | None = None
