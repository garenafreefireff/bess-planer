from datetime import datetime
from typing import Any, ClassVar

from pydantic import BaseModel, Field

from app.core.security import utc_now
from app.models.base import BaseDocument
from app.modules.leads.enums import LeadSource, LeadStatus


class LeadInteraction(BaseModel):
    source: LeadSource
    occurred_at: datetime = Field(default_factory=utc_now)
    payload: dict[str, Any] = Field(default_factory=dict)


class LeadDocument(BaseDocument):
    collection_name: ClassVar[str] = "leads"
    email: str
    full_name: str | None = None
    phone: str | None = None
    company_name: str | None = None
    industry: str | None = None
    interest: str | None = None
    message: str | None = None
    user_id: str | None = None
    sources: list[LeadSource] = Field(default_factory=list)
    status: LeadStatus = LeadStatus.NEW
    assigned_to: str | None = None
    admin_note: str | None = None
    tags: list[str] = Field(default_factory=list)
    privacy_consent: bool = False
    marketing_consent: bool = False
    training_consent: bool = False
    touch_count: int = 1
    result_code: str | None = None
    latest_quick_sizing_input: dict[str, Any] | None = None
    latest_quick_sizing_result: dict[str, Any] | None = None
    interactions: list[LeadInteraction] = Field(default_factory=list)
    converted_at: datetime | None = None
