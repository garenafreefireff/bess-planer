from app.core.exceptions import NotFoundError
from app.models.bess_catalog import BessCatalogDocument
from app.modules.bess_catalog.enums import BessCatalogStatus
from app.modules.bess_catalog.repository import BessCatalogRepository
from app.modules.bess_catalog.schemas import (
    BessCatalogCreateRequest,
    BessCatalogResponse,
    BessCatalogUpdateRequest,
)
from app.shared.schemas.pagination import PageMeta, PageResponse


class BessCatalogService:
    def __init__(self, bess_catalog_repository: BessCatalogRepository) -> None:
        self.bess_catalog_repository = bess_catalog_repository

    async def create_item(self, payload: BessCatalogCreateRequest) -> BessCatalogResponse:
        item = BessCatalogDocument(
            code=payload.code,
            name=payload.name,
            battery=payload.battery,
            pcs=payload.pcs,
            cost=payload.cost,
            warranty=payload.warranty,
            version=payload.version,
            status=payload.status,
        )
        created = await self.bess_catalog_repository.create_item(item)
        return self._to_response(created)

    async def list_items(
        self,
        *,
        page: int,
        page_size: int,
        skip: int,
        catalog_status: BessCatalogStatus | None = None,
    ) -> PageResponse[BessCatalogResponse]:
        total = await self.bess_catalog_repository.count_items(catalog_status)
        items = await self.bess_catalog_repository.list_items(
            skip=skip,
            limit=page_size,
            catalog_status=catalog_status,
        )
        return PageResponse[BessCatalogResponse](
            items=[self._to_response(item) for item in items],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def get_item(self, item_id: str) -> BessCatalogResponse:
        item = await self.bess_catalog_repository.get_by_id(item_id)
        if item is None:
            raise NotFoundError("BESS catalog item not found.")

        return self._to_response(item)

    async def update_item(
        self,
        item_id: str,
        payload: BessCatalogUpdateRequest,
    ) -> BessCatalogResponse:
        updates = payload.model_dump(exclude_unset=True, exclude_none=True)
        item = await self.bess_catalog_repository.update_by_id(item_id, updates)
        if item is None:
            raise NotFoundError("BESS catalog item not found.")

        return self._to_response(item)

    async def delete_item(self, item_id: str) -> None:
        deleted = await self.bess_catalog_repository.delete_by_id(item_id)
        if not deleted:
            raise NotFoundError("BESS catalog item not found.")

    def _to_response(self, item: BessCatalogDocument) -> BessCatalogResponse:
        return BessCatalogResponse.model_validate(item)
