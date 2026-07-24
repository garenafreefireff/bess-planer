from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.bess_catalog.enums import BessCatalogStatus


class BessCatalogCreateRequest(BaseModel):
    code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    battery: dict[str, Any] = Field(default_factory=dict)
    pcs: dict[str, Any] = Field(default_factory=dict)
    cost: dict[str, Any] = Field(default_factory=dict)
    warranty: dict[str, Any] = Field(default_factory=dict)
    version: int = Field(default=1, ge=1)
    status: BessCatalogStatus = BessCatalogStatus.ACTIVE

    @field_validator("code", "name", mode="before")
    @classmethod
    def strip_required_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        stripped = value.strip()
        if not stripped:
            raise ValueError("Value is required.")
        return stripped


class BessCatalogUpdateRequest(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=80)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    battery: dict[str, Any] | None = None
    pcs: dict[str, Any] | None = None
    cost: dict[str, Any] | None = None
    warranty: dict[str, Any] | None = None
    version: int | None = Field(default=None, ge=1)
    status: BessCatalogStatus | None = None

    @field_validator("code", "name", mode="before")
    @classmethod
    def strip_optional_text(cls, value: object) -> object:
        if value is None or not isinstance(value, str):
            return value

        stripped = value.strip()
        if not stripped:
            raise ValueError("Value is required.")
        return stripped

    @model_validator(mode="after")
    def require_at_least_one_change(self) -> "BessCatalogUpdateRequest":
        updates = self.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            raise ValueError("At least one field must be provided.")
        return self


class BessCatalogResponse(BaseModel):
    id: str
    code: str
    name: str
    battery: dict[str, Any] = Field(default_factory=dict)
    pcs: dict[str, Any] = Field(default_factory=dict)
    cost: dict[str, Any] = Field(default_factory=dict)
    warranty: dict[str, Any] = Field(default_factory=dict)
    version: int
    status: BessCatalogStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
