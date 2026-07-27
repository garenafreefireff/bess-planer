"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";

const ADMIN_LOGIN_PATH = "/admin/login";

export function AdminAuthenticatedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const isLoginRoute = pathname === ADMIN_LOGIN_PATH;
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [checkingSession, setCheckingSession] = useState(!isLoginRoute);

  const loginUrl = useMemo(
    () => buildAdminLoginUrl(pathname, search),
    [pathname, search]
  );

  useEffect(() => {
    if (isLoginRoute) {
      setCheckingSession(false);
      return;
    }

    let mounted = true;

    const checkAdminSession = async () => {
      setCheckingSession(true);
      const storedSession = hydrateFromStorage();
      if (!storedSession.accessToken) {
        router.replace(`${loginUrl}&reason=missing`);
        if (mounted) setCheckingSession(false);
        return;
      }

      try {
        const currentUser = await authApi.me();
        if (!mounted) return;
        setUser(currentUser);
        if (currentUser.role !== "admin") {
          router.replace(`${loginUrl}&reason=forbidden`);
          return;
        }
      } catch {
        clearSession();
        router.replace(`${loginUrl}&reason=expired`);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    void checkAdminSession();

    return () => {
      mounted = false;
    };
  }, [clearSession, hydrateFromStorage, isLoginRoute, loginUrl, router, setUser]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (checkingSession || !accessToken || !user || user.role !== "admin") {
    return <AdminAuthLoading />;
  }

  return <>{children}</>;
}

function buildAdminLoginUrl(pathname: string, search: string): string {
  const nextPath = `${pathname}${search ? `?${search}` : ""}`;
  return `${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(nextPath)}`;
}

function AdminAuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 text-brand-navy">
      <div className="rounded-lg border border-brand-line bg-white px-6 py-5 shadow-panel">
        <div className="flex items-center gap-3 text-sm font-bold text-brand-muted">
          <span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-brand-blue">
            <ShieldCheck size={21} />
          </span>
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin text-brand-blue" size={18} />
            Đang kiểm tra quyền admin...
          </span>
        </div>
      </div>
    </main>
  );
}
