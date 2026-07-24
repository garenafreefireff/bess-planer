from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.sites.enums import SiteStatus
from app.shared.schemas.object_id import ObjectIdStr


class SiteCreateRequest(BaseModel):
    tariff_id: ObjectIdStr
    name: str = Field(min_length=1, max_length=160)
    code: str = Field(min_length=1, max_length=80)
    location: dict[str, Any] = Field(default_factory=dict)
    voltage_level: str = Field(min_length=1, max_length=80)
    contract_capacity_kw: float = Field(gt=0)
    pv_system: dict[str, Any] = Field(default_factory=dict)
    status: SiteStatus = SiteStatus.ACTIVE

    @field_validator("name", "code", "voltage_level")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Value is required.")
        return stripped


class SiteUpdateRequest(BaseModel):
    tariff_id: ObjectIdStr | None = None
    name: str | None = Field(default=None, min_length=1, max_length=160)
    code: str | None = Field(default=None, min_length=1, max_length=80)
    location: dict[str, Any] | None = None
    voltage_level: str | None = Field(default=None, min_length=1, max_length=80)
    contract_capacity_kw: float | None = Field(default=None, gt=0)
    pv_system: dict[str, Any] | None = None
    status: SiteStatus | None = None

    @field_validator("name", "code", "voltage_level")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("Value is required.")
        return stripped

    @model_validator(mode="after")
    def require_at_least_one_change(self) -> "SiteUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        return self


class SiteResponse(BaseModel):
    id: str
    user_id: str
    tariff_id: str
    name: str
    code: str
    location: dict[str, Any] = Field(default_factory=dict)
    voltage_level: str
    contract_capacity_kw: float
    pv_system: dict[str, Any] = Field(default_factory=dict)
    status: SiteStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
