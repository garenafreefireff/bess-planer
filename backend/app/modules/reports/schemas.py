from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class NotificationOutboxCreate(BaseModel):
    channel: str = "email"
    event_type: str = Field(min_length=1, max_length=100)
    recipient: str = Field(min_length=1, max_length=320)
    subject: str = Field(min_length=1, max_length=240)
    template_key: str = Field(min_length=1, max_length=120)
    payload: dict[str, Any] = Field(default_factory=dict)


class NotificationOutboxResponse(BaseModel):
    id: str
    channel: str
    event_type: str
    recipient: str
    subject: str
    template_key: str
    payload: dict[str, Any]
    status: str
    attempts: int
    last_error: str | None = None
    sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

