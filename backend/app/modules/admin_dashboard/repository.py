from collections.abc import Mapping
from datetime import datetime
from typing import Any, Literal

from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

BucketCollection = Literal["users", "projects"]


def _created_between(start_utc: datetime, end_utc: datetime) -> dict[str, Any]:
    return {"created_at": {"$gte": start_utc, "$lt": end_utc}}


async def _sum_field(
    collection: AsyncIOMotorCollection,
    field_name: str,
    query: Mapping[str, Any],
) -> int:
    cursor = collection.aggregate(
        [
            {"$match": dict(query)},
            {"$group": {"_id": None, "total": {"$sum": {"$ifNull": [f"${field_name}", 0]}}}},
        ]
    )
    result = await cursor.to_list(length=1)
    return int(result[0]["total"]) if result else 0


async def _group_count(
    collection: AsyncIOMotorCollection,
    field_name: str,
    *,
    allowed_values: list[str],
    default_value: str,
) -> dict[str, int]:
    branches = [
        {"case": {"$eq": [f"${field_name}", value]}, "then": value}
        for value in allowed_values
    ]
    cursor = collection.aggregate(
        [
            {
                "$project": {
                    "group_key": {
                        "$switch": {
                            "branches": branches,
                            "default": default_value,
                        }
                    }
                }
            },
            {"$group": {"_id": "$group_key", "count": {"$sum": 1}}},
        ]
    )
    rows = await cursor.to_list(length=None)
    return {str(row["_id"]): int(row["count"]) for row in rows}


class AdminDashboardRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.users = database["users"]
        self.projects = database["projects"]
        self.files = database["files"]
        self.datasets = database["datasets"]
        self.analysis_runs = database["analysis_runs"]
        self.leads = database["leads"]
        self.notification_outbox = database["notification_outbox"]

    async def count_total_users(self) -> int:
        return await self.users.count_documents({})

    async def count_users_created_between(self, start_utc: datetime, end_utc: datetime) -> int:
        return await self.users.count_documents(_created_between(start_utc, end_utc))

    async def count_users_by_status(self, status: str) -> int:
        return await self.users.count_documents({"status": status})

    async def count_user_role_distribution(self) -> dict[str, int]:
        return await _group_count(
            self.users,
            "role",
            allowed_values=["admin", "customer"],
            default_value="customer",
        )

    async def count_total_projects(self) -> int:
        return await self.projects.count_documents({})

    async def count_projects_created_between(self, start_utc: datetime, end_utc: datetime) -> int:
        return await self.projects.count_documents(_created_between(start_utc, end_utc))

    async def count_project_status_distribution(self) -> dict[str, int]:
        return await _group_count(
            self.projects,
            "status",
            allowed_values=["draft", "active", "completed", "archived"],
            default_value="draft",
        )

    async def sum_storage_bytes(self) -> int:
        return await _sum_field(self.files, "size_bytes", {})

    async def sum_storage_bytes_created_between(
        self,
        start_utc: datetime,
        end_utc: datetime,
    ) -> int:
        return await _sum_field(self.files, "size_bytes", _created_between(start_utc, end_utc))

    async def count_files_created_between(self, start_utc: datetime, end_utc: datetime) -> int:
        return await self.files.count_documents(_created_between(start_utc, end_utc))

    async def count_analysis_runs_created_between(
        self,
        start_utc: datetime,
        end_utc: datetime,
        *,
        status: str | None = None,
        analysis_type: str | None = None,
    ) -> int:
        query: dict[str, Any] = _created_between(start_utc, end_utc)
        if status is not None:
            query["status"] = status
        if analysis_type is not None:
            query["analysis_type"] = analysis_type
        return await self.analysis_runs.count_documents(query)

    async def count_completed_analysis_runs_between(
        self,
        start_utc: datetime,
        end_utc: datetime,
    ) -> int:
        return await self.analysis_runs.count_documents(
            {
                "status": "completed",
                "$or": [
                    {"completed_at": {"$gte": start_utc, "$lt": end_utc}},
                    {
                        "completed_at": None,
                        "created_at": {"$gte": start_utc, "$lt": end_utc},
                    },
                ],
            }
        )

    async def count_new_leads(self) -> int:
        return await self.leads.count_documents({"status": "new"})

    async def count_pending_notifications(self) -> int:
        return await self.notification_outbox.count_documents({"status": "pending"})

    async def count_created_buckets(
        self,
        collection_name: BucketCollection,
        start_utc: datetime,
        end_utc: datetime,
        *,
        timezone: str,
        granularity: str,
    ) -> list[dict[str, Any]]:
        collection = self.users if collection_name == "users" else self.projects
        date_trunc: dict[str, Any] = {
            "date": "$created_at",
            "unit": granularity,
            "timezone": timezone,
        }
        if granularity == "week":
            date_trunc["startOfWeek"] = "monday"

        cursor = collection.aggregate(
            [
                {"$match": _created_between(start_utc, end_utc)},
                {"$group": {"_id": {"$dateTrunc": date_trunc}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}},
            ]
        )
        return await cursor.to_list(length=None)

    async def top_companies_by_storage(
        self,
        start_utc: datetime,
        end_utc: datetime,
        *,
        limit: int,
    ) -> list[dict[str, Any]]:
        cursor = self.files.aggregate(
            [
                {"$match": _created_between(start_utc, end_utc)},
                {
                    "$group": {
                        "_id": "$user_id",
                        "file_count": {"$sum": 1},
                        "storage_bytes": {"$sum": {"$ifNull": ["$size_bytes", 0]}},
                    }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "_id",
                        "foreignField": "_id",
                        "as": "user",
                    }
                },
                {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
                {
                    "$project": {
                        "file_count": 1,
                        "storage_bytes": 1,
                        "company_name": {
                            "$let": {
                                "vars": {
                                    "name": {
                                        "$trim": {
                                            "input": {"$ifNull": ["$user.company_name", ""]}
                                        }
                                    }
                                },
                                "in": {
                                    "$cond": [
                                        {"$gt": [{"$strLenCP": "$$name"}, 0]},
                                        "$$name",
                                        "Chưa cập nhật công ty",
                                    ]
                                },
                            }
                        },
                    }
                },
                {
                    "$group": {
                        "_id": "$company_name",
                        "file_count": {"$sum": "$file_count"},
                        "storage_bytes": {"$sum": "$storage_bytes"},
                    }
                },
                {"$sort": {"storage_bytes": -1, "file_count": -1, "_id": 1}},
                {"$limit": limit},
            ]
        )
        return await cursor.to_list(length=limit)

    async def list_recent_activity_documents(self, *, limit_each: int) -> dict[str, list[dict[str, Any]]]:
        users_cursor = self.users.find({}).sort("created_at", -1).limit(limit_each)
        projects_cursor = self.projects.find({}).sort("created_at", -1).limit(limit_each)
        files_cursor = self.files.find({}).sort("created_at", -1).limit(limit_each)
        analysis_cursor = (
            self.analysis_runs.find({"status": "completed"})
            .sort([("completed_at", -1), ("created_at", -1)])
            .limit(limit_each)
        )
        leads_cursor = self.leads.find({}).sort("created_at", -1).limit(limit_each)
        return {
            "users": await users_cursor.to_list(length=limit_each),
            "projects": await projects_cursor.to_list(length=limit_each),
            "files": await files_cursor.to_list(length=limit_each),
            "analysis_runs": await analysis_cursor.to_list(length=limit_each),
            "leads": await leads_cursor.to_list(length=limit_each),
        }
