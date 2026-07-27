import apiClient from "@/lib/api/client";
import type { AuthSession, AuthUser } from "@/features/auth/store/auth.store";
import { AxiosError } from "axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  company_name?: string;
  representative_name: string;
  phone?: string;
  industry?: string;
}

export class AdminAccessRequiredError extends Error {
  constructor() {
    super("Tài khoản này không có quyền truy cập Admin Portal.");
    this.name = "AdminAccessRequiredError";
  }
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>("/auth/login", payload);
    return response.data;
  },

  async loginAdmin(payload: LoginPayload): Promise<AuthSession> {
    const session = await this.login(payload);
    if (session.user.role !== "admin") {
      await apiClient.post("/auth/logout", { refresh_token: session.refresh_token }).catch(() => undefined);
      throw new AdminAccessRequiredError();
    }
    return session;
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>("/auth/register", payload);
    return response.data;
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/auth/me");
    return response.data;
  },

  async logout(refreshToken?: string | null): Promise<void> {
    await apiClient.post("/auth/logout", refreshToken ? { refresh_token: refreshToken } : {});
  }
};

export function readAuthApiError(error: unknown): string {
  if (error instanceof AdminAccessRequiredError) {
    return error.message;
  }
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message ?? error.response?.data?.detail;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return "Thông tin đăng nhập chưa hợp lệ.";
  }
  return "Không thể xác thực tài khoản. Vui lòng thử lại.";
}
