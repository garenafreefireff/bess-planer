from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

DashboardGranularity = Literal["day", "week", "month"]
DeltaDirection = Literal["up", "down", "neutral", "new"]
ActivityType = Literal[
    "user_created",
    "project_created",
    "file_uploaded",
    "analysis_completed",
    "lead_created",
]


class DashboardPeriod(BaseModel):
    date_from: date
    date_to: date
    timezone: str
    granularity: DashboardGranularity


class DashboardDelta(BaseModel):
    value_pct: float | None
    direction: DeltaDirection
    label: str


class CreatedCountMetric(BaseModel):
    value: int
    period_value: int
    previous_period_value: int
    delta: DashboardDelta


class ActiveAccountsMetric(BaseModel):
    value: int
    secondary_value: int
    secondary_label: str


class StorageMetric(BaseModel):
    value: int
    period_value: int
    previous_period_value: int
    delta: DashboardDelta


class AnalysisRunsMetric(BaseModel):
    value: int
    period_value: int
    previous_period_value: int
    delta: DashboardDelta
    completed: int
    quick_sizing: int
    bess_planner: int


class DashboardMetrics(BaseModel):
    total_users: CreatedCountMetric
    active_accounts: ActiveAccountsMetric
    total_projects: CreatedCountMetric
    storage_bytes: StorageMetric
    analysis_runs: AnalysisRunsMetric


class GrowthBucket(BaseModel):
    period_start: datetime
    label: str
    new_users: int
    new_projects: int


class DistributionItem(BaseModel):
    key: str
    label: str
    count: int
    percentage: float


class TopCompanyStorageItem(BaseModel):
    company_name: str
    file_count: int
    storage_bytes: int
    percentage_of_total: float


class RecentActivityItem(BaseModel):
    id: str
    type: ActivityType
    title: str
    description: str
    occurred_at: datetime
    actor_label: str | None = None
    entity_id: str
    target_url: str


class FileUploadsTodayStatus(BaseModel):
    count: int
    total_size_bytes: int


class CountStatus(BaseModel):
    count: int
    detail: str


class DashboardQuickStatus(BaseModel):
    file_uploads_today: FileUploadsTodayStatus
    analyses_completed_today: CountStatus
    new_leads: CountStatus
    pending_emails: CountStatus


class DashboardCapabilities(BaseModel):
    billing_available: bool = False
    audit_log_available: bool = False
    active_user_tracking_available: bool = False
    analysis_failure_tracking_available: bool = False


class AdminDashboardOverviewResponse(BaseModel):
    generated_at: datetime
    period: DashboardPeriod
    metrics: DashboardMetrics
    growth_series: list[GrowthBucket]
    user_role_distribution: list[DistributionItem]
    project_status_distribution: list[DistributionItem]
    top_companies_by_storage: list[TopCompanyStorageItem]
    recent_activity: list[RecentActivityItem]
    quick_status: DashboardQuickStatus
    capabilities: DashboardCapabilities
