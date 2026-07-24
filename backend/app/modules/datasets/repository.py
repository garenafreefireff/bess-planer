from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.dataset import DatasetDocument

REFERENCE_FIELDS = {"user_id", "project_id", "file_id"}


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


def _to_mongo(dataset: DatasetDocument) -> dict[str, Any]:
    payload = dataset.model_dump(by_alias=True, exclude={"id"})
    for field in REFERENCE_FIELDS:
        payload[field] = _object_id(payload[field])
    return payload


class DatasetRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["datasets"]

    async def create_dataset(self, dataset: DatasetDocument) -> DatasetDocument:
        result = await self.collection.insert_one(_to_mongo(dataset))
        created = await self.collection.find_one({"_id": result.inserted_id})
        return DatasetDocument.model_validate(_normalize_document_id(created))

    async def count_by_user(self, user_id: str, project_id: str | None = None) -> int:
        query: dict[str, Any] = {"user_id": _object_id(user_id)}
        if project_id:
            query["project_id"] = _object_id(project_id)
        return await self.collection.count_documents(query)

    async def list_by_user(
        self,
        user_id: str,
        *,
        skip: int,
        limit: int,
        project_id: str | None = None,
    ) -> list[DatasetDocument]:
        query: dict[str, Any] = {"user_id": _object_id(user_id)}
        if project_id:
            query["project_id"] = _object_id(project_id)
        cursor = self.collection.find(query).sort("updated_at", -1).skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        return [DatasetDocument.model_validate(_normalize_document_id(item)) for item in documents]

    async def get_by_file_for_user(
        self,
        file_id: str,
        user_id: str,
    ) -> DatasetDocument | None:
        document = await self.collection.find_one(
            {"file_id": _object_id(file_id), "user_id": _object_id(user_id)}
        )
        normalized = _normalize_document_id(document)
        return DatasetDocument.model_validate(normalized) if normalized else None

    async def count_by_file_for_user(self, file_id: str, user_id: str) -> int:
        return await self.collection.count_documents(
            {"file_id": _object_id(file_id), "user_id": _object_id(user_id)}
        )

    async def delete_by_project_for_user(self, project_id: str, user_id: str) -> None:
        await self.collection.delete_many(
            {"project_id": _object_id(project_id), "user_id": _object_id(user_id)}
        )

    async def get_by_id_for_user(self, dataset_id: str, user_id: str) -> DatasetDocument | None:
        document = await self.collection.find_one(
            {"_id": _object_id(dataset_id), "user_id": _object_id(user_id)}
        )
        normalized = _normalize_document_id(document)
        return DatasetDocument.model_validate(normalized) if normalized else None

    async def delete_by_id_for_user(self, dataset_id: str, user_id: str) -> DatasetDocument | None:
        document = await self.collection.find_one_and_delete(
            {"_id": _object_id(dataset_id), "user_id": _object_id(user_id)}
        )
        normalized = _normalize_document_id(document)
        return DatasetDocument.model_validate(normalized) if normalized else None
