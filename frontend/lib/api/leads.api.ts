import { AxiosError } from "axios";

import apiClient from "@/lib/api/client";

export type LeadSource = "contact_form" | "quick_sizing" | "registration" | "bess_planner";
export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "converted" | "lost";

export type LeadResponse = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  industry: string | null;
  interest: string | null;
  message: string | null;
  user_id: string | null;
  sources: LeadSource[];
  status: LeadStatus;
  assigned_to: string | null;
  admin_note: string | null;
  tags: string[];
  privacy_consent: boolean;
  marketing_consent: boolean;
  training_consent: boolean;
  touch_count: number;
  lead_score: number;
  lead_grade: "cold" | "warm" | "hot";
  score_reasons: string[];
  result_code: string | null;
  latest_quick_sizing_input: Record<string, unknown> | null;
  latest_quick_sizing_result: Record<string, unknown> | null;
  planner_conversion_at: string | null;
  planner_project_id: string | null;
  interactions: Array<Record<string, unknown>>;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadCaptureResponse = {
  lead_id: string;
  email: string;
  result_code: string | null;
  report_unlocked: boolean;
};

export type LeadPageResponse = {
  items: LeadResponse[];
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
};

export type ContactLeadPayload = {
  source?: "contact_form";
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  industry?: string;
  interest?: string;
  message?: string;
  privacy_consent?: boolean;
  marketing_consent?: boolean;
  training_consent?: boolean;
  metadata?: Record<string, unknown>;
};

export type QuickSizingLeadPayload = Omit<ContactLeadPayload, "source"> & {
  source?: "quick_sizing";
  analysis_run_id?: string | null;
  input_snapshot: Record<string, unknown>;
  result_snapshot: Record<string, unknown>;
};

export const leadsApi = {
  async create(payload: ContactLeadPayload): Promise<LeadCaptureResponse> {
    const response = await apiClient.post<LeadCaptureResponse>("/leads", {
      source: "contact_form",
      privacy_consent: true,
      marketing_consent: false,
      training_consent: false,
      ...payload
    });
    return response.data;
  },

  async captureQuickSizing(payload: QuickSizingLeadPayload): Promise<LeadCaptureResponse> {
    const response = await apiClient.post<LeadCaptureResponse>("/leads/quick-sizing", {
      source: "quick_sizing",
      ...payload
    });
    return response.data;
  },

  async markQuickSizingConversion(payload: {
    result_code: string;
    project_id: string;
    selected_candidate_id?: string | null;
  }): Promise<LeadResponse> {
    const response = await apiClient.post<LeadResponse>("/leads/quick-sizing/conversion", payload);
    return response.data;
  },

  async listAdmin(params: {
    page?: number;
    page_size?: number;
    status?: LeadStatus | "";
    source?: LeadSource | "";
    search?: string;
  } = {}): Promise<LeadPageResponse> {
    const requestParams = {
      page: params.page,
      page_size: params.page_size,
      status: params.status || undefined,
      source: params.source || undefined,
      search: params.search?.trim() || undefined
    };
    const response = await apiClient.get<LeadPageResponse>("/admin/leads", {
      params: requestParams
    });
    return response.data;
  },

  async updateAdmin(
    leadId: string,
    payload: Partial<Pick<LeadResponse, "status" | "assigned_to" | "admin_note" | "tags">>
  ): Promise<LeadResponse> {
    const response = await apiClient.patch<LeadResponse>(`/admin/leads/${leadId}`, payload);
    return response.data;
  }
};

export function readLeadApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message ?? error.response?.data?.detail;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return "Thông tin lead chưa hợp lệ.";
    if (error.response?.status === 403) return "Tài khoản hiện tại không có quyền quản trị lead.";
  }
  return "Không thể lưu thông tin. Vui lòng thử lại.";
}
