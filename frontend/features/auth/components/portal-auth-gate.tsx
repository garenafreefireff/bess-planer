"use client";

import { BatteryCharging, Loader2, LogIn, UserPlus } from "lucide-react";
import { FormEvent, InputHTMLAttributes, ReactNode, useEffect, useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName: string;
  phone: string;
  industry: string;
}

const initialForm: AuthFormState = {
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
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<AuthFormState>(initialForm);
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

  const updateForm = (field: keyof AuthFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
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
      <main className="grid min-h-screen place-items-center bg-white text-brand-navy">
        <div className="flex items-center gap-3 text-sm font-bold text-brand-muted">
          <Loader2 className="animate-spin text-brand-blue" size={20} />
          Đang kiểm tra phiên đăng nhập...
        </div>
      </main>
    );
  }

  if (accessToken && user) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-brand-navy">
      <div className="mx-auto grid min-h-screen w-[min(1120px,calc(100%_-_40px))] grid-cols-[1fr_440px] items-center gap-10 py-10 max-lg:grid-cols-1">
        <section className="grid gap-8">
          <div>
            <span className="inline-flex items-center gap-3 text-2xl font-bold text-brand-green">
              <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-brand-blue">
                <BatteryCharging size={26} />
              </span>
              EnergyInsight
            </span>
            <h1 className="mt-8 max-w-[680px] text-[42px] font-bold leading-tight text-brand-navy max-sm:text-[32px]">
              Đăng nhập để quản lý dự án BESS và dữ liệu phân tích.
            </h1>
            <p className="mt-4 max-w-[640px] text-base font-medium leading-7 text-brand-muted">
              Tài khoản portal đồng bộ với backend FastAPI, sử dụng access token cho các request đã xác thực.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            {[
              ["Dự án", "Lưu và mở lại kịch bản"],
              ["Dữ liệu", "Quản lý file phụ tải"],
              ["Báo cáo", "Theo dõi kết quả"]
            ].map(([title, detail]) => (
              <Card className="rounded-lg border-blue-100 bg-white p-4 shadow-panel" key={title}>
                <strong className="block text-sm font-bold text-brand-blue">{title}</strong>
                <span className="mt-2 block text-sm font-medium leading-6 text-brand-muted">{detail}</span>
              </Card>
            ))}
          </div>
        </section>

        <Card className="rounded-xl bg-white p-5 shadow-panel">
          <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            <button
              className={cn(
                "h-10 rounded-md text-sm font-bold transition",
                mode === "login" ? "bg-white text-brand-blue shadow-sm" : "text-brand-muted"
              )}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              type="button"
            >
              Đăng nhập
            </button>
            <button
              className={cn(
                "h-10 rounded-md text-sm font-bold transition",
                mode === "register" ? "bg-white text-brand-blue shadow-sm" : "text-brand-muted"
              )}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              type="button"
            >
              Tạo tài khoản
            </button>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={submitAuth}>
            {mode === "register" ? (
              <AuthField
                autoComplete="name"
                label="Họ và tên"
                onChange={(value) => updateForm("fullName", value)}
                required
                value={form.fullName}
              />
            ) : null}
            <AuthField
              autoComplete="email"
              label="Email"
              onChange={(value) => updateForm("email", value)}
              required
              type="email"
              value={form.email}
            />
            {mode === "register" ? (
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <AuthField
                  autoComplete="organization"
                  label="Công ty"
                  onChange={(value) => updateForm("companyName", value)}
                  value={form.companyName}
                />
                <AuthField
                  label="Ngành"
                  onChange={(value) => updateForm("industry", value)}
                  value={form.industry}
                />
              </div>
            ) : null}
            {mode === "register" ? (
              <AuthField
                autoComplete="tel"
                label="Số điện thoại"
                onChange={(value) => updateForm("phone", value)}
                value={form.phone}
              />
            ) : null}
            <AuthField
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              label="Mật khẩu"
              minLength={mode === "register" ? 8 : undefined}
              onChange={(value) => updateForm("password", value)}
              required
              type="password"
              value={form.password}
            />
            {mode === "register" ? (
              <AuthField
                autoComplete="new-password"
                label="Xác nhận mật khẩu"
                minLength={8}
                onChange={(value) => updateForm("confirmPassword", value)}
                required
                type="password"
                value={form.confirmPassword}
              />
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}

            <Button className="h-11 bg-brand-blue text-white hover:bg-brand-blue/90" disabled={submitting} type="submit">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
              {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

function AuthField({
  label,
  onChange,
  value,
  ...inputProps
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="grid gap-2 text-sm font-bold text-brand-navy">
      {label}
      <Input
        className="h-11 rounded-lg border-brand-line text-sm font-medium focus-visible:ring-brand-blue/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...inputProps}
      />
    </label>
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
