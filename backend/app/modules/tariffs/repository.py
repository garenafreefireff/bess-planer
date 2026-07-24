from datetime import UTC, date, datetime, time
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictError
from app.core.security import utc_now
from app.models.tariff import TariffDocument
from app.modules.tariffs.enums import TariffStatus


def _object_id(value: str) -> ObjectId:
    return ObjectId(value)


def _normalize_document_id(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None

    normalized = dict(document)
    if "_id" in normalized:
        normalized["_id"] = str(normalized["_id"])

    effective_from = normalized.get("effective_from")
    if isinstance(effective_from, datetime):
        normalized["effective_from"] = effective_from.date()

    return normalized


def _date_to_mongo(value: date | datetime) -> datetime:
    if isinstance(value, datetime):
        return value

    return datetime.combine(value, time.min, tzinfo=UTC)


def _tariff_to_mongo(tariff: TariffDocument) -> dict[str, Any]:
    payload = tariff.model_dump(by_alias=True, exclude={"id"})
    payload["effective_from"] = _date_to_mongo(payload["effective_from"])
    return payload


def _updates_to_mongo(updates: dict[str, Any]) -> dict[str, Any]:
    payload = dict(updates)
    if "effective_from" in payload and payload["effective_from"] is not None:
        payload["effective_from"] = _date_to_mongo(payload["effective_from"])
    return payload


def _query(tariff_status: TariffStatus | None) -> dict[str, Any]:
    if tariff_status is None:
        return {}

    return {"status": tariff_status.value}


class TariffRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["tariffs"]

    async def create_tariff(self, tariff: TariffDocument) -> TariffDocument:
        payload = _tariff_to_mongo(tariff)

        try:
            result = await self.collection.insert_one(payload)
        except DuplicateKeyError as exc:
            raise ConflictError("Tariff code is already used.") from exc

        created = await self.collection.find_one({"_id": result.inserted_id})
        return TariffDocument.model_validate(_normalize_document_id(created))

    async def count_tariffs(self, tariff_status: TariffStatus | None = None) -> int:
        return await self.collection.count_documents(_query(tariff_status))

    async def list_tariffs(
        self,
        *,
        skip: int,
        limit: int,
        tariff_status: TariffStatus | None = None,
    ) -> list[TariffDocument]:
        cursor = (
            self.collection.find(_query(tariff_status))
            .sort([("effective_from", -1), ("version", -1), ("code", 1)])
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [
            TariffDocument.model_validate(_normalize_document_id(document))
            for document in documents
        ]

    async def get_by_id(self, tariff_id: str) -> TariffDocument | None:
        document = await self.collection.find_one({"_id": _object_id(tariff_id)})
        normalized = _normalize_document_id(document)
        return TariffDocument.model_validate(normalized) if normalized else None

    async def get_by_code(self, code: str) -> TariffDocument | None:
        document = await self.collection.find_one({"code": code})
        normalized = _normalize_document_id(document)
        return TariffDocument.model_validate(normalized) if normalized else None

    async def update_by_id(
        self,
        tariff_id: str,
        updates: dict[str, Any],
    ) -> TariffDocument | None:
        payload = _updates_to_mongo(updates)
        payload["updated_at"] = utc_now()

        try:
            document = await self.collection.find_one_and_update(
                {"_id": _object_id(tariff_id)},
                {"$set": payload},
                return_document=ReturnDocument.AFTER,
            )
        except DuplicateKeyError as exc:
            raise ConflictError("Tariff code is already used.") from exc

        normalized = _normalize_document_id(document)
        return TariffDocument.model_validate(normalized) if normalized else None

    async def delete_by_id(self, tariff_id: str) -> bool:
        result = await self.collection.delete_one({"_id": _object_id(tariff_id)})
        return result.deleted_count == 1
