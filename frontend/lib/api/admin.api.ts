import { AxiosError } from "axios";

import apiClient from "@/lib/api/client";

export type AdminUserRole = "customer" | "admin";
export type AdminUserStatus = "active" | "suspended";

export type AdminUserResponse = {
  id: string;
  email: string;
  company_name: string | null;
  representative_name: string;
  phone: string | null;
  industry: string | null;
  organization_id: string | null;
  role: AdminUserRole;
  status: AdminUserStatus;
  preferences: {
    language: string;
    timezone: string;
  };
  created_at: string;
  updated_at: string;
};

export type AdminOrganizationResponse = {
  id: string;
  owner_user_id: string;
  name: string;
  industry: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  member_user_ids: string[];
  created_at: string;
  updated_at: string;
};

export type AdminProjectStatus = "draft" | "active" | "completed" | "archived";
export type AdminProjectType = "quick_sizing" | "bess_planning";

export type AdminProjectResponse = {
  id: string;
  user_id: string;
  site_id: string;
  bess_catalog_id: string;
  latest_analysis_run_id: string | null;
  name: string;
  project_type: AdminProjectType;
  status: AdminProjectStatus;
  configuration: Record<string, unknown>;
  scenarios: Array<Record<string, unknown>>;
  dataset_ids: string[];
  created_at: string;
  updated_at: string;
};

type PageResponse<T> = {
  items: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
};

export const adminUsersApi = {
  async listOrganizations(params: {
    page?: number;
    page_size?: number;
    search?: string;
  } = {}): Promise<PageResponse<AdminOrganizationResponse>> {
    const response = await apiClient.get<PageResponse<AdminOrganizationResponse>>("/admin/users/organizations", { params });
    return response.data;
  },

  async list(params: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: AdminUserRole | "";
    status?: AdminUserStatus | "";
  } = {}): Promise<PageResponse<AdminUserResponse>> {
    const requestParams = {
      page: params.page,
      page_size: params.page_size,
      search: params.search?.trim() || undefined,
      role: params.role || undefined,
      status: params.status || undefined
    };
    const response = await apiClient.get<PageResponse<AdminUserResponse>>("/admin/users", {
      params: requestParams
    });
    return response.data;
  },

  async update(
    userId: string,
    payload: Partial<Pick<AdminUserResponse, "company_name" | "representative_name" | "phone" | "industry" | "role" | "status">>
  ): Promise<AdminUserResponse> {
    const response = await apiClient.patch<AdminUserResponse>(`/admin/users/${userId}`, payload);
    return response.data;
  }
};

export const adminProjectsApi = {
  async list(params: {
    page?: number;
    page_size?: number;
    search?: string;
    type?: AdminProjectType | "";
    status?: AdminProjectStatus | "";
  } = {}): Promise<PageResponse<AdminProjectResponse>> {
    const requestParams = {
      page: params.page,
      page_size: params.page_size,
      search: params.search?.trim() || undefined,
      type: params.type || undefined,
      status: params.status || undefined
    };
    const response = await apiClient.get<PageResponse<AdminProjectResponse>>("/admin/projects", {
      params: requestParams
    });
    return response.data;
  },

  async update(
    projectId: string,
    payload: Partial<Pick<AdminProjectResponse, "name" | "status" | "project_type">>
  ): Promise<AdminProjectResponse> {
    const response = await apiClient.patch<AdminProjectResponse>(`/admin/projects/${projectId}`, payload);
    return response.data;
  }
};

export function readAdminApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data as { message?: unknown; detail?: unknown } | undefined;
    const message = detail?.message ?? detail?.detail;
    if (typeof message === "string") return message;
    if (error.response?.status === 403) return "Tài khoản không có quyền quản trị.";
    if (error.response?.status === 404) return "Không tìm thấy dữ liệu yêu cầu.";
    if (error.response?.status === 503) return "MongoDB chưa sẵn sàng. Vui lòng kiểm tra backend và database.";
  }
  return "Không thể tải dữ liệu quản trị. Vui lòng thử lại.";
}

