from datetime import date
from typing import Any, ClassVar

from pydantic import Field

from app.models.base import BaseDocument
from app.modules.tariffs.enums import TariffStatus


class TariffDocument(BaseDocument):
    collection_name: ClassVar[str] = "tariffs"
    code: str
    name: str
    customer_group: str
    voltage_level: str
    currency: str
    energy_prices: dict[str, Any] = Field(default_factory=dict)
    tou_periods: list[dict[str, Any]] = Field(default_factory=list)
    demand_charge_per_kw: int
    vat_pct: float
    version: int = 1
    effective_from: date
    status: TariffStatus = TariffStatus.ACTIVE
