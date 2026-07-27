import { AxiosError } from "axios";

import apiClient from "@/lib/api/client";

export type OrganizationResponse = {
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

export const organizationApi = {
  async getCurrent(): Promise<OrganizationResponse> {
    const response = await apiClient.get<OrganizationResponse>("/organizations/current");
    return response.data;
  },

  async updateCurrent(
    payload: Partial<Pick<OrganizationResponse, "name" | "industry" | "phone" | "address">>
  ): Promise<OrganizationResponse> {
    const response = await apiClient.patch<OrganizationResponse>("/organizations/current", payload);
    return response.data;
  }
};

export function readOrganizationApiError(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message ?? error.response?.data?.detail;
    if (typeof message === "string") return message;
    if (error.response?.status === 403) return "Chỉ chủ sở hữu organization mới có thể cập nhật.";
  }
  return "Không thể tải thông tin tổ chức. Vui lòng thử lại.";
}
