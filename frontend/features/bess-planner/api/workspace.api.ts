import axios from "axios";
import apiClient from "@/lib/api/client";
import type { MessageResponse, PageResponse } from "@/lib/api/types";

export type ProjectType = "quick_sizing" | "bess_planning";
export type ProjectStatus = "draft" | "active" | "completed" | "archived";

export type ProjectResponse = {
  id: string;
  user_id: string;
  site_id: string;
  bess_catalog_id: string;
  latest_analysis_run_id: string | null;
  active_load_dataset_id: string | null;
  active_pv_dataset_id: string | null;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  configuration: Record<string, unknown>;
  scenarios: Array<Record<string, unknown>>;
  dataset_ids: string[];
  created_at: string;
  updated_at: string;
};

export type SiteStatus = "active" | "inactive" | "archived";

export type SiteCreatePayload = {
  tariff_id: string;
  name: string;
  code: string;
  location?: Record<string, unknown>;
  voltage_level: string;
  contract_capacity_kw: number;
  pv_system?: Record<string, unknown>;
  status?: SiteStatus;
};

export type SiteUpdatePayload = Partial<SiteCreatePayload>;

export type SiteResponse = {
  id: string;
  user_id: string;
  tariff_id: string;
  name: string;
  code: string;
  location: Record<string, unknown>;
  voltage_level: string;
  contract_capacity_kw: number;
  pv_system: Record<string, unknown>;
  status: SiteStatus;
  created_at: string;
  updated_at: string;
};

export type TariffStatus = "active" | "inactive" | "archived";

export type TariffCreatePayload = {
  code: string;
  name: string;
  customer_group: string;
  voltage_level: string;
  currency: string;
  energy_prices?: Record<string, unknown>;
  tou_periods?: Array<Record<string, unknown>>;
  demand_charge_per_kw: number;
  vat_pct: number;
  version?: number;
  effective_from: string;
  status?: TariffStatus;
};

export type TariffUpdatePayload = Partial<TariffCreatePayload>;

export type TariffResponse = {
  id: string;
  code: string;
  name: string;
  customer_group: string;
  voltage_level: string;
  currency: string;
  energy_prices: Record<string, unknown>;
  tou_periods: Array<Record<string, unknown>>;
  demand_charge_per_kw: number;
  vat_pct: number;
  version: number;
  effective_from: string;
  status: TariffStatus;
  created_at: string;
  updated_at: string;
};

export type BessCatalogStatus = "active" | "inactive" | "archived";

export type BessCatalogBattery = Record<string, unknown> & {
  energy_kwh?: number;
  nominal_voltage_v?: number;
  dod_pct?: number;
  round_trip_efficiency_pct?: number;
  degradation_pct_per_year?: number;
  cycle_life?: number;
};

export type BessCatalogPcs = Record<string, unknown> & {
  power_kw?: number;
  efficiency_pct?: number;
  ac_voltage_v?: number;
  overload_pct?: number;
};

export type BessCatalogCost = Record<string, unknown> & {
  currency?: string;
  battery_unit_cost_per_kwh?: number;
  pcs_unit_cost_per_kw?: number;
  epc_pct?: number;
  other_cost_pct?: number;
  annual_opex_pct?: number;
};

export type BessCatalogWarranty = Record<string, unknown> & {
  years?: number;
  capacity_retention_pct?: number;
  cycle_warranty?: number;
};

export type BessCatalogCreatePayload = {
  code: string;
  name: string;
  battery?: BessCatalogBattery;
  pcs?: BessCatalogPcs;
  cost?: BessCatalogCost;
  warranty?: BessCatalogWarranty;
  version?: number;
  status?: BessCatalogStatus;
};

export type BessCatalogUpdatePayload = Partial<BessCatalogCreatePayload>;

export type BessCatalogResponse = {
  id: string;
  code: string;
  name: string;
  battery: BessCatalogBattery;
  pcs: BessCatalogPcs;
  cost: BessCatalogCost;
  warranty: BessCatalogWarranty;
  version: number;
  status: BessCatalogStatus;
  created_at: string;
  updated_at: string;
};

export type WorkspaceFileKind = "load_profile" | "pv_profile" | "other";
export type WorkspaceFileStatus = "uploaded" | "validated" | "invalid";

export type WorkspaceFileResponse = {
  id: string;
  user_id: string;
  project_id: string;
  original_name: string;
  storage_name: string;
  content_type: string;
  extension: string;
  size_bytes: number;
  sha256: string;
  kind: WorkspaceFileKind;
  status: WorkspaceFileStatus;
  version: number;
  supersedes_file_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DatasetType = "load_profile" | "pv_profile";
export type DatasetStatus = "ready" | "warning" | "invalid";

export type DatasetResponse = {
  id: string;
  user_id: string;
  project_id: string;
  file_id: string;
  dataset_type: DatasetType;
  status: DatasetStatus;
  version: number;
  row_count: number;
  valid_row_count: number;
  interval_minutes: number | null;
  columns: string[];
  timestamp_column: string | null;
  value_column: string | null;
  start_at: string | null;
  end_at: string | null;
  quality_summary: Record<string, unknown>;
  preview: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
};

export type AnalysisType = "quick_sizing" | "bess_planning" | "technical" | "financial";
export type AnalysisRunStatus = "queued" | "running" | "completed" | "failed";

export type ApplySizingSelectionResponse = {
  project_id: string;
  analysis_run_id: string;
  candidate_id: string;
  energy_kwh: number;
  power_kw: number;
  contract_pmax_kw: number;
  scenario_created: boolean;
};

export type AnalysisRunResponse = {
  id: string | null;
  user_id: string | null;
  project_id: string | null;
  bess_catalog_id: string | null;
  analysis_type: AnalysisType;
  status: AnalysisRunStatus;
  progress_pct: number;
  input_snapshot: Record<string, unknown>;
  result: Record<string, unknown>;
  artifacts: Record<string, unknown>;
  engine_version: string;
  error: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type PaginationParams = {
  page?: number;
  page_size?: number;
};

type FileListParams = PaginationParams & {
  project_id?: string;
  kind?: WorkspaceFileKind;
  status?: WorkspaceFileStatus;
};

type DatasetListParams = PaginationParams & {
  project_id?: string;
  dataset_type?: DatasetType;
  status?: DatasetStatus;
};

export const projectsApi = {
  async list(params: PaginationParams = {}): Promise<PageResponse<ProjectResponse>> {
    const response = await apiClient.get<PageResponse<ProjectResponse>>("/projects", { params });
    return response.data;
  },

  async get(projectId: string): Promise<ProjectResponse> {
    const response = await apiClient.get<ProjectResponse>(`/projects/${projectId}`);
    return response.data;
  },

  async create(payload: {
    site_id: string;
    bess_catalog_id: string;
    name: string;
    project_type?: ProjectType;
    status?: ProjectStatus;
    active_load_dataset_id?: string | null;
    active_pv_dataset_id?: string | null;
    configuration?: Record<string, unknown>;
    scenarios?: Array<Record<string, unknown>>;
    dataset_ids?: string[];
  }): Promise<ProjectResponse> {
    const response = await apiClient.post<ProjectResponse>("/projects", payload);
    return response.data;
  },

  async update(
    projectId: string,
    payload: Partial<{
      site_id: string;
      bess_catalog_id: string;
      latest_analysis_run_id: string | null;
      active_load_dataset_id: string | null;
      active_pv_dataset_id: string | null;
      name: string;
      project_type: ProjectType;
      status: ProjectStatus;
      configuration: Record<string, unknown>;
      scenarios: Array<Record<string, unknown>>;
      dataset_ids: string[];
    }>
  ): Promise<ProjectResponse> {
    const response = await apiClient.patch<ProjectResponse>(`/projects/${projectId}`, payload);
    return response.data;
  },

  async remove(projectId: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/projects/${projectId}`);
    return response.data;
  }
};

export const sitesApi = {
  async list(params: PaginationParams = {}): Promise<PageResponse<SiteResponse>> {
    const response = await apiClient.get<PageResponse<SiteResponse>>("/sites", { params });
    return response.data;
  },

  async get(siteId: string): Promise<SiteResponse> {
    const response = await apiClient.get<SiteResponse>(`/sites/${siteId}`);
    return response.data;
  },

  async create(payload: SiteCreatePayload): Promise<SiteResponse> {
    const response = await apiClient.post<SiteResponse>("/sites", payload);
    return response.data;
  },

  async update(siteId: string, payload: SiteUpdatePayload): Promise<SiteResponse> {
    const response = await apiClient.patch<SiteResponse>(`/sites/${siteId}`, payload);
    return response.data;
  },

  async remove(siteId: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/sites/${siteId}`);
    return response.data;
  }
};

export const tariffsApi = {
  async list(params: PaginationParams & { status?: TariffStatus } = {}): Promise<PageResponse<TariffResponse>> {
    const response = await apiClient.get<PageResponse<TariffResponse>>("/tariffs", { params });
    return response.data;
  },

  async get(tariffId: string): Promise<TariffResponse> {
    const response = await apiClient.get<TariffResponse>(`/tariffs/${tariffId}`);
    return response.data;
  },

  async create(payload: TariffCreatePayload): Promise<TariffResponse> {
    const response = await apiClient.post<TariffResponse>("/tariffs", payload);
    return response.data;
  },

  async update(tariffId: string, payload: TariffUpdatePayload): Promise<TariffResponse> {
    const response = await apiClient.patch<TariffResponse>(`/tariffs/${tariffId}`, payload);
    return response.data;
  },

  async remove(tariffId: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/tariffs/${tariffId}`);
    return response.data;
  }
};

export const bessCatalogApi = {
  async list(params: PaginationParams & { status?: BessCatalogStatus } = {}): Promise<PageResponse<BessCatalogResponse>> {
    const response = await apiClient.get<PageResponse<BessCatalogResponse>>("/bess-catalog", { params });
    return response.data;
  },

  async get(itemId: string): Promise<BessCatalogResponse> {
    const response = await apiClient.get<BessCatalogResponse>(`/bess-catalog/${itemId}`);
    return response.data;
  },

  async create(payload: BessCatalogCreatePayload): Promise<BessCatalogResponse> {
    const response = await apiClient.post<BessCatalogResponse>("/bess-catalog", payload);
    return response.data;
  },

  async update(itemId: string, payload: BessCatalogUpdatePayload): Promise<BessCatalogResponse> {
    const response = await apiClient.patch<BessCatalogResponse>(`/bess-catalog/${itemId}`, payload);
    return response.data;
  },

  async remove(itemId: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/bess-catalog/${itemId}`);
    return response.data;
  }
};

export const filesApi = {
  async list(params: FileListParams = {}): Promise<PageResponse<WorkspaceFileResponse>> {
    const response = await apiClient.get<PageResponse<WorkspaceFileResponse>>("/files", { params });
    return response.data;
  },

  async upload(file: File, payload: { project_id: string; kind: WorkspaceFileKind }): Promise<WorkspaceFileResponse> {
    const formData = new FormData();
    formData.append("project_id", payload.project_id);
    formData.append("kind", payload.kind);
    formData.append("upload", file);
    const response = await apiClient.post<WorkspaceFileResponse>("/files", formData);
    return response.data;
  },

  async get(fileId: string): Promise<WorkspaceFileResponse> {
    const response = await apiClient.get<WorkspaceFileResponse>(`/files/${fileId}`);
    return response.data;
  },

  async download(fileId: string): Promise<void> {
    const response = await apiClient.get<Blob>(`/files/${fileId}/download`, { responseType: "blob" });
    const filename = parseContentDispositionFilename(response.headers["content-disposition"]) ?? `bess-file-${fileId}`;
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async remove(fileId: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/files/${fileId}`);
    return response.data;
  }
};

export const datasetsApi = {
  async list(params: DatasetListParams = {}): Promise<PageResponse<DatasetResponse>> {
    const response = await apiClient.get<PageResponse<DatasetResponse>>("/datasets", { params });
    return response.data;
  },

  async create(payload: { project_id: string; file_id: string; dataset_type: DatasetType; activate?: boolean }): Promise<DatasetResponse> {
    const response = await apiClient.post<DatasetResponse>("/datasets", payload);
    return response.data;
  },

  async get(datasetId: string): Promise<DatasetResponse> {
    const response = await apiClient.get<DatasetResponse>(`/datasets/${datasetId}`);
    return response.data;
  },

  async activate(datasetId: string): Promise<DatasetResponse> {
    const response = await apiClient.post<DatasetResponse>(`/datasets/${datasetId}/activate`);
    return response.data;
  },

  async remove(datasetId: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/datasets/${datasetId}`);
    return response.data;
  }
};

function parseContentDispositionFilename(value: unknown) {
  if (typeof value !== "string") return null;
  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (encodedMatch?.[1]) return decodeURIComponent(encodedMatch[1]);
  const plainMatch = /filename="?([^";]+)"?/i.exec(value);
  return plainMatch?.[1] ?? null;
}

export const analysesApi = {
  async createTransientSizingLab(
    projectId: string,
    loadFile: File,
    pvFile?: File | null
  ): Promise<AnalysisRunResponse> {
    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("load_file", loadFile);
    if (pvFile) formData.append("pv_file", pvFile);
    const response = await apiClient.post<AnalysisRunResponse>(
      "/analyses/sizing-lab/transient",
      formData,
      { timeout: 0 }
    );
    return response.data;
  },

  async createSizingLab(projectId: string): Promise<AnalysisRunResponse> {
    const response = await apiClient.post<AnalysisRunResponse>(
      "/analyses/sizing-lab",
      { project_id: projectId },
      { timeout: 0 }
    );
    return response.data;
  },

  async createBessPlanner(projectId: string): Promise<AnalysisRunResponse> {
    const response = await apiClient.post<AnalysisRunResponse>("/analyses/bess-planner", { project_id: projectId });
    return response.data;
  },

  async applySizingSelection(analysisRunId: string, candidateId: string): Promise<ApplySizingSelectionResponse> {
    const response = await apiClient.post<ApplySizingSelectionResponse>(`/analyses/${analysisRunId}/apply-selection`, {
      candidate_id: candidateId,
      create_scenario: true
    });
    return response.data;
  },

  async list(params: PaginationParams & { type?: AnalysisType } = {}): Promise<PageResponse<AnalysisRunResponse>> {
    const response = await apiClient.get<PageResponse<AnalysisRunResponse>>("/analyses", { params });
    return response.data;
  },

  async get(analysisRunId: string): Promise<AnalysisRunResponse> {
    const response = await apiClient.get<AnalysisRunResponse>(`/analyses/${analysisRunId}`);
    return response.data;
  }
};

export function readWorkspaceApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message = data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    const detail = data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((item) => item?.msg).filter(Boolean).join("; ") || error.message;
    }
    const validationDetails = data?.details;
    if (Array.isArray(validationDetails)) {
      return validationDetails.map((item) => item?.msg).filter(Boolean).join("; ") || error.message;
    }
    return error.message;
  }

  return error instanceof Error ? error.message : "Không thể kết nối tới hệ thống. Vui lòng thử lại.";
}
