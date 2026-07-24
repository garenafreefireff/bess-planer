import apiClient from "@/lib/api/client";
import type { AuthSession, AuthUser } from "@/features/auth/store/auth.store";

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

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>("/auth/login", payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>("/auth/register", payload);
    return response.data;
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/auth/me");
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post("/auth/logout", { refresh_token: refreshToken });
  }
};
