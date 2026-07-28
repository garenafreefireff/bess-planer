from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.analysis_run import AnalysisRunDocument
from app.modules.analyses.enums import AnalysisType

REFERENCE_FIELDS = {"user_id", "project_id", "bess_catalog_id"}


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


def _analysis_run_to_mongo(analysis_run: AnalysisRunDocument) -> dict[str, Any]:
    payload = analysis_run.model_dump(by_alias=True, exclude={"id"})
    return _references_to_object_ids(payload)


def _references_to_object_ids(payload: dict[str, Any]) -> dict[str, Any]:
    converted = dict(payload)
    for field in REFERENCE_FIELDS:
        if field in converted and converted[field] is not None:
            converted[field] = _object_id(converted[field])
    return converted


class AnalysisRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["analysis_runs"]

    async def create_analysis_run(
        self,
        analysis_run: AnalysisRunDocument,
    ) -> AnalysisRunDocument:
        payload = _analysis_run_to_mongo(analysis_run)
        result = await self.collection.insert_one(payload)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return AnalysisRunDocument.model_validate(_normalize_document_id(created))

    async def count_by_user(
        self,
        user_id: str,
        analysis_type: AnalysisType | None = None,
    ) -> int:
        query: dict[str, Any] = {"user_id": _object_id(user_id)}
        if analysis_type is not None:
            query["analysis_type"] = analysis_type.value
        return await self.collection.count_documents(query)

    async def list_by_user(
        self,
        user_id: str,
        *,
        skip: int,
        limit: int,
        analysis_type: AnalysisType | None = None,
    ) -> list[AnalysisRunDocument]:
        query: dict[str, Any] = {"user_id": _object_id(user_id)}
        if analysis_type is not None:
            query["analysis_type"] = analysis_type.value
        cursor = (
            self.collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [
            AnalysisRunDocument.model_validate(_normalize_document_id(document))
            for document in documents
        ]

    async def get_by_id_for_user(
        self,
        analysis_run_id: str,
        user_id: str,
    ) -> AnalysisRunDocument | None:
        document = await self.collection.find_one(
            {
                "_id": _object_id(analysis_run_id),
                "user_id": _object_id(user_id),
            }
        )
        normalized = _normalize_document_id(document)
        return AnalysisRunDocument.model_validate(normalized) if normalized else None

    async def count_references_dataset_for_user(self, dataset_id: str, user_id: str) -> int:
        return await self.collection.count_documents(
            {
                "user_id": _object_id(user_id),
                "$or": [
                    {"input_snapshot.dataset_ids": dataset_id},
                    {"input_snapshot.active_datasets.load_profile.dataset_id": dataset_id},
                    {"input_snapshot.active_datasets.pv_profile.dataset_id": dataset_id},
                ],
            }
        )

    async def count_references_file_for_user(self, file_id: str, user_id: str) -> int:
        return await self.collection.count_documents(
            {
                "user_id": _object_id(user_id),
                "$or": [
                    {"input_snapshot.active_datasets.load_profile.file_id": file_id},
                    {"input_snapshot.active_datasets.pv_profile.file_id": file_id},
                    {"input_snapshot.files.load_profile.file_id": file_id},
                    {"input_snapshot.files.pv_profile.file_id": file_id},
                ],
            }
        )
