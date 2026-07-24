from typing import ClassVar

from pydantic import Field

from app.models.base import BaseDocument
from app.modules.sites.enums import SiteStatus


class SiteDocument(BaseDocument):
    collection_name: ClassVar[str] = "sites"
    user_id: str
    tariff_id: str
    name: str
    code: str
    location: dict = Field(default_factory=dict)
    voltage_level: str
    contract_capacity_kw: float
    pv_system: dict = Field(default_factory=dict)
    status: SiteStatus = SiteStatus.ACTIVE
