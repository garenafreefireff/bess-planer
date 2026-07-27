from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.user import UserPreferences
from app.modules.users.enums import UserRole, UserStatus


class UserResponse(BaseModel):
    id: str
    email: str
    company_name: str | None = None
    representative_name: str
    phone: str | None = None
    industry: str | None = None
    organization_id: str | None = None
    role: UserRole
    status: UserStatus
    preferences: UserPreferences
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationResponse(BaseModel):
    id: str
    owner_user_id: str
    name: str
    industry: str | None = None
    phone: str | None = None
    address: str | None = None
    status: str
    member_user_ids: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    industry: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=500)

    @field_validator("name", "industry", "phone", "address", mode="before")
    @classmethod
    def normalize_organization_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def require_organization_change(self) -> "OrganizationUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        return self


class AdminUserUpdateRequest(BaseModel):
    company_name: str | None = Field(default=None, max_length=160)
    representative_name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    industry: str | None = Field(default=None, max_length=120)
    role: UserRole | None = None
    status: UserStatus | None = None

    @field_validator("company_name", "representative_name", "phone", "industry", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def require_change(self) -> "AdminUserUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        return self
