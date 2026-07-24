from typing import Any, ClassVar

from pydantic import Field

from app.models.base import BaseDocument
from app.modules.bess_catalog.enums import BessCatalogStatus


class BessCatalogDocument(BaseDocument):
    collection_name: ClassVar[str] = "bess_catalog"
    code: str
    name: str
    battery: dict[str, Any] = Field(default_factory=dict)
    pcs: dict[str, Any] = Field(default_factory=dict)
    cost: dict[str, Any] = Field(default_factory=dict)
    warranty: dict[str, Any] = Field(default_factory=dict)
    version: int = 1
    status: BessCatalogStatus = BessCatalogStatus.ACTIVE
