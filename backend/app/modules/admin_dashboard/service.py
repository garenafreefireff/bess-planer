import asyncio
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta, timezone as datetime_timezone, tzinfo
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.core.exceptions import AppError
from app.core.security import utc_now
from app.modules.admin_dashboard.repository import AdminDashboardRepository
from app.modules.admin_dashboard.schemas import (
    ActiveAccountsMetric,
    AdminDashboardOverviewResponse,
    AnalysisRunsMetric,
    CountStatus,
    CreatedCountMetric,
    DashboardCapabilities,
    DashboardDelta,
    DashboardGranularity,
    DashboardMetrics,
    DashboardPeriod,
    DashboardQuickStatus,
    DistributionItem,
    FileUploadsTodayStatus,
    GrowthBucket,
    RecentActivityItem,
    StorageMetric,
    TopCompanyStorageItem,
)

DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh"
MAX_RANGE_DAYS = 366


@dataclass(frozen=True)
class DashboardWindow:
    date_from: date
    date_to: date
    timezone_name: str
    zone: tzinfo
    granularity: DashboardGranularity
    start_utc: datetime
    end_utc: datetime
    previous_start_utc: datetime
    previous_end_utc: datetime
    today_start_utc: datetime
    today_end_utc: datetime


class AdminDashboardService:
    def __init__(self, repository: AdminDashboardRepository) -> None:
        self.repository = repository

    async def get_overview(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        timezone: str,
        granularity: DashboardGranularity,
    ) -> AdminDashboardOverviewResponse:
        window = self._build_window(
            date_from=date_from,
            date_to=date_to,
            timezone_name=timezone,
            granularity=granularity,
        )

        (
            total_users,
            period_users,
            previous_users,
            active_users,
            suspended_users,
            role_counts,
            total_projects,
            period_projects,
            previous_projects,
            project_status_counts,
            total_storage,
            period_storage,
            previous_storage,
            period_analysis_runs,
            previous_analysis_runs,
            completed_analysis_runs,
            quick_sizing_runs,
            bess_planner_runs,
            user_buckets,
            project_buckets,
            top_companies_rows,
            recent_documents,
            today_file_count,
            today_file_storage,
            today_completed_analysis,
            new_leads,
            pending_notifications,
        ) = await asyncio.gather(
            self.repository.count_total_users(),
            self.repository.count_users_created_between(window.start_utc, window.end_utc),
            self.repository.count_users_created_between(
                window.previous_start_utc,
                window.previous_end_utc,
            ),
            self.repository.count_users_by_status("active"),
            self.repository.count_users_by_status("suspended"),
            self.repository.count_user_role_distribution(),
            self.repository.count_total_projects(),
            self.repository.count_projects_created_between(window.start_utc, window.end_utc),
            self.repository.count_projects_created_between(
                window.previous_start_utc,
                window.previous_end_utc,
            ),
            self.repository.count_project_status_distribution(),
            self.repository.sum_storage_bytes(),
            self.repository.sum_storage_bytes_created_between(window.start_utc, window.end_utc),
            self.repository.sum_storage_bytes_created_between(
                window.previous_start_utc,
                window.previous_end_utc,
            ),
            self.repository.count_analysis_runs_created_between(window.start_utc, window.end_utc),
            self.repository.count_analysis_runs_created_between(
                window.previous_start_utc,
                window.previous_end_utc,
            ),
            self.repository.count_analysis_runs_created_between(
                window.start_utc,
                window.end_utc,
                status="completed",
            ),
            self.repository.count_analysis_runs_created_between(
                window.start_utc,
                window.end_utc,
                analysis_type="quick_sizing",
            ),
            self.repository.count_analysis_runs_created_between(
                window.start_utc,
                window.end_utc,
                analysis_type="bess_planning",
            ),
            self.repository.count_created_buckets(
                "users",
                window.start_utc,
                window.end_utc,
                timezone=window.timezone_name,
                granularity=window.granularity,
            ),
            self.repository.count_created_buckets(
                "projects",
                window.start_utc,
                window.end_utc,
                timezone=window.timezone_name,
                granularity=window.granularity,
            ),
            self.repository.top_companies_by_storage(
                window.start_utc,
                window.end_utc,
                limit=5,
            ),
            self.repository.list_recent_activity_documents(limit_each=10),
            self.repository.count_files_created_between(window.today_start_utc, window.today_end_utc),
            self.repository.sum_storage_bytes_created_between(
                window.today_start_utc,
                window.today_end_utc,
            ),
            self.repository.count_completed_analysis_runs_between(
                window.today_start_utc,
                window.today_end_utc,
            ),
            self.repository.count_new_leads(),
            self.repository.count_pending_notifications(),
        )

        return AdminDashboardOverviewResponse(
            generated_at=utc_now(),
            period=DashboardPeriod(
                date_from=window.date_from,
                date_to=window.date_to,
                timezone=window.timezone_name,
                granularity=window.granularity,
            ),
            metrics=DashboardMetrics(
                total_users=CreatedCountMetric(
                    value=total_users,
                    period_value=period_users,
                    previous_period_value=previous_users,
                    delta=_calculate_delta(period_users, previous_users),
                ),
                active_accounts=ActiveAccountsMetric(
                    value=active_users,
                    secondary_value=suspended_users,
                    secondary_label="Tài khoản bị khóa",
                ),
                total_projects=CreatedCountMetric(
                    value=total_projects,
                    period_value=period_projects,
                    previous_period_value=previous_projects,
                    delta=_calculate_delta(period_projects, previous_projects),
                ),
                storage_bytes=StorageMetric(
                    value=total_storage,
                    period_value=period_storage,
                    previous_period_value=previous_storage,
                    delta=_calculate_delta(period_storage, previous_storage),
                ),
                analysis_runs=AnalysisRunsMetric(
                    value=period_analysis_runs,
                    period_value=period_analysis_runs,
                    previous_period_value=previous_analysis_runs,
                    delta=_calculate_delta(period_analysis_runs, previous_analysis_runs),
                    completed=completed_analysis_runs,
                    quick_sizing=quick_sizing_runs,
                    bess_planner=bess_planner_runs,
                ),
            ),
            growth_series=_build_growth_series(
                window,
                user_buckets=user_buckets,
                project_buckets=project_buckets,
            ),
            user_role_distribution=_build_distribution(
                role_counts,
                total_users,
                labels=[("admin", "Admin"), ("customer", "Customer")],
            ),
            project_status_distribution=_build_distribution(
                project_status_counts,
                total_projects,
                labels=[
                    ("draft", "Bản nháp"),
                    ("active", "Đang hoạt động"),
                    ("completed", "Hoàn thành"),
                    ("archived", "Đã lưu trữ"),
                ],
            ),
            top_companies_by_storage=_build_top_companies(
                top_companies_rows,
                total_storage_bytes=period_storage,
            ),
            recent_activity=_build_recent_activity(recent_documents),
            quick_status=DashboardQuickStatus(
                file_uploads_today=FileUploadsTodayStatus(
                    count=today_file_count,
                    total_size_bytes=today_file_storage,
                ),
                analyses_completed_today=CountStatus(
                    count=today_completed_analysis,
                    detail="status completed",
                ),
                new_leads=CountStatus(count=new_leads, detail="Chưa xử lý"),
                pending_emails=CountStatus(count=pending_notifications, detail="pending"),
            ),
            capabilities=DashboardCapabilities(),
        )

    def _build_window(
        self,
        *,
        date_from: date | None,
        date_to: date | None,
        timezone_name: str,
        granularity: DashboardGranularity,
    ) -> DashboardWindow:
        zone = _validate_timezone(timezone_name)
        now_local = utc_now().astimezone(zone)
        effective_date_to = date_to or now_local.date()
        effective_date_from = date_from or effective_date_to.replace(day=1)
        if effective_date_from > effective_date_to:
            raise AppError(
                "date_from không được lớn hơn date_to.",
                code="invalid_date_range",
            )
        range_days = (effective_date_to - effective_date_from).days + 1
        if range_days > MAX_RANGE_DAYS:
            raise AppError(
                "Khoảng thời gian dashboard không được vượt quá 366 ngày.",
                code="date_range_too_large",
            )

        start_local = datetime.combine(effective_date_from, time.min, tzinfo=zone)
        end_local = datetime.combine(
            effective_date_to + timedelta(days=1),
            time.min,
            tzinfo=zone,
        )
        start_utc = start_local.astimezone(UTC)
        end_utc = end_local.astimezone(UTC)
        duration = end_utc - start_utc
        today_start_local = datetime.combine(now_local.date(), time.min, tzinfo=zone)
        today_end_local = today_start_local + timedelta(days=1)

        return DashboardWindow(
            date_from=effective_date_from,
            date_to=effective_date_to,
            timezone_name=timezone_name,
            zone=zone,
            granularity=granularity,
            start_utc=start_utc,
            end_utc=end_utc,
            previous_start_utc=start_utc - duration,
            previous_end_utc=start_utc,
            today_start_utc=today_start_local.astimezone(UTC),
            today_end_utc=today_end_local.astimezone(UTC),
        )


def _validate_timezone(timezone_name: str) -> tzinfo:
    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        if timezone_name == DEFAULT_TIMEZONE:
            return datetime_timezone(timedelta(hours=7), DEFAULT_TIMEZONE)
        raise AppError(
            "Timezone không hợp lệ.",
            code="invalid_timezone",
        ) from exc


def _calculate_delta(current: int, previous: int) -> DashboardDelta:
    if previous == 0:
        if current == 0:
            return DashboardDelta(value_pct=0, direction="neutral", label="Không đổi")
        return DashboardDelta(value_pct=None, direction="new", label="Mới phát sinh")

    value_pct = round(((current - previous) / previous) * 100, 1)
    if value_pct > 0:
        direction = "up"
    elif value_pct < 0:
        direction = "down"
    else:
        direction = "neutral"
    return DashboardDelta(value_pct=value_pct, direction=direction, label=f"{value_pct:+.1f}%")


def _build_distribution(
    counts: dict[str, int],
    total: int,
    *,
    labels: list[tuple[str, str]],
) -> list[DistributionItem]:
    return [
        DistributionItem(
            key=key,
            label=label,
            count=int(counts.get(key, 0)),
            percentage=_percentage(int(counts.get(key, 0)), total),
        )
        for key, label in labels
    ]


def _build_top_companies(
    rows: list[dict[str, Any]],
    *,
    total_storage_bytes: int,
) -> list[TopCompanyStorageItem]:
    return [
        TopCompanyStorageItem(
            company_name=str(row.get("_id") or row.get("company_name") or "Chưa cập nhật công ty"),
            file_count=int(row.get("file_count") or 0),
            storage_bytes=int(row.get("storage_bytes") or 0),
            percentage_of_total=_percentage(int(row.get("storage_bytes") or 0), total_storage_bytes),
        )
        for row in rows
    ]


def _percentage(value: int, total: int) -> float:
    if total <= 0:
        return 0
    return round((value / total) * 100, 1)


def _build_growth_series(
    window: DashboardWindow,
    *,
    user_buckets: list[dict[str, Any]],
    project_buckets: list[dict[str, Any]],
) -> list[GrowthBucket]:
    user_counts = _bucket_map(user_buckets, window)
    project_counts = _bucket_map(project_buckets, window)
    series: list[GrowthBucket] = []
    bucket_start = _truncate_local_datetime(
        datetime.combine(window.date_from, time.min, tzinfo=window.zone),
        window.granularity,
    )
    end_local = datetime.combine(window.date_to + timedelta(days=1), time.min, tzinfo=window.zone)

    while bucket_start < end_local:
        key = _bucket_key(bucket_start, window.granularity)
        series.append(
            GrowthBucket(
                period_start=bucket_start.astimezone(UTC),
                label=_bucket_label(bucket_start, window.granularity),
                new_users=user_counts.get(key, 0),
                new_projects=project_counts.get(key, 0),
            )
        )
        bucket_start = _next_bucket_start(bucket_start, window.granularity)

    return series


def _bucket_map(rows: list[dict[str, Any]], window: DashboardWindow) -> dict[str, int]:
    result: dict[str, int] = {}
    for row in rows:
        raw_start = row.get("_id") or row.get("period_start")
        if not isinstance(raw_start, datetime):
            continue
        if raw_start.tzinfo is None:
            raw_start = raw_start.replace(tzinfo=UTC)
        local_start = _truncate_local_datetime(
            raw_start.astimezone(window.zone),
            window.granularity,
        )
        result[_bucket_key(local_start, window.granularity)] = int(row.get("count") or 0)
    return result


def _truncate_local_datetime(value: datetime, granularity: DashboardGranularity) -> datetime:
    if granularity == "month":
        return value.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if granularity == "week":
        monday = value.date() - timedelta(days=value.weekday())
        return datetime.combine(monday, time.min, tzinfo=value.tzinfo)
    return value.replace(hour=0, minute=0, second=0, microsecond=0)


def _next_bucket_start(value: datetime, granularity: DashboardGranularity) -> datetime:
    if granularity == "month":
        if value.month == 12:
            return value.replace(year=value.year + 1, month=1)
        return value.replace(month=value.month + 1)
    if granularity == "week":
        return value + timedelta(days=7)
    return value + timedelta(days=1)


def _bucket_key(value: datetime, granularity: DashboardGranularity) -> str:
    local_start = _truncate_local_datetime(value, granularity)
    return local_start.date().isoformat()


def _bucket_label(value: datetime, granularity: DashboardGranularity) -> str:
    if granularity == "month":
        return f"Tháng {value.month:02d}/{value.year}"
    if granularity == "week":
        return f"Tuần {value.day:02d}/{value.month:02d}"
    return f"{value.day:02d}/{value.month:02d}"


def _build_recent_activity(documents: dict[str, list[dict[str, Any]]]) -> list[RecentActivityItem]:
    activities: list[RecentActivityItem] = []
    for document in documents.get("users", []):
        occurred_at = _document_time(document, "created_at")
        if occurred_at is None:
            continue
        role = str(document.get("role") or "customer")
        company = _safe_text(document.get("company_name")) or "Chưa cập nhật công ty"
        activities.append(
            RecentActivityItem(
                id=f"user_created:{_document_id(document)}",
                type="user_created",
                title="Người dùng mới đã đăng ký",
                description=f"Tài khoản {role} · {company}",
                occurred_at=occurred_at,
                entity_id=_document_id(document),
                target_url="/admin/users",
            )
        )

    for document in documents.get("projects", []):
        occurred_at = _document_time(document, "created_at")
        if occurred_at is None:
            continue
        name = _safe_text(document.get("name")) or "Dự án chưa đặt tên"
        activities.append(
            RecentActivityItem(
                id=f"project_created:{_document_id(document)}",
                type="project_created",
                title=f'Dự án "{name}" được tạo',
                description=_project_type_label(document.get("project_type")),
                occurred_at=occurred_at,
                entity_id=_document_id(document),
                target_url="/admin/projects",
            )
        )

    for document in documents.get("files", []):
        occurred_at = _document_time(document, "created_at")
        if occurred_at is None:
            continue
        activities.append(
            RecentActivityItem(
                id=f"file_uploaded:{_document_id(document)}",
                type="file_uploaded",
                title=f"File {_file_kind_label(document.get('kind'))} v{int(document.get('version') or 1)} được tải lên",
                description=f"Dung lượng {_safe_int(document.get('size_bytes'))} bytes",
                occurred_at=occurred_at,
                entity_id=_document_id(document),
                target_url="/admin/files",
            )
        )

    for document in documents.get("analysis_runs", []):
        occurred_at = _document_time(document, "completed_at") or _document_time(document, "created_at")
        if occurred_at is None:
            continue
        activities.append(
            RecentActivityItem(
                id=f"analysis_completed:{_document_id(document)}",
                type="analysis_completed",
                title=f"Phân tích {_analysis_type_label(document.get('analysis_type'))} đã hoàn thành",
                description=str(document.get("engine_version") or "Engine chưa ghi phiên bản"),
                occurred_at=occurred_at,
                entity_id=_document_id(document),
                target_url="/admin/reports",
            )
        )

    for document in documents.get("leads", []):
        occurred_at = _document_time(document, "created_at")
        if occurred_at is None:
            continue
        company = _safe_text(document.get("company_name")) or "Chưa cập nhật công ty"
        activities.append(
            RecentActivityItem(
                id=f"lead_created:{_document_id(document)}",
                type="lead_created",
                title=f"Lead {_lead_source_label(document.get('sources'))} mới được ghi nhận",
                description=company,
                occurred_at=occurred_at,
                entity_id=_document_id(document),
                target_url="/admin/leads",
            )
        )

    activities.sort(key=lambda item: item.occurred_at, reverse=True)
    return activities[:10]


def _document_id(document: dict[str, Any]) -> str:
    return str(document.get("_id") or document.get("id") or "")


def _document_time(document: dict[str, Any], field_name: str) -> datetime | None:
    value = document.get(field_name)
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    return None


def _safe_text(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def _safe_int(value: object) -> int:
    return int(value) if isinstance(value, int | float) else 0


def _project_type_label(value: object) -> str:
    if value == "quick_sizing":
        return "Quick Sizing"
    if value == "bess_planning":
        return "BESS Planner"
    return "Loại dự án chưa xác định"


def _file_kind_label(value: object) -> str:
    if value == "load_profile":
        return "phụ tải"
    if value == "pv_profile":
        return "PV"
    return "dữ liệu"


def _analysis_type_label(value: object) -> str:
    if value == "quick_sizing":
        return "Quick Sizing"
    if value == "bess_planning":
        return "BESS Planner"
    if isinstance(value, str) and value:
        return value
    return "hệ thống"


def _lead_source_label(value: object) -> str:
    if isinstance(value, list) and "quick_sizing" in value:
        return "Quick Sizing"
    if isinstance(value, list) and "bess_planner" in value:
        return "BESS Planner"
    return "khách hàng"
