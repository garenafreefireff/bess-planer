import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore, type AuthSession } from "@/features/auth/store/auth.store";

const apiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured. Add it to frontend/.env.local.");
}

const apiClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  withCredentials: true
});

const refreshClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  withCredentials: true
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

let refreshPromise: Promise<AuthSession> | null = null;

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = useAuthStore.getState().accessToken
    ?? window.localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (!shouldRefresh(error, originalRequest)) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!originalRequest) {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }

    originalRequest._authRetry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post<AuthSession>("/auth/refresh", refreshToken ? { refresh_token: refreshToken } : {})
          .then((response) => response.data)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const session = await refreshPromise;
      useAuthStore.getState().setSession(session);
      originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      return Promise.reject(refreshError);
    }
  }
);

function shouldRefresh(
  error: AxiosError,
  request: RetryableRequestConfig | undefined
) {
  if (typeof window === "undefined" || error.response?.status !== 401 || !request || request._authRetry) {
    return false;
  }

  const url = request.url ?? "";
  return ![
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout"
  ].some((path) => url.includes(path));
}

export default apiClient;
