import apiClient from "@/lib/api/client";
import type { AdminSearchResponse } from "../data/admin-search.types";

export const adminSearchApi = {
  async search(query: string, limitPerGroup = 5): Promise<AdminSearchResponse> {
    const response = await apiClient.get<AdminSearchResponse>("/admin/search", {
      params: {
        q: query,
        limit_per_group: limitPerGroup
      }
    });
    return response.data;
  }
};
