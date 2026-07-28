import re
from collections.abc import Mapping
from datetime import datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.admin_files.schemas import (
    AdminDatasetStatusFilter,
    AdminFileExtension,
    AdminFileSortBy,
    AdminFileSortOrder,
)
from app.modules.files.enums import FileKind, FileStatus


UNKNOWN_COMPANY = "ChÆ°a cáº­p nháº­t cÃ´ng ty"


def _object_id_or_none(value: str | None) -> ObjectId | None:
    if not value or not ObjectId.is_valid(value):
        return None
    return ObjectId(value)


def _normalize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_normalize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _normalize_value(item) for key, item in value.items()}
    return value


def _normalize_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None
    normalized = _normalize_value(document)
    if "_id" in normalized:
        normalized["_id"] = str(normalized["_id"])
    return normalized


def _escaped_regex(value: str) -> dict[str, str]:
    return {"$regex": re.escape(value.strip()), "$options": "i"}


class AdminFilesRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.files = database["files"]
        self.datasets = database["datasets"]
        self.users = database["users"]
        self.projects = database["projects"]

    async def list_files(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        kind: FileKind | None = None,
        file_status: FileStatus | None = None,
        dataset_status: AdminDatasetStatusFilter | None = None,
        extension: AdminFileExtension | None = None,
        user_id: str | None = None,
        project_id: str | None = None,
        company: str | None = None,
        active: bool | None = None,
        latest_only: bool = False,
        date_from_utc: datetime | None = None,
        date_to_utc: datetime | None = None,
        sort_by: AdminFileSortBy = AdminFileSortBy.CREATED_AT,
        sort_order: AdminFileSortOrder = AdminFileSortOrder.DESC,
    ) -> tuple[list[dict[str, Any]], int]:
        pre_match = self._pre_match(
            kind=kind,
            file_status=file_status,
            extension=extension,
            user_id=user_id,
            project_id=project_id,
            date_from_utc=date_from_utc,
            date_to_utc=date_to_utc,
        )
        if pre_match is None:
            return [], 0

        post_match = self._post_match(
            search=search,
            dataset_status=dataset_status,
            company=company,
            active=active,
            latest_only=latest_only,
        )
        order = 1 if sort_order == AdminFileSortOrder.ASC else -1
        sort_field = sort_by.value
        pipeline: list[Mapping[str, Any]] = []
        if pre_match:
            pipeline.append({"$match": pre_match})
        pipeline.extend(self._file_enrichment_pipeline(include_analysis=True))
        if post_match:
            pipeline.append({"$match": post_match})
        pipeline.append(
            {
                "$facet": {
                    "items": [
                        {"$sort": {sort_field: order, "_id": order}},
                        {"$skip": (page - 1) * page_size},
                        {"$limit": page_size},
                    ],
                    "total": [{"$count": "count"}],
                }
            }
        )

        rows = await self.files.aggregate(pipeline).to_list(length=1)
        result = rows[0] if rows else {"items": [], "total": []}
        total_rows = result.get("total") or []
        total = int(total_rows[0]["count"]) if total_rows else 0
        items = [_normalize_document(item) for item in result.get("items", [])]
        return [item for item in items if item is not None], total

    async def get_file_detail(self, file_id: str) -> dict[str, Any] | None:
        object_id = _object_id_or_none(file_id)
        if object_id is None:
            return None
        pipeline: list[Mapping[str, Any]] = [{"$match": {"_id": object_id, "extension": {"$in": [AdminFileExtension.CSV.value, AdminFileExtension.XLSX.value]}}}]
        pipeline.extend(self._file_enrichment_pipeline(include_analysis=True))
        pipeline.extend(
            [
                {
                    "$lookup": {
                        "from": "files",
                        "let": {
                            "project_id": "$project_id",
                            "kind": "$kind",
                            "version": "$version",
                        },
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$and": [
                                            {"$eq": ["$project_id", "$$project_id"]},
                                            {"$eq": ["$kind", "$$kind"]},
                                            {"$lt": ["$version", "$$version"]},
                                        ]
                                    }
                                }
                            },
                            {"$sort": {"version": -1, "created_at": -1}},
                            {"$limit": 1},
                            {"$project": {"original_name": 1, "version": 1, "created_at": 1}},
                        ],
                        "as": "previous_version_docs",
                    }
                },
                {
                    "$lookup": {
                        "from": "files",
                        "let": {
                            "project_id": "$project_id",
                            "kind": "$kind",
                            "version": "$version",
                        },
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$and": [
                                            {"$eq": ["$project_id", "$$project_id"]},
                                            {"$eq": ["$kind", "$$kind"]},
                                            {"$gt": ["$version", "$$version"]},
                                        ]
                                    }
                                }
                            },
                            {"$sort": {"version": 1, "created_at": 1}},
                            {"$limit": 1},
                            {"$project": {"original_name": 1, "version": 1, "created_at": 1}},
                        ],
                        "as": "next_version_docs",
                    }
                },
                {
                    "$addFields": {
                        "previous_version_doc": {"$arrayElemAt": ["$previous_version_docs", 0]},
                        "next_version_doc": {"$arrayElemAt": ["$next_version_docs", 0]},
                    }
                },
            ]
        )
        rows = await self.files.aggregate(pipeline).to_list(length=1)
        return _normalize_document(rows[0]) if rows else None

    async def get_storage_document(self, file_id: str) -> dict[str, Any] | None:
        object_id = _object_id_or_none(file_id)
        if object_id is None:
            return None
        document = await self.files.find_one({"_id": object_id, "extension": {"$in": [AdminFileExtension.CSV.value, AdminFileExtension.XLSX.value]}})
        return _normalize_document(document)

    async def overview_totals(
        self,
        *,
        today_start_utc: datetime,
        today_end_utc: datetime,
    ) -> dict[str, int]:
        total_files = await self.files.count_documents({})
        ready_datasets = await self.datasets.count_documents({"status": "ready"})
        total_storage_rows = await self.files.aggregate(
            [{"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$size_bytes", 0]}}}}]
        ).to_list(length=1)
        uploads_today_rows = await self.files.aggregate(
            [
                {"$match": {"created_at": {"$gte": today_start_utc, "$lt": today_end_utc}}},
                {
                    "$group": {
                        "_id": None,
                        "count": {"$sum": 1},
                        "total_size_bytes": {"$sum": {"$ifNull": ["$size_bytes", 0]}},
                    }
                },
            ]
        ).to_list(length=1)
        quality = await self.quality_distribution()
        needs_attention = (
            quality.get("warning", 0)
            + quality.get("invalid", 0)
            + quality.get("missing", 0)
        )
        return {
            "total_files": total_files,
            "total_storage_bytes": int(total_storage_rows[0]["total"]) if total_storage_rows else 0,
            "uploads_today_count": int(uploads_today_rows[0]["count"]) if uploads_today_rows else 0,
            "uploads_today_size_bytes": int(uploads_today_rows[0]["total_size_bytes"]) if uploads_today_rows else 0,
            "ready_datasets": ready_datasets,
            "needs_attention": needs_attention,
        }

    async def recent_uploads(self, *, limit: int) -> list[dict[str, Any]]:
        pipeline: list[Mapping[str, Any]] = []
        pipeline.extend(self._file_enrichment_pipeline(include_analysis=False))
        pipeline.extend([{"$sort": {"created_at": -1, "_id": -1}}, {"$limit": limit}])
        rows = await self.files.aggregate(pipeline).to_list(length=limit)
        return [item for item in (_normalize_document(row) for row in rows) if item is not None]

    async def storage_by_company(self, *, limit: int) -> list[dict[str, Any]]:
        rows = await self.files.aggregate(
            [
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "user_id",
                        "foreignField": "_id",
                        "as": "owner_docs",
                    }
                },
                {"$unwind": {"path": "$owner_docs", "preserveNullAndEmptyArrays": True}},
                {
                    "$project": {
                        "company_name": {
                            "$ifNull": [
                                {
                                    "$cond": [
                                        {"$ne": ["$owner_docs.company_name", ""]},
                                        "$owner_docs.company_name",
                                        None,
                                    ]
                                },
                                UNKNOWN_COMPANY,
                            ]
                        },
                        "size_bytes": {"$ifNull": ["$size_bytes", 0]},
                    }
                },
                {
                    "$group": {
                        "_id": "$company_name",
                        "file_count": {"$sum": 1},
                        "storage_bytes": {"$sum": "$size_bytes"},
                    }
                },
                {"$sort": {"storage_bytes": -1, "file_count": -1, "_id": 1}},
                {"$limit": limit},
            ]
        ).to_list(length=limit)
        return [item for item in (_normalize_document(row) for row in rows) if item is not None]

    async def kind_distribution(self) -> dict[str, int]:
        rows = await self.files.aggregate(
            [
                {"$group": {"_id": {"$ifNull": ["$kind", "other"]}, "count": {"$sum": 1}}},
            ]
        ).to_list(length=None)
        return {str(row["_id"]): int(row["count"]) for row in rows}

    async def quality_distribution(self) -> dict[str, int]:
        rows = await self.files.aggregate(
            [
                {
                    "$lookup": {
                        "from": "datasets",
                        "localField": "_id",
                        "foreignField": "file_id",
                        "as": "dataset_docs",
                    }
                },
                {"$unwind": {"path": "$dataset_docs", "preserveNullAndEmptyArrays": True}},
                {
                    "$group": {
                        "_id": {"$ifNull": ["$dataset_docs.status", "missing"]},
                        "count": {"$sum": 1},
                    }
                },
            ]
        ).to_list(length=None)
        return {str(row["_id"]): int(row["count"]) for row in rows}

    def _pre_match(
        self,
        *,
        kind: FileKind | None,
        file_status: FileStatus | None,
        extension: AdminFileExtension | None,
        user_id: str | None,
        project_id: str | None,
        date_from_utc: datetime | None,
        date_to_utc: datetime | None,
    ) -> dict[str, Any] | None:
        query: dict[str, Any] = {}
        if kind is not None:
            query["kind"] = kind.value
        if file_status is not None:
            query["status"] = file_status.value
        if extension is not None:
            query["extension"] = extension.value
        else:
            query["extension"] = {"$in": [AdminFileExtension.CSV.value, AdminFileExtension.XLSX.value]}
        if user_id is not None:
            object_id = _object_id_or_none(user_id)
            if object_id is None:
                return None
            query["user_id"] = object_id
        if project_id is not None:
            object_id = _object_id_or_none(project_id)
            if object_id is None:
                return None
            query["project_id"] = object_id
        created_at: dict[str, datetime] = {}
        if date_from_utc is not None:
            created_at["$gte"] = date_from_utc
        if date_to_utc is not None:
            created_at["$lt"] = date_to_utc
        if created_at:
            query["created_at"] = created_at
        return query

    def _post_match(
        self,
        *,
        search: str | None,
        dataset_status: AdminDatasetStatusFilter | None,
        company: str | None,
        active: bool | None,
        latest_only: bool,
    ) -> dict[str, Any]:
        conditions: list[dict[str, Any]] = []
        if search:
            regex = _escaped_regex(search)
            conditions.append(
                {
                    "$or": [
                        {"original_name": regex},
                        {"sha256": regex},
                        {"project_doc.name": regex},
                        {"owner_doc.representative_name": regex},
                        {"owner_doc.email": regex},
                        {"owner_doc.company_name": regex},
                    ]
                }
            )
        if company:
            conditions.append({"owner_doc.company_name": _escaped_regex(company)})
        if dataset_status is not None:
            conditions.append({"dataset_status_key": dataset_status.value})
        if active is not None:
            conditions.append({"is_active": active})
        if latest_only:
            conditions.append({"is_latest_version": True})
        if not conditions:
            return {}
        if len(conditions) == 1:
            return conditions[0]
        return {"$and": conditions}

    @staticmethod
    def _file_enrichment_pipeline(*, include_analysis: bool) -> list[Mapping[str, Any]]:
        pipeline: list[Mapping[str, Any]] = [
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "owner_docs",
                }
            },
            {"$unwind": {"path": "$owner_docs", "preserveNullAndEmptyArrays": True}},
            {"$addFields": {"owner_doc": "$owner_docs"}},
            {
                "$lookup": {
                    "from": "projects",
                    "localField": "project_id",
                    "foreignField": "_id",
                    "as": "project_docs",
                }
            },
            {"$unwind": {"path": "$project_docs", "preserveNullAndEmptyArrays": True}},
            {"$addFields": {"project_doc": "$project_docs"}},
            {
                "$lookup": {
                    "from": "datasets",
                    "localField": "_id",
                    "foreignField": "file_id",
                    "as": "dataset_docs",
                }
            },
            {"$unwind": {"path": "$dataset_docs", "preserveNullAndEmptyArrays": True}},
            {"$addFields": {"dataset_doc": "$dataset_docs"}},
            {
                "$lookup": {
                    "from": "files",
                    "let": {"project_id": "$project_id", "kind": "$kind"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        {"$eq": ["$project_id", "$$project_id"]},
                                        {"$eq": ["$kind", "$$kind"]},
                                    ]
                                }
                            }
                        },
                        {"$group": {"_id": None, "max_version": {"$max": "$version"}}},
                    ],
                    "as": "latest_docs",
                }
            },
            {
                "$addFields": {
                    "latest_version": {
                        "$ifNull": [
                            {"$arrayElemAt": ["$latest_docs.max_version", 0]},
                            "$version",
                        ]
                    },
                    "dataset_status_key": {"$ifNull": ["$dataset_doc.status", "missing"]},
                    "dataset_id_string": {
                        "$cond": [
                            {"$ifNull": ["$dataset_doc._id", False]},
                            {"$toString": "$dataset_doc._id"},
                            None,
                        ]
                    },
                    "file_id_string": {"$toString": "$_id"},
                    "active_load_dataset_id_string": {
                        "$cond": [
                            {"$ifNull": ["$project_doc.active_load_dataset_id", False]},
                            {"$toString": "$project_doc.active_load_dataset_id"},
                            None,
                        ]
                    },
                    "active_pv_dataset_id_string": {
                        "$cond": [
                            {"$ifNull": ["$project_doc.active_pv_dataset_id", False]},
                            {"$toString": "$project_doc.active_pv_dataset_id"},
                            None,
                        ]
                    },
                }
            },
            {
                "$addFields": {
                    "is_active": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {
                                        "$and": [
                                            {"$eq": ["$kind", "load_profile"]},
                                            {"$ne": ["$dataset_id_string", None]},
                                            {"$eq": ["$dataset_id_string", "$active_load_dataset_id_string"]},
                                        ]
                                    },
                                    "then": True,
                                },
                                {
                                    "case": {
                                        "$and": [
                                            {"$eq": ["$kind", "pv_profile"]},
                                            {"$ne": ["$dataset_id_string", None]},
                                            {"$eq": ["$dataset_id_string", "$active_pv_dataset_id_string"]},
                                        ]
                                    },
                                    "then": True,
                                },
                            ],
                            "default": False,
                        }
                    },
                    "is_latest_version": {"$eq": ["$version", "$latest_version"]},
                }
            },
        ]
        if include_analysis:
            pipeline.extend(
                [
                    {
                        "$lookup": {
                            "from": "analysis_runs",
                            "let": {
                                "file_id": "$file_id_string",
                                "dataset_id": "$dataset_id_string",
                            },
                            "pipeline": [
                                {
                                    "$match": {
                                        "$expr": {
                                            "$or": [
                                                {
                                                    "$eq": [
                                                        "$input_snapshot.active_datasets.load_profile.file_id",
                                                        "$$file_id",
                                                    ]
                                                },
                                                {
                                                    "$eq": [
                                                        "$input_snapshot.active_datasets.pv_profile.file_id",
                                                        "$$file_id",
                                                    ]
                                                },
                                                {
                                                    "$eq": [
                                                        "$input_snapshot.files.load_profile.file_id",
                                                        "$$file_id",
                                                    ]
                                                },
                                                {
                                                    "$eq": [
                                                        "$input_snapshot.files.pv_profile.file_id",
                                                        "$$file_id",
                                                    ]
                                                },
                                                {
                                                    "$and": [
                                                        {"$ne": ["$$dataset_id", None]},
                                                        {
                                                            "$eq": [
                                                                "$input_snapshot.active_datasets.load_profile.dataset_id",
                                                                "$$dataset_id",
                                                            ]
                                                        },
                                                    ]
                                                },
                                                {
                                                    "$and": [
                                                        {"$ne": ["$$dataset_id", None]},
                                                        {
                                                            "$eq": [
                                                                "$input_snapshot.active_datasets.pv_profile.dataset_id",
                                                                "$$dataset_id",
                                                            ]
                                                        },
                                                    ]
                                                },
                                                {
                                                    "$and": [
                                                        {"$ne": ["$$dataset_id", None]},
                                                        {
                                                            "$in": [
                                                                "$$dataset_id",
                                                                {"$ifNull": ["$input_snapshot.dataset_ids", []]},
                                                            ]
                                                        },
                                                    ]
                                                },
                                            ]
                                        }
                                    }
                                },
                                {"$count": "count"},
                            ],
                            "as": "analysis_ref_docs",
                        }
                    },
                    {
                        "$addFields": {
                            "analysis_reference_count": {
                                "$ifNull": [
                                    {"$arrayElemAt": ["$analysis_ref_docs.count", 0]},
                                    0,
                                ]
                            }
                        }
                    },
                ]
            )
        else:
            pipeline.append({"$addFields": {"analysis_reference_count": 0}})
        return pipeline





