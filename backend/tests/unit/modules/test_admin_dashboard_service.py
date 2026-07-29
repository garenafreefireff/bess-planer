from datetime import UTC, date, datetime, timedelta, timezone as datetime_timezone
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import pytest
from fastapi import HTTPException

from app.core.exceptions import AppError
from app.dependencies.authentication import CurrentUser, get_admin_user
from app.modules.admin_dashboard.router import get_admin_dashboard_overview
from app.modules.admin_dashboard.service import AdminDashboardService


def utc(year: int, month: int, day: int, hour: int = 0) -> datetime:
    return datetime(year, month, day, hour, tzinfo=UTC)


class FakeAdminDashboardRepository:
    def __init__(self) -> None:
        self.users: list[dict[str, Any]] = []
        self.projects: list[dict[str, Any]] = []
        self.files: list[dict[str, Any]] = []
        self.analysis_runs: list[dict[str, Any]] = []
        self.leads: list[dict[str, Any]] = []
        self.notifications: list[dict[str, Any]] = []

    async def count_total_users(self) -> int:
        return len(self.users)

    async def count_users_created_between(self, start_utc: datetime, end_utc: datetime) -> int:
        return count_between(self.users, start_utc, end_utc)

    async def count_users_by_status(self, status: str) -> int:
        return len([user for user in self.users if user.get("status") == status])

    async def count_user_role_distribution(self) -> dict[str, int]:
        result = {"admin": 0, "customer": 0}
        for user in self.users:
            role = "admin" if user.get("role") == "admin" else "customer"
            result[role] += 1
        return result

    async def count_total_projects(self) -> int:
        return len(self.projects)

    async def count_projects_created_between(self, start_utc: datetime, end_utc: datetime) -> int:
        return count_between(self.projects, start_utc, end_utc)

    async def count_project_status_distribution(self) -> dict[str, int]:
        result = {"active": 0, "archived": 0, "completed": 0, "draft": 0}
        for project in self.projects:
            status = str(project.get("status") or "draft")
            result[status if status in result else "draft"] += 1
        return result

    async def sum_storage_bytes(self) -> int:
        return sum(int(file.get("size_bytes") or 0) for file in self.files)

    async def sum_storage_bytes_created_between(self, start_utc: datetime, end_utc: datetime) -> int:
        return sum(
            int(file.get("size_bytes") or 0)
            for file in self.files
            if in_range(file.get("created_at"), start_utc, end_utc)
        )

    async def count_files_created_between(self, start_utc: datetime, end_utc: datetime) -> int:
        return count_between(self.files, start_utc, end_utc)

    async def count_analysis_runs_created_between(
        self,
        start_utc: datetime,
        end_utc: datetime,
        *,
        status: str | None = None,
        analysis_type: str | None = None,
    ) -> int:
        rows = [
            row
            for row in self.analysis_runs
            if in_range(row.get("created_at"), start_utc, end_utc)
        ]
        if status is not None:
            rows = [row for row in rows if row.get("status") == status]
        if analysis_type is not None:
            rows = [row for row in rows if row.get("analysis_type") == analysis_type]
        return len(rows)

    async def count_completed_analysis_runs_between(
        self,
        start_utc: datetime,
        end_utc: datetime,
    ) -> int:
        return len(
            [
                row
                for row in self.analysis_runs
                if row.get("status") == "completed"
                and in_range(row.get("completed_at") or row.get("created_at"), start_utc, end_utc)
            ]
        )

    async def count_new_leads(self) -> int:
        return len([lead for lead in self.leads if lead.get("status") == "new"])

    async def count_pending_notifications(self) -> int:
        return len([item for item in self.notifications if item.get("status") == "pending"])

    async def count_created_buckets(
        self,
        collection_name: str,
        start_utc: datetime,
        end_utc: datetime,
        *,
        timezone: str,
        granularity: str,
    ) -> list[dict[str, Any]]:
        zone = resolve_timezone(timezone)
        rows = self.users if collection_name == "users" else self.projects
        buckets: dict[datetime, int] = {}
        for row in rows:
            created_at = row.get("created_at")
            if not in_range(created_at, start_utc, end_utc):
                continue
            local = created_at.astimezone(zone)
            if granularity == "month":
                bucket = local.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            elif granularity == "week":
                bucket_date = local.date() - timedelta(days=local.weekday())
                bucket = datetime.combine(bucket_date, datetime.min.time(), tzinfo=zone)
            else:
                bucket = local.replace(hour=0, minute=0, second=0, microsecond=0)
            buckets[bucket.astimezone(UTC)] = buckets.get(bucket.astimezone(UTC), 0) + 1
        return [{"_id": key, "count": value} for key, value in buckets.items()]

    async def top_companies_by_storage(
        self,
        start_utc: datetime,
        end_utc: datetime,
        *,
        limit: int,
    ) -> list[dict[str, Any]]:
        company_by_user = {
            user["_id"]: user.get("company_name") or "Chưa cập nhật công ty"
            for user in self.users
        }
        grouped: dict[str, dict[str, Any]] = {}
        for file in self.files:
            if not in_range(file.get("created_at"), start_utc, end_utc):
                continue
            company = company_by_user.get(file.get("user_id"), "Chưa cập nhật công ty")
            grouped.setdefault(company, {"_id": company, "file_count": 0, "storage_bytes": 0})
            grouped[company]["file_count"] += 1
            grouped[company]["storage_bytes"] += int(file.get("size_bytes") or 0)
        return sorted(
            grouped.values(),
            key=lambda item: (-int(item["storage_bytes"]), -int(item["file_count"]), str(item["_id"])),
        )[:limit]

    async def list_recent_activity_documents(self, *, limit_each: int) -> dict[str, list[dict[str, Any]]]:
        return {
            "analysis_runs": sorted(
                [row for row in self.analysis_runs if row.get("status") == "completed"],
                key=lambda row: row.get("completed_at") or row.get("created_at"),
                reverse=True,
            )[:limit_each],
            "files": sorted(self.files, key=lambda row: row["created_at"], reverse=True)[:limit_each],
            "leads": sorted(self.leads, key=lambda row: row["created_at"], reverse=True)[:limit_each],
            "projects": sorted(self.projects, key=lambda row: row["created_at"], reverse=True)[:limit_each],
            "users": sorted(self.users, key=lambda row: row["created_at"], reverse=True)[:limit_each],
        }


def in_range(value: object, start_utc: datetime, end_utc: datetime) -> bool:
    return isinstance(value, datetime) and start_utc <= value < end_utc


def count_between(rows: list[dict[str, Any]], start_utc: datetime, end_utc: datetime) -> int:
    return len([row for row in rows if in_range(row.get("created_at"), start_utc, end_utc)])


def resolve_timezone(timezone: str):
    try:
        return ZoneInfo(timezone)
    except ZoneInfoNotFoundError:
        if timezone == "Asia/Ho_Chi_Minh":
            return datetime_timezone(timedelta(hours=7), timezone)
        raise


def seeded_repository() -> FakeAdminDashboardRepository:
    repo = FakeAdminDashboardRepository()
    repo.users = [
        {"_id": "u-admin", "role": "admin", "status": "active", "company_name": "DataInsight", "created_at": utc(2026, 7, 2)},
        {"_id": "u-a", "role": "customer", "status": "active", "company_name": "Alpha", "created_at": utc(2026, 7, 3)},
        {"_id": "u-b", "role": "customer", "status": "suspended", "company_name": "", "created_at": utc(2026, 6, 29)},
    ]
    repo.projects = [
        {"_id": "p-a", "name": "Project A", "project_type": "quick_sizing", "status": "draft", "created_at": utc(2026, 7, 3)},
        {"_id": "p-b", "name": "Project B", "project_type": "bess_planning", "status": "active", "created_at": utc(2026, 7, 5)},
        {"_id": "p-c", "name": "Project C", "project_type": "bess_planning", "status": "completed", "created_at": utc(2026, 6, 28)},
    ]
    repo.files = [
        {"_id": "f-a", "user_id": "u-a", "kind": "load_profile", "version": 2, "size_bytes": 100, "created_at": utc(2026, 7, 3)},
        {"_id": "f-b", "user_id": "u-b", "kind": "pv_profile", "version": 1, "size_bytes": 300, "created_at": utc(2026, 7, 4)},
        {"_id": "f-c", "user_id": "u-a", "kind": "other", "version": 1, "size_bytes": 50, "created_at": utc(2026, 6, 29)},
    ]
    repo.analysis_runs = [
        {"_id": "a-a", "analysis_type": "quick_sizing", "status": "completed", "engine_version": "qs-v1", "created_at": utc(2026, 7, 3), "completed_at": utc(2026, 7, 3, 1)},
        {"_id": "a-b", "analysis_type": "bess_planning", "status": "running", "engine_version": "sl-v1", "created_at": utc(2026, 7, 4)},
        {"_id": "a-c", "analysis_type": "bess_planning", "status": "completed", "engine_version": "sl-v1", "created_at": utc(2026, 6, 30), "completed_at": utc(2026, 6, 30, 1)},
    ]
    repo.leads = [
        {"_id": "l-a", "status": "new", "sources": ["quick_sizing"], "company_name": "Lead Co", "created_at": utc(2026, 7, 6)},
        {"_id": "l-b", "status": "contacted", "sources": ["contact_form"], "company_name": "Old Co", "created_at": utc(2026, 7, 1)},
    ]
    repo.notifications = [
        {"_id": "n-a", "status": "pending", "created_at": utc(2026, 7, 6)},
        {"_id": "n-b", "status": "sent", "created_at": utc(2026, 7, 6)},
    ]
    return repo


async def build_overview(
    repo: FakeAdminDashboardRepository,
    *,
    date_from: date = date(2026, 7, 1),
    date_to: date = date(2026, 7, 7),
    timezone: str = "Asia/Ho_Chi_Minh",
    granularity: str = "day",
):
    service = AdminDashboardService(repo)  # type: ignore[arg-type]
    return await service.get_overview(
        date_from=date_from,
        date_to=date_to,
        timezone=timezone,
        granularity=granularity,  # type: ignore[arg-type]
    )


@pytest.mark.asyncio
async def test_empty_database_returns_zero_metrics_without_nan() -> None:
    overview = await build_overview(FakeAdminDashboardRepository())

    assert overview.metrics.total_users.value == 0
    assert overview.metrics.storage_bytes.delta.value_pct == 0
    assert overview.metrics.analysis_runs.delta.direction == "neutral"
    assert all(item.percentage == 0 for item in overview.user_role_distribution)


@pytest.mark.asyncio
async def test_total_users_and_account_status_are_real_counts() -> None:
    overview = await build_overview(seeded_repository())

    assert overview.metrics.total_users.value == 3
    assert overview.metrics.active_accounts.value == 2
    assert overview.metrics.active_accounts.secondary_value == 1


@pytest.mark.asyncio
async def test_user_role_distribution_uses_only_admin_and_customer() -> None:
    overview = await build_overview(seeded_repository())

    assert [item.key for item in overview.user_role_distribution] == ["admin", "customer"]
    assert sum(item.count for item in overview.user_role_distribution) == 3


@pytest.mark.asyncio
async def test_project_totals_and_status_distribution_are_real_counts() -> None:
    overview = await build_overview(seeded_repository())

    assert overview.metrics.total_projects.value == 3
    assert [item.key for item in overview.project_status_distribution] == ["draft", "active", "completed", "archived"]
    assert sum(item.count for item in overview.project_status_distribution) == 3


@pytest.mark.asyncio
async def test_storage_bytes_total_period_and_previous_period() -> None:
    overview = await build_overview(seeded_repository())

    assert overview.metrics.storage_bytes.value == 450
    assert overview.metrics.storage_bytes.period_value == 400
    assert overview.metrics.storage_bytes.previous_period_value == 50


@pytest.mark.asyncio
async def test_analysis_run_kpi_uses_current_period_and_breakdown() -> None:
    overview = await build_overview(seeded_repository())

    assert overview.metrics.analysis_runs.value == 2
    assert overview.metrics.analysis_runs.completed == 1
    assert overview.metrics.analysis_runs.quick_sizing == 1
    assert overview.metrics.analysis_runs.bess_planner == 1


@pytest.mark.asyncio
async def test_growth_series_includes_empty_buckets() -> None:
    overview = await build_overview(seeded_repository(), date_from=date(2026, 7, 1), date_to=date(2026, 7, 5))

    assert len(overview.growth_series) == 5
    assert any(bucket.new_users == 0 and bucket.new_projects == 0 for bucket in overview.growth_series)


@pytest.mark.asyncio
async def test_top_company_storage_groups_missing_company_fallback() -> None:
    overview = await build_overview(seeded_repository())

    assert overview.top_companies_by_storage[0].company_name == "Chưa cập nhật công ty"
    assert overview.top_companies_by_storage[0].storage_bytes == 300


@pytest.mark.asyncio
async def test_recent_activity_is_sorted_descending_and_has_no_actor() -> None:
    overview = await build_overview(seeded_repository())

    occurred = [item.occurred_at for item in overview.recent_activity]
    assert occurred == sorted(occurred, reverse=True)
    assert all(item.actor_label is None for item in overview.recent_activity)


@pytest.mark.asyncio
async def test_quick_status_today_uses_timezone_boundaries(monkeypatch: pytest.MonkeyPatch) -> None:
    repo = seeded_repository()
    repo.files.append({"_id": "f-today", "user_id": "u-a", "kind": "other", "version": 1, "size_bytes": 256, "created_at": utc(2026, 7, 28, 3)})
    repo.analysis_runs.append({"_id": "a-today", "analysis_type": "quick_sizing", "status": "completed", "engine_version": "qs-v1", "created_at": utc(2026, 7, 28, 2), "completed_at": utc(2026, 7, 28, 3)})
    monkeypatch.setattr("app.modules.admin_dashboard.service.utc_now", lambda: utc(2026, 7, 28, 5))

    overview = await build_overview(repo, date_from=date(2026, 7, 1), date_to=date(2026, 7, 28))

    assert overview.quick_status.file_uploads_today.count == 1
    assert overview.quick_status.file_uploads_today.total_size_bytes == 256
    assert overview.quick_status.analyses_completed_today.count == 1
    assert overview.quick_status.new_leads.count == 1
    assert overview.quick_status.pending_emails.count == 1


@pytest.mark.asyncio
async def test_date_from_after_date_to_is_rejected() -> None:
    with pytest.raises(AppError, match="date_from"):
        await build_overview(FakeAdminDashboardRepository(), date_from=date(2026, 7, 2), date_to=date(2026, 7, 1))


@pytest.mark.asyncio
async def test_range_over_366_days_is_rejected() -> None:
    with pytest.raises(AppError, match="366"):
        await build_overview(FakeAdminDashboardRepository(), date_from=date(2025, 1, 1), date_to=date(2026, 1, 2))


@pytest.mark.asyncio
async def test_invalid_timezone_is_rejected() -> None:
    with pytest.raises(AppError, match="Timezone"):
        await build_overview(FakeAdminDashboardRepository(), timezone="Invalid/Zone")


@pytest.mark.asyncio
async def test_previous_period_zero_with_current_positive_returns_new_delta() -> None:
    overview = await build_overview(seeded_repository(), date_from=date(2026, 7, 3), date_to=date(2026, 7, 4))

    assert overview.metrics.storage_bytes.previous_period_value == 0
    assert overview.metrics.storage_bytes.delta.value_pct is None
    assert overview.metrics.storage_bytes.delta.direction == "new"


@pytest.mark.asyncio
async def test_delta_normal_percentage_is_finite() -> None:
    overview = await build_overview(seeded_repository())

    assert overview.metrics.storage_bytes.delta.value_pct == 700
    assert overview.metrics.storage_bytes.delta.direction == "up"


@pytest.mark.asyncio
async def test_default_date_range_is_current_month(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.modules.admin_dashboard.service.utc_now", lambda: utc(2026, 7, 28, 5))
    service = AdminDashboardService(FakeAdminDashboardRepository())  # type: ignore[arg-type]

    overview = await service.get_overview(
        date_from=None,
        date_to=None,
        timezone="Asia/Ho_Chi_Minh",
        granularity="day",
    )

    assert overview.period.date_from == date(2026, 7, 1)
    assert overview.period.date_to == date(2026, 7, 28)


@pytest.mark.asyncio
async def test_week_granularity_returns_week_buckets() -> None:
    overview = await build_overview(seeded_repository(), granularity="week")

    assert overview.period.granularity == "week"
    assert overview.growth_series[0].label.startswith("Tuần")


@pytest.mark.asyncio
async def test_month_granularity_returns_month_buckets() -> None:
    overview = await build_overview(seeded_repository(), granularity="month")

    assert overview.period.granularity == "month"
    assert overview.growth_series[0].label.startswith("Tháng")


@pytest.mark.asyncio
async def test_capabilities_do_not_claim_unavailable_features() -> None:
    overview = await build_overview(seeded_repository())

    assert overview.capabilities.billing_available is False
    assert overview.capabilities.audit_log_available is False
    assert overview.capabilities.active_user_tracking_available is False
    assert overview.capabilities.analysis_failure_tracking_available is False


@pytest.mark.asyncio
async def test_non_admin_dashboard_dependency_receives_403() -> None:
    user = CurrentUser(
        id="u-customer",
        email="customer@example.com",
        representative_name="Customer",
        role="customer",
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_admin_user(user)

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_dashboard_handler_returns_overview() -> None:
    admin_user = CurrentUser(
        id="u-admin",
        email="admin@example.com",
        representative_name="Admin",
        role="admin",
    )
    service = AdminDashboardService(FakeAdminDashboardRepository())  # type: ignore[arg-type]

    response = await get_admin_dashboard_overview(
        admin_user=admin_user,
        dashboard_service=service,
    )

    assert response.metrics.total_users.value == 0
