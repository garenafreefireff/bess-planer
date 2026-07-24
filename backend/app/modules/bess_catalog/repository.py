from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictError
from app.core.security import utc_now
from app.models.bess_catalog import BessCatalogDocument
from app.modules.bess_catalog.enums import BessCatalogStatus


def _object_id(value: str) -> ObjectId:
    return ObjectId(value)


def _normalize_document_id(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None

    normalized = dict(document)
    if "_id" in normalized:
        normalized["_id"] = str(normalized["_id"])
    return normalized


def _query(catalog_status: BessCatalogStatus | None) -> dict[str, Any]:
    if catalog_status is None:
        return {}

    return {"status": catalog_status.value}


class BessCatalogRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["bess_catalog"]

    async def create_item(self, item: BessCatalogDocument) -> BessCatalogDocument:
        payload = item.model_dump(by_alias=True, exclude={"id"})

        try:
            result = await self.collection.insert_one(payload)
        except DuplicateKeyError as exc:
            raise ConflictError("BESS catalog code is already used.") from exc

        created = await self.collection.find_one({"_id": result.inserted_id})
        return BessCatalogDocument.model_validate(_normalize_document_id(created))

    async def count_items(self, catalog_status: BessCatalogStatus | None = None) -> int:
        return await self.collection.count_documents(_query(catalog_status))

    async def list_items(
        self,
        *,
        skip: int,
        limit: int,
        catalog_status: BessCatalogStatus | None = None,
    ) -> list[BessCatalogDocument]:
        cursor = (
            self.collection.find(_query(catalog_status))
            .sort([("version", -1), ("code", 1)])
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [
            BessCatalogDocument.model_validate(_normalize_document_id(document))
            for document in documents
        ]

    async def get_by_id(self, item_id: str) -> BessCatalogDocument | None:
        document = await self.collection.find_one({"_id": _object_id(item_id)})
        normalized = _normalize_document_id(document)
        return BessCatalogDocument.model_validate(normalized) if normalized else None

    async def get_by_code(self, code: str) -> BessCatalogDocument | None:
        document = await self.collection.find_one({"code": code})
        normalized = _normalize_document_id(document)
        return BessCatalogDocument.model_validate(normalized) if normalized else None

    async def update_by_id(
        self,
        item_id: str,
        updates: dict[str, Any],
    ) -> BessCatalogDocument | None:
        payload = dict(updates)
        payload["updated_at"] = utc_now()

        try:
            document = await self.collection.find_one_and_update(
                {"_id": _object_id(item_id)},
                {"$set": payload},
                return_document=ReturnDocument.AFTER,
            )
        except DuplicateKeyError as exc:
            raise ConflictError("BESS catalog code is already used.") from exc

        normalized = _normalize_document_id(document)
        return BessCatalogDocument.model_validate(normalized) if normalized else None

    async def delete_by_id(self, item_id: str) -> bool:
        result = await self.collection.delete_one({"_id": _object_id(item_id)})
        return result.deleted_count == 1
