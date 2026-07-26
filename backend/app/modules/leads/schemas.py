import json
import re
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.leads.enums import LeadSource, LeadStatus

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LeadCreateRequest(BaseModel):
    source: LeadSource = LeadSource.CONTACT_FORM
    full_name: str = Field(min_length=1, max_length=120)
    email: str
    phone: str | None = Field(default=None, max_length=40)
    company_name: str | None = Field(default=None, max_length=160)
    industry: str | None = Field(default=None, max_length=120)
    interest: str | None = Field(default=None, max_length=160)
    message: str | None = Field(default=None, max_length=4000)
    privacy_consent: bool = False
    marketing_consent: bool = False
    training_consent: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not EMAIL_PATTERN.match(email):
            raise ValueError("Invalid email address.")
        return email

    @field_validator(
        "full_name",
        "phone",
        "company_name",
        "industry",
        "interest",
        "message",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def validate_public_capture(self) -> "LeadCreateRequest":
        if not self.privacy_consent:
            raise ValueError("Privacy consent is required.")
        metadata_size = len(
            json.dumps(self.metadata, ensure_ascii=False, default=str).encode("utf-8")
        )
        if metadata_size > 32 * 1024:
            raise ValueError("Lead metadata is too large.")
        return self


class QuickSizingLeadCreateRequest(LeadCreateRequest):
    source: LeadSource = LeadSource.QUICK_SIZING
    analysis_run_id: str | None = None
    input_snapshot: dict[str, Any]
    result_snapshot: dict[str, Any]

    @model_validator(mode="after")
    def validate_snapshot_size(self) -> "QuickSizingLeadCreateRequest":
        snapshot_size = len(
            json.dumps(
                {
                    "input": self.input_snapshot,
                    "result": self.result_snapshot,
                },
                ensure_ascii=False,
                default=str,
            ).encode("utf-8")
        )
        if snapshot_size > 768 * 1024:
            raise ValueError("Quick Sizing snapshot is too large.")
        return self


class LeadAdminUpdateRequest(BaseModel):
    status: LeadStatus | None = None
    assigned_to: str | None = Field(default=None, max_length=120)
    admin_note: str | None = Field(default=None, max_length=4000)
    tags: list[str] | None = None

    @field_validator("assigned_to", "admin_note", mode="before")
    @classmethod
    def strip_optional_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        return stripped or None

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return sorted({item.strip().lower() for item in value if item.strip()})[:30]

    @model_validator(mode="after")
    def require_change(self) -> "LeadAdminUpdateRequest":
        updates = self.model_dump(exclude_unset=True)
        if not updates or (set(updates) == {"status"} and updates["status"] is None):
            raise ValueError("At least one valid field must be provided.")
        return self


class LeadInteractionResponse(BaseModel):
    source: LeadSource
    occurred_at: datetime
    payload: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class LeadResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    phone: str | None = None
    company_name: str | None = None
    industry: str | None = None
    interest: str | None = None
    message: str | None = None
    user_id: str | None = None
    sources: list[LeadSource]
    status: LeadStatus
    assigned_to: str | None = None
    admin_note: str | None = None
    tags: list[str]
    privacy_consent: bool
    marketing_consent: bool
    training_consent: bool
    touch_count: int
    result_code: str | None = None
    latest_quick_sizing_input: dict[str, Any] | None = None
    latest_quick_sizing_result: dict[str, Any] | None = None
    interactions: list[LeadInteractionResponse] = Field(default_factory=list)
    converted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadCaptureResponse(BaseModel):
    lead_id: str
    email: str
    result_code: str | None = None
    report_unlocked: bool = False
