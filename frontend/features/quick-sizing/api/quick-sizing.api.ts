import { AxiosError } from "axios";
import apiClient from "@/lib/api/client";
import type { QuickSizingStep1FormValues } from "../data/quick-sizing-step1-schema";
import type { QuickSizingAnalysisRun } from "../data/quick-sizing-api-types";

export type QuickSizingStep1Payload = Partial<QuickSizingStep1FormValues> & {
  [key: string]: unknown;
};

export const quickSizingApi = {
  async createQuickSizingRun(payload: QuickSizingStep1Payload): Promise<QuickSizingAnalysisRun> {
    const response = await apiClient.post<QuickSizingAnalysisRun>("/analyses/quick-sizing", payload);
    return response.data;
  }
};

export function readQuickSizingApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message ?? error.response?.data?.detail;
    if (typeof message === "string") {
      return message;
    }
    if (error.response?.status === 401) {
      return "Phiên đăng nhập không hợp lệ. Anh vẫn có thể đăng xuất và thử lại.";
    }
  }

  return "Không thể tạo giả định Quick Sizing từ backend. Vui lòng thử lại.";
}
