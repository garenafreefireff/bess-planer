import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  company_name: string | null;
  representative_name: string;
  phone: string | null;
  industry: string | null;
  role: "customer" | "admin";
  status: "active" | "suspended";
  preferences: {
    language: string;
    timezone: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAccessToken: (accessToken: string | null) => void;
  setSession: (session: AuthSession) => void;
  setUser: (user: AuthUser | null) => void;
  clearSession: () => void;
  hydrateFromStorage: () => { accessToken: string | null; refreshToken: string | null };
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setAccessToken: (accessToken) => {
    if (typeof window !== "undefined") {
      if (accessToken) {
        window.localStorage.setItem("access_token", accessToken);
      } else {
        window.localStorage.removeItem("access_token");
      }
    }

    set({ accessToken });
  },
  setSession: (session) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("access_token", session.access_token);
      window.localStorage.setItem("refresh_token", session.refresh_token);
    }

    set({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: session.user
    });
  },
  setUser: (user) => set({ user }),
  clearSession: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
      window.localStorage.removeItem("refresh_token");
    }

    set({ accessToken: null, refreshToken: null, user: null });
  },
  hydrateFromStorage: () => {
    if (typeof window === "undefined") {
      return { accessToken: null, refreshToken: null };
    }

    const accessToken = window.localStorage.getItem("access_token");
    const refreshToken = window.localStorage.getItem("refresh_token");
    set({ accessToken, refreshToken });
    return { accessToken, refreshToken };
  }
}));
