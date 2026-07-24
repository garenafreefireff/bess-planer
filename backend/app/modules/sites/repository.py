from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.core.security import utc_now
from app.models.site import SiteDocument

REFERENCE_FIELDS = {"user_id", "tariff_id"}


def _object_id(value: str) -> ObjectId:
    return ObjectId(value)


def _normalize_document_id(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None

    normalized = dict(document)
    if "_id" in normalized:
        normalized["_id"] = str(normalized["_id"])

    for field in REFERENCE_FIELDS:
        if field in normalized and normalized[field] is not None:
            normalized[field] = str(normalized[field])

    return normalized


def _site_to_mongo(site: SiteDocument) -> dict[str, Any]:
    payload = site.model_dump(by_alias=True, exclude={"id"})
    return _references_to_object_ids(payload)


def _references_to_object_ids(payload: dict[str, Any]) -> dict[str, Any]:
    converted = dict(payload)

    for field in REFERENCE_FIELDS:
        if field in converted and converted[field] is not None:
            converted[field] = _object_id(converted[field])

    return converted


class SiteRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["sites"]

    async def create_site(self, site: SiteDocument) -> SiteDocument:
        payload = _site_to_mongo(site)
        result = await self.collection.insert_one(payload)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return SiteDocument.model_validate(_normalize_document_id(created))

    async def count_by_user(self, user_id: str) -> int:
        return await self.collection.count_documents({"user_id": _object_id(user_id)})

    async def list_by_user(
        self,
        user_id: str,
        *,
        skip: int,
        limit: int,
    ) -> list[SiteDocument]:
        cursor = (
            self.collection.find({"user_id": _object_id(user_id)})
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [
            SiteDocument.model_validate(_normalize_document_id(document))
            for document in documents
        ]

    async def get_by_id_for_user(self, site_id: str, user_id: str) -> SiteDocument | None:
        document = await self.collection.find_one(
            {
                "_id": _object_id(site_id),
                "user_id": _object_id(user_id),
            }
        )
        normalized = _normalize_document_id(document)
        return SiteDocument.model_validate(normalized) if normalized else None

    async def update_by_id_for_user(
        self,
        site_id: str,
        user_id: str,
        updates: dict[str, Any],
    ) -> SiteDocument | None:
        payload = _references_to_object_ids(updates)
        payload["updated_at"] = utc_now()

        document = await self.collection.find_one_and_update(
            {
                "_id": _object_id(site_id),
                "user_id": _object_id(user_id),
            },
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )
        normalized = _normalize_document_id(document)
        return SiteDocument.model_validate(normalized) if normalized else None

    async def delete_by_id_for_user(self, site_id: str, user_id: str) -> bool:
        result = await self.collection.delete_one(
            {
                "_id": _object_id(site_id),
                "user_id": _object_id(user_id),
            }
        )
        return result.deleted_count == 1
