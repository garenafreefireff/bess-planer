from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.tariffs.enums import TariffStatus


class TariffCreateRequest(BaseModel):
    code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    customer_group: str = Field(min_length=1, max_length=80)
    voltage_level: str = Field(min_length=1, max_length=80)
    currency: str
    energy_prices: dict[str, Any] = Field(default_factory=dict)
    tou_periods: list[dict[str, Any]] = Field(default_factory=list)
    demand_charge_per_kw: int = Field(ge=0)
    vat_pct: float = Field(ge=0)
    version: int = Field(default=1, ge=1)
    effective_from: date
    status: TariffStatus = TariffStatus.ACTIVE

    @field_validator("code", "name", "customer_group", "voltage_level", mode="before")
    @classmethod
    def strip_required_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        stripped = value.strip()
        if not stripped:
            raise ValueError("Value is required.")
        return stripped

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        currency = value.strip().upper()
        if len(currency) != 3 or not currency.isalpha():
            raise ValueError("Currency must be a 3-letter ISO currency code.")
        return currency


class TariffUpdateRequest(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=80)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    customer_group: str | None = Field(default=None, min_length=1, max_length=80)
    voltage_level: str | None = Field(default=None, min_length=1, max_length=80)
    currency: str | None = None
    energy_prices: dict[str, Any] | None = None
    tou_periods: list[dict[str, Any]] | None = None
    demand_charge_per_kw: int | None = Field(default=None, ge=0)
    vat_pct: float | None = Field(default=None, ge=0)
    version: int | None = Field(default=None, ge=1)
    effective_from: date | None = None
    status: TariffStatus | None = None

    @field_validator("code", "name", "customer_group", "voltage_level", mode="before")
    @classmethod
    def strip_optional_text(cls, value: object) -> object:
        if value is None or not isinstance(value, str):
            return value

        stripped = value.strip()
        if not stripped:
            raise ValueError("Value is required.")
        return stripped

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_optional_currency(cls, value: object) -> object:
        if value is None or not isinstance(value, str):
            return value

        currency = value.strip().upper()
        if len(currency) != 3 or not currency.isalpha():
            raise ValueError("Currency must be a 3-letter ISO currency code.")
        return currency

    @model_validator(mode="after")
    def require_at_least_one_change(self) -> "TariffUpdateRequest":
        updates = self.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            raise ValueError("At least one field must be provided.")
        return self


class TariffResponse(BaseModel):
    id: str
    code: str
    name: str
    customer_group: str
    voltage_level: str
    currency: str
    energy_prices: dict[str, Any] = Field(default_factory=dict)
    tou_periods: list[dict[str, Any]] = Field(default_factory=list)
    demand_charge_per_kw: int
    vat_pct: float
    version: int
    effective_from: date
    status: TariffStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
