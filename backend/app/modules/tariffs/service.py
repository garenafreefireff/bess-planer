from app.core.exceptions import NotFoundError
from app.models.tariff import TariffDocument
from app.modules.tariffs.enums import TariffStatus
from app.modules.tariffs.repository import TariffRepository
from app.modules.tariffs.schemas import (
    TariffCreateRequest,
    TariffResponse,
    TariffUpdateRequest,
)
from app.shared.schemas.pagination import PageMeta, PageResponse


class TariffService:
    def __init__(self, tariff_repository: TariffRepository) -> None:
        self.tariff_repository = tariff_repository

    async def create_tariff(self, payload: TariffCreateRequest) -> TariffResponse:
        tariff = TariffDocument(
            code=payload.code,
            name=payload.name,
            customer_group=payload.customer_group,
            voltage_level=payload.voltage_level,
            currency=payload.currency,
            energy_prices=payload.energy_prices,
            tou_periods=payload.tou_periods,
            demand_charge_per_kw=payload.demand_charge_per_kw,
            vat_pct=payload.vat_pct,
            version=payload.version,
            effective_from=payload.effective_from,
            status=payload.status,
        )
        created = await self.tariff_repository.create_tariff(tariff)
        return self._to_response(created)

    async def list_tariffs(
        self,
        *,
        page: int,
        page_size: int,
        skip: int,
        tariff_status: TariffStatus | None = None,
    ) -> PageResponse[TariffResponse]:
        total = await self.tariff_repository.count_tariffs(tariff_status)
        tariffs = await self.tariff_repository.list_tariffs(
            skip=skip,
            limit=page_size,
            tariff_status=tariff_status,
        )
        return PageResponse[TariffResponse](
            items=[self._to_response(tariff) for tariff in tariffs],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def get_tariff(self, tariff_id: str) -> TariffResponse:
        tariff = await self.tariff_repository.get_by_id(tariff_id)
        if tariff is None:
            raise NotFoundError("Tariff not found.")

        return self._to_response(tariff)

    async def update_tariff(
        self,
        tariff_id: str,
        payload: TariffUpdateRequest,
    ) -> TariffResponse:
        updates = payload.model_dump(exclude_unset=True, exclude_none=True)
        tariff = await self.tariff_repository.update_by_id(tariff_id, updates)
        if tariff is None:
            raise NotFoundError("Tariff not found.")

        return self._to_response(tariff)

    async def delete_tariff(self, tariff_id: str) -> None:
        deleted = await self.tariff_repository.delete_by_id(tariff_id)
        if not deleted:
            raise NotFoundError("Tariff not found.")

    def _to_response(self, tariff: TariffDocument) -> TariffResponse:
        return TariffResponse.model_validate(tariff)
