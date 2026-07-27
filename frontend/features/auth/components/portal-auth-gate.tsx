"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { EnergyInsightLogo } from "@/components/layout/brand-logo";
import { PortalAuthPage, type PortalAuthFormState, type PortalAuthMode } from "./portal-auth-presentation";

const initialForm: PortalAuthFormState = {
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  companyName: "",
  phone: "",
  industry: ""
};

export function PortalAuthGate({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mode, setMode] = useState<PortalAuthMode>("login");
  const [form, setForm] = useState<PortalAuthFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const storedSession = hydrateFromStorage();
      if (!storedSession.accessToken) {
        if (mounted) {
          setCheckingSession(false);
        }
        return;
      }

      try {
        const currentUser = await authApi.me();
        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        clearSession();
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [clearSession, hydrateFromStorage, setUser]);

  const updateForm = (field: keyof PortalAuthFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const changeMode = (nextMode: PortalAuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (mode === "register" && form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const session =
        mode === "login"
          ? await authApi.login({
              email: form.email,
              password: form.password
            })
          : await authApi.register({
              email: form.email,
              password: form.password,
              company_name: form.companyName || undefined,
              representative_name: form.fullName,
              phone: form.phone || undefined,
              industry: form.industry || undefined
            });

      setSession(session);
      setForm(initialForm);
    } catch (authError) {
      setError(readAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-brand-navy">
        <div className="grid place-items-center gap-5 rounded-2xl border border-blue-100 bg-white px-8 py-7 shadow-panel">
          <EnergyInsightLogo />
          <div className="flex items-center gap-3 text-sm font-bold text-brand-muted">
            <Loader2 className="animate-spin text-brand-blue" size={20} />
            Đang kiểm tra phiên đăng nhập...
          </div>
        </div>
      </main>
    );
  }

  if (accessToken && user) {
    return <>{children}</>;
  }

  return (
    <PortalAuthPage
      error={error}
      form={form}
      mode={mode}
      submitting={submitting}
      onFieldChange={updateForm}
      onModeChange={changeMode}
      onSubmit={submitAuth}
    />
  );
}

function readAuthError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: unknown; message?: unknown } } }).response;
    const detail = response?.data?.detail;
    const message = response?.data?.message;

    if (typeof message === "string") {
      return message;
    }
    if (typeof detail === "string") {
      return detail;
    }
  }

  return "Không thể xác thực tài khoản. Vui lòng thử lại.";
}
