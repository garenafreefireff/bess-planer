export type AdminFileKind = "load_profile" | "pv_profile" | "other";
export type AdminFileStatus = "uploaded" | "validated" | "invalid";
export type AdminDatasetStatus = "ready" | "warning" | "invalid";
export type AdminDatasetStatusFilter = AdminDatasetStatus | "missing";
export type AdminFileExtension = "csv" | "xlsx";
export type AdminFileSortBy = "created_at" | "size_bytes" | "original_name" | "version";
export type AdminFileSortOrder = "asc" | "desc";
export type AdminProjectType = "quick_sizing" | "bess_planning";
export type AdminProjectStatus = "draft" | "active" | "completed" | "archived";

export type AdminFileOwner = {
  id: string | null;
  name: string;
  email: string | null;
  company_name: string | null;
};

export type AdminFileProject = {
  id: string | null;
  name: string;
  project_type: AdminProjectType | null;
  status: AdminProjectStatus | null;
};

export type AdminFileDataset = {
  id: string;
  dataset_type: Exclude<AdminFileKind, "other">;
  status: AdminDatasetStatus;
  version: number;
  row_count: number;
  valid_row_count: number;
  interval_minutes: number | null;
  start_at: string | null;
  end_at: string | null;
  warning_count: number;
};

export type AdminFileListItem = {
  id: string;
  original_name: string;
  extension: AdminFileExtension;
  content_type: string;
  size_bytes: number;
  sha256: string;
  kind: AdminFileKind;
  status: AdminFileStatus;
  version: number;
  supersedes_file_id: string | null;
  created_at: string;
  updated_at: string;
  owner: AdminFileOwner;
  project: AdminFileProject;
  dataset: AdminFileDataset | null;
  is_active: boolean;
  is_latest_version: boolean;
  analysis_reference_count: number;
  can_delete: boolean;
  delete_block_reason: string | null;
};

export type AdminFileListResponse = {
  items: AdminFileListItem[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export type AdminFileFilters = {
  page: number;
  page_size: number;
  search: string;
  kind: AdminFileKind | "";
  file_status: AdminFileStatus | "";
  dataset_status: AdminDatasetStatusFilter | "";
  extension: AdminFileExtension | "";
  user_id: string;
  project_id: string;
  company: string;
  active: "" | "true" | "false";
  latest_only: boolean;
  date_from: string;
  date_to: string;
  sort_by: AdminFileSortBy;
  sort_order: AdminFileSortOrder;
};

export type AdminFilesOverview = {
  generated_at: string;
  period: {
    date_from: string;
    date_to: string;
    timezone: string;
  };
  metrics: {
    total_files: number;
    total_storage_bytes: number;
    uploads_today: {
      count: number;
      total_size_bytes: number;
    };
    ready_datasets: number;
    needs_attention: number;
  };
  recent_uploads: AdminRecentUpload[];
  storage_by_company: AdminStorageByCompany[];
  kind_distribution: AdminFileDistributionItem[];
  quality_distribution: AdminFileDistributionItem[];
};

export type AdminRecentUpload = {
  id: string;
  original_name: string;
  kind: AdminFileKind;
  version: number;
  size_bytes: number;
  owner_name: string;
  company_name: string | null;
  project_name: string;
  dataset_status: AdminDatasetStatusFilter;
  is_active: boolean;
  created_at: string;
};

export type AdminStorageByCompany = {
  company_name: string;
  file_count: number;
  storage_bytes: number;
  percentage_of_total: number;
};

export type AdminFileDistributionItem = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type AdminFileDatasetDetail = AdminFileDataset & {
  quality_summary: Record<string, unknown>;
  warnings: string[];
  columns: string[];
  timestamp_column: string | null;
  value_column: string | null;
  preview: Array<Record<string, unknown>>;
};

export type AdminFileVersionSummary = {
  id: string;
  original_name: string;
  version: number;
  created_at: string;
};

export type AdminFileDetail = Omit<AdminFileListItem, "dataset"> & {
  metadata: Record<string, unknown>;
  dataset: AdminFileDatasetDetail | null;
  previous_version: AdminFileVersionSummary | null;
  next_version: AdminFileVersionSummary | null;
  physical_file_exists: boolean;
  can_download: boolean;
};
