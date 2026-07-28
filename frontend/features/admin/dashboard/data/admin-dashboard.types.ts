export type DashboardGranularity = "day" | "week" | "month";
export type DashboardDeltaDirection = "up" | "down" | "neutral" | "new";
export type ActivityType =
  | "user_created"
  | "project_created"
  | "file_uploaded"
  | "analysis_completed"
  | "lead_created";

export type DashboardFilters = {
  date_from: string;
  date_to: string;
  timezone: string;
  granularity: DashboardGranularity;
};

export type DashboardPeriod = DashboardFilters;

export type DashboardDelta = {
  value_pct: number | null;
  direction: DashboardDeltaDirection;
  label: string;
};

export type CreatedCountMetric = {
  value: number;
  period_value: number;
  previous_period_value: number;
  delta: DashboardDelta;
};

export type ActiveAccountsMetric = {
  value: number;
  secondary_value: number;
  secondary_label: string;
};

export type StorageMetric = {
  value: number;
  period_value: number;
  previous_period_value: number;
  delta: DashboardDelta;
};

export type AnalysisRunsMetric = {
  value: number;
  period_value: number;
  previous_period_value: number;
  delta: DashboardDelta;
  completed: number;
  quick_sizing: number;
  bess_planner: number;
};

export type DashboardMetrics = {
  total_users: CreatedCountMetric;
  active_accounts: ActiveAccountsMetric;
  total_projects: CreatedCountMetric;
  storage_bytes: StorageMetric;
  analysis_runs: AnalysisRunsMetric;
};

export type GrowthBucket = {
  period_start: string;
  label: string;
  new_users: number;
  new_projects: number;
};

export type DistributionItem = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type TopCompanyStorageItem = {
  company_name: string;
  file_count: number;
  storage_bytes: number;
  percentage_of_total: number;
};

export type RecentActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  occurred_at: string;
  actor_label: string | null;
  entity_id: string;
  target_url: string;
};

export type DashboardQuickStatus = {
  file_uploads_today: {
    count: number;
    total_size_bytes: number;
  };
  analyses_completed_today: {
    count: number;
    detail: string;
  };
  new_leads: {
    count: number;
    detail: string;
  };
  pending_emails: {
    count: number;
    detail: string;
  };
};

export type DashboardCapabilities = {
  billing_available: boolean;
  audit_log_available: boolean;
  active_user_tracking_available: boolean;
  analysis_failure_tracking_available: boolean;
};

export type AdminDashboardOverview = {
  generated_at: string;
  period: DashboardPeriod;
  metrics: DashboardMetrics;
  growth_series: GrowthBucket[];
  user_role_distribution: DistributionItem[];
  project_status_distribution: DistributionItem[];
  top_companies_by_storage: TopCompanyStorageItem[];
  recent_activity: RecentActivityItem[];
  quick_status: DashboardQuickStatus;
  capabilities: DashboardCapabilities;
};
