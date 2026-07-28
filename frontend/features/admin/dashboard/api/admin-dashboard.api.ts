import apiClient from "@/lib/api/client";
import type {
  AdminDashboardOverview,
  DashboardFilters
} from "../data/admin-dashboard.types";

export const adminDashboardApi = {
  async getOverview(params: DashboardFilters): Promise<AdminDashboardOverview> {
    const response = await apiClient.get<AdminDashboardOverview>("/admin/dashboard/overview", {
      params
    });
    return response.data;
  }
};
