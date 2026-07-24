from typing import ClassVar

from pydantic import BaseModel, Field

from app.models.base import BaseDocument
from app.modules.users.enums import UserRole, UserStatus


class UserPreferences(BaseModel):
    language: str = "vi"
    timezone: str = "Asia/Ho_Chi_Minh"


class UserDocument(BaseDocument):
    collection_name: ClassVar[str] = "users"
    email: str
    password_hash: str
    company_name: str | None = None
    representative_name: str
    phone: str | None = None
    industry: str | None = None
    role: UserRole = UserRole.CUSTOMER
    status: UserStatus = UserStatus.ACTIVE
    preferences: UserPreferences = Field(default_factory=UserPreferences)
