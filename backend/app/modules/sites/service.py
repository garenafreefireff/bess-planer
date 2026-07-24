from app.core.exceptions import NotFoundError
from app.models.site import SiteDocument
from app.modules.sites.repository import SiteRepository
from app.modules.sites.schemas import SiteCreateRequest, SiteResponse, SiteUpdateRequest
from app.shared.schemas.pagination import PageMeta, PageResponse


class SiteService:
    def __init__(self, site_repository: SiteRepository) -> None:
        self.site_repository = site_repository

    async def create_site(self, payload: SiteCreateRequest, user_id: str) -> SiteResponse:
        site = SiteDocument(
            user_id=user_id,
            tariff_id=payload.tariff_id,
            name=payload.name,
            code=payload.code,
            location=payload.location,
            voltage_level=payload.voltage_level,
            contract_capacity_kw=payload.contract_capacity_kw,
            pv_system=payload.pv_system,
            status=payload.status,
        )
        created = await self.site_repository.create_site(site)
        return self._to_response(created)

    async def list_sites(
        self,
        user_id: str,
        *,
        page: int,
        page_size: int,
        skip: int,
    ) -> PageResponse[SiteResponse]:
        total = await self.site_repository.count_by_user(user_id)
        sites = await self.site_repository.list_by_user(
            user_id,
            skip=skip,
            limit=page_size,
        )
        return PageResponse[SiteResponse](
            items=[self._to_response(site) for site in sites],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def get_site(self, site_id: str, user_id: str) -> SiteResponse:
        site = await self.site_repository.get_by_id_for_user(site_id, user_id)
        if site is None:
            raise NotFoundError("Site not found.")

        return self._to_response(site)

    async def update_site(
        self,
        site_id: str,
        payload: SiteUpdateRequest,
        user_id: str,
    ) -> SiteResponse:
        updates = payload.model_dump(exclude_unset=True)
        site = await self.site_repository.update_by_id_for_user(site_id, user_id, updates)
        if site is None:
            raise NotFoundError("Site not found.")

        return self._to_response(site)

    async def delete_site(self, site_id: str, user_id: str) -> None:
        deleted = await self.site_repository.delete_by_id_for_user(site_id, user_id)
        if not deleted:
            raise NotFoundError("Site not found.")

    def _to_response(self, site: SiteDocument) -> SiteResponse:
        return SiteResponse.model_validate(site)
