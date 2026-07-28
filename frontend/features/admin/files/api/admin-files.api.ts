import apiClient from "@/lib/api/client";
import type {
  AdminFileDetail,
  AdminFileFilters,
  AdminFileListResponse,
  AdminFilesOverview
} from "../data/admin-file.types";

type AdminFileListParams = Partial<AdminFileFilters>;

export const adminFilesApi = {
  async list(params: AdminFileListParams): Promise<AdminFileListResponse> {
    const response = await apiClient.get<AdminFileListResponse>("/admin/files", {
      params: toRequestParams(params)
    });
    return response.data;
  },

  async overview(params: { date_from?: string; date_to?: string; timezone?: string } = {}): Promise<AdminFilesOverview> {
    const response = await apiClient.get<AdminFilesOverview>("/admin/files/overview", {
      params: {
        date_from: params.date_from || undefined,
        date_to: params.date_to || undefined,
        timezone: params.timezone || undefined
      }
    });
    return response.data;
  },

  async detail(fileId: string): Promise<AdminFileDetail> {
    const response = await apiClient.get<AdminFileDetail>(`/admin/files/${fileId}`);
    return response.data;
  },

  async download(fileId: string): Promise<{ blob: Blob; filename: string }> {
    const response = await apiClient.get<Blob>(`/admin/files/${fileId}/download`, {
      responseType: "blob"
    });
    return {
      blob: response.data,
      filename: filenameFromDisposition(response.headers["content-disposition"]) || "download"
    };
  }
};

function toRequestParams(params: AdminFileListParams) {
  return {
    page: params.page,
    page_size: params.page_size,
    search: params.search?.trim() || undefined,
    kind: params.kind || undefined,
    file_status: params.file_status || undefined,
    dataset_status: params.dataset_status || undefined,
    extension: params.extension || undefined,
    user_id: params.user_id?.trim() || undefined,
    project_id: params.project_id?.trim() || undefined,
    company: params.company?.trim() || undefined,
    active: params.active || undefined,
    latest_only: params.latest_only || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
    sort_by: params.sort_by,
    sort_order: params.sort_order
  };
}

function filenameFromDisposition(disposition: string | undefined): string | null {
  if (!disposition) return null;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const asciiMatch = /filename="?([^";]+)"?/i.exec(disposition);
  return asciiMatch?.[1] ?? null;
}
