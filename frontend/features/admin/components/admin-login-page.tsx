"use client";

import { AlertTriangle, BatteryCharging, Loader2, LockKeyhole, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authApi, readAuthApiError } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const nextPath = useMemo(
    () => getSafeAdminNext(searchParams.get("next")),
    [searchParams]
  );
  const reasonMessage = getReasonMessage(searchParams.get("reason"));

  useEffect(() => {
    let mounted = true;

    const checkStoredSession = async () => {
      const storedSession = hydrateFromStorage();
      if (!storedSession.accessToken) {
        if (mounted) setCheckingSession(false);
        return;
      }

      try {
        const currentUser = await authApi.me();
        if (!mounted) return;
        setUser(currentUser);
        if (currentUser.role === "admin") {
          router.replace(nextPath);
          return;
        }
      } catch {
        clearSession();
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    void checkStoredSession();

    return () => {
      mounted = false;
    };
  }, [clearSession, hydrateFromStorage, nextPath, router, setUser]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const session = await authApi.loginAdmin({ email, password });
      setSession(session);
      router.replace(nextPath);
    } catch (loginError) {
      setError(readAuthApiError(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  const logoutCurrentSession = async () => {
    setLoggingOut(true);
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => undefined);
      }
    } finally {
      clearSession();
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-brand-navy">
      <div className="mx-auto grid min-h-screen w-[min(1120px,calc(100%_-_40px))] grid-cols-[1fr_430px] items-center gap-10 py-10 max-lg:grid-cols-1">
        <section className="grid gap-7">
          <div>
            <span className="inline-flex items-center gap-3 text-2xl font-bold text-brand-green">
              <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-brand-blue">
                <BatteryCharging size={26} />
              </span>
              Energy<span className="text-brand-blue">Insight</span>
            </span>
            <h1 className="mt-8 max-w-[680px] text-[42px] font-bold leading-tight text-brand-navy max-sm:text-[32px]">
              Đăng nhập Admin Portal
            </h1>
            <p className="mt-4 max-w-[620px] text-base font-medium leading-7 text-brand-muted">
              Khu vực quản trị dành cho nhân sự đã được cấp quyền. Tài khoản quản trị không được tạo từ biểu mẫu đăng ký dành cho khách hàng.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            {[
              ["Bảo vệ route", "Chặn truy cập /admin khi chưa đăng nhập"],
              ["Kiểm tra role", "Customer không thể vào trang quản trị"],
              ["Phiên đăng nhập", "Duy trì truy cập an toàn trong khu vực quản trị"]
            ].map(([title, detail]) => (
              <Card className="rounded-lg border-blue-100 bg-white p-4 shadow-panel" key={title}>
                <strong className="block text-sm font-bold text-brand-blue">{title}</strong>
                <span className="mt-2 block text-sm font-medium leading-6 text-brand-muted">{detail}</span>
              </Card>
            ))}
          </div>
        </section>

        <Card className="rounded-xl bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-blue-50 text-brand-blue">
              <ShieldCheck size={24} />
            </span>
            <span>
              <strong className="block text-lg text-brand-navy">Admin Login</strong>
              <small className="mt-1 block text-xs font-semibold text-brand-muted">EnergyInsight internal access</small>
            </span>
          </div>

          {checkingSession ? (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-brand-line bg-slate-50 px-4 py-3 text-sm font-bold text-brand-muted">
              <Loader2 className="animate-spin text-brand-blue" size={18} />
              Đang kiểm tra phiên đăng nhập...
            </div>
          ) : null}

          {!checkingSession && user?.role === "customer" ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              <div className="flex gap-2 font-bold">
                <AlertTriangle className="mt-0.5 shrink-0" size={17} />
                Tài khoản hiện tại không có quyền admin.
              </div>
              <p className="mt-2 font-medium">
                Bạn đang đăng nhập bằng {user.email}. Hãy sử dụng tài khoản đã được cấp quyền quản trị để tiếp tục.
              </p>
              <Button className="mt-3 h-10" disabled={loggingOut} onClick={logoutCurrentSession} type="button" variant="secondary">
                {loggingOut ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
                Đăng xuất tài khoản này
              </Button>
            </div>
          ) : null}

          {reasonMessage && user?.role !== "customer" ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
              {reasonMessage}
            </div>
          ) : null}

          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <label className="grid gap-2 text-sm font-bold text-brand-navy">
              Email admin
              <Input
                autoComplete="email"
                className="h-11 rounded-lg border-brand-line text-sm font-medium focus-visible:ring-brand-blue/20"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-brand-navy">
              Mật khẩu
              <Input
                autoComplete="current-password"
                className="h-11 rounded-lg border-brand-line text-sm font-medium focus-visible:ring-brand-blue/20"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                required
                type="password"
                value={password}
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}

            <Button className="h-11 bg-brand-blue text-white hover:bg-brand-blue/90" disabled={checkingSession || submitting} type="submit">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Đăng nhập admin
            </Button>

            <p className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-muted">
              <LockKeyhole className="text-brand-green" size={15} />
              Quyền quản trị được kiểm tra cho mọi thao tác trong hệ thống.
            </p>
          </form>
        </Card>
      </div>
    </main>
  );
}

function getSafeAdminNext(value: string | null): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("/admin/login") || value.startsWith("//")) {
    return "/admin";
  }
  return value;
}

function getReasonMessage(reason: string | null): string {
  if (reason === "forbidden") {
    return "Tài khoản hiện tại không có quyền truy cập Admin Portal.";
  }
  if (reason === "expired") {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản admin.";
  }
  if (reason === "missing") {
    return "Vui lòng đăng nhập bằng tài khoản admin để tiếp tục.";
  }
  return "";
}
