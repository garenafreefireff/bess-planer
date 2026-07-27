from typing import ClassVar

from pydantic import Field

from app.models.base import BaseDocument


class OrganizationDocument(BaseDocument):
    collection_name: ClassVar[str] = "organizations"
    owner_user_id: str
    name: str
    industry: str | None = None
    phone: str | None = None
    address: str | None = None
    status: str = "active"
    member_user_ids: list[str] = Field(default_factory=list)
