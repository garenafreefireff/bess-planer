"use client";

import { LoaderCircle, RefreshCw, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminUsersApi,
  readAdminApiError,
  type AdminUserResponse,
  type AdminUserRole,
  type AdminUserStatus
} from "@/lib/api/admin.api";
import { cn } from "@/lib/utils";
import { AdminShell } from "./admin-pages";

export function AdminUsersApiPage() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AdminUserRole | "">("");
  const [status, setStatus] = useState<AdminUserStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await adminUsersApi.list({
        page: 1,
        page_size: 100,
        search: search.trim() || undefined,
        role,
        status
      });
      setUsers(page.items);
      setTotal(page.meta.total);
    } catch (loadError) {
      setError(readAdminApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, [role, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => ({
    active: users.filter((user) => user.status === "active").length,
    suspended: users.filter((user) => user.status === "suspended").length,
    admins: users.filter((user) => user.role === "admin").length
  }), [users]);

  const update = async (
    user: AdminUserResponse,
    payload: Partial<Pick<AdminUserResponse, "role" | "status">>
  ) => {
    setBusyId(user.id);
    setError("");
    try {
      const updated = await adminUsersApi.update(user.id, payload);
      setUsers((rows) => rows.map((row) => row.id === updated.id ? updated : row));
    } catch (updateError) {
      setError(readAdminApiError(updateError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <AdminShell
      activeItem="Quản lý người dùng"
      title="Quản lý người dùng"
      subtitle="Dữ liệu thật từ collection users; admin có thể lọc, đổi vai trò và khóa hoặc mở tài khoản."
      action={<Button variant="secondary" disabled={loading} onClick={() => void load()}><RefreshCw className={cn(loading && "animate-spin")} size={17} />Làm mới</Button>}
    >
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <Metric label="Tổng người dùng" value={total} icon={Users} />
        <Metric label="Đang hoạt động" value={summary.active} icon={UserCheck} tone="green" />
        <Metric label="Đang khóa" value={summary.suspended} icon={ShieldCheck} tone="red" />
        <Metric label="Quyền admin" value={summary.admins} icon={ShieldCheck} tone="blue" />
      </div>

      <Card className="rounded-xl bg-white p-4 shadow-panel">
        <form className="grid grid-cols-[minmax(260px,1fr)_200px_200px_auto] gap-3 max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
            <Input className="h-11 pl-10" placeholder="Tên, email, công ty, số điện thoại..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className="h-11 rounded-md border border-brand-line bg-white px-3 text-sm font-semibold" value={role} onChange={(event) => setRole(event.target.value as AdminUserRole | "")}>
            <option value="">Tất cả vai trò</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
          <select className="h-11 rounded-md border border-brand-line bg-white px-3 text-sm font-semibold" value={status} onChange={(event) => setStatus(event.target.value as AdminUserStatus | "")}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="suspended">Đã khóa</option>
          </select>
          <Button className="h-11" type="submit">Lọc</Button>
        </form>
        {error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      </Card>

      <Card className="overflow-hidden rounded-xl bg-white shadow-panel">
        {loading ? <div className="grid min-h-[360px] place-items-center"><LoaderCircle className="animate-spin text-brand-blue" size={36} /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-brand-muted">
                <tr><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Công ty</th><th className="px-4 py-3">Ngành</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr className="border-t border-brand-line" key={user.id}>
                    <td className="px-4 py-3"><strong className="block text-brand-navy">{user.representative_name}</strong><span className="text-xs font-medium text-brand-muted">{user.email}{user.phone ? ` · ${user.phone}` : ""}</span></td>
                    <td className="px-4 py-3 font-medium text-brand-navy">{user.company_name || "—"}</td>
                    <td className="px-4 py-3 font-medium text-brand-muted">{user.industry || "—"}</td>
                    <td className="px-4 py-3"><select className="h-9 rounded-md border border-brand-line bg-white px-2 text-xs font-bold" disabled={busyId === user.id} value={user.role} onChange={(event) => void update(user, { role: event.target.value as AdminUserRole })}><option value="customer">Customer</option><option value="admin">Admin</option></select></td>
                    <td className="px-4 py-3"><select className="h-9 rounded-md border border-brand-line bg-white px-2 text-xs font-bold" disabled={busyId === user.id} value={user.status} onChange={(event) => void update(user, { status: event.target.value as AdminUserStatus })}><option value="active">Hoạt động</option><option value="suspended">Đã khóa</option></select></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-brand-muted">{formatDateTime(user.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length ? <div className="grid min-h-[280px] place-items-center text-sm font-semibold text-brand-muted">Không có người dùng phù hợp.</div> : null}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}

function Metric({ label, value, icon: Icon, tone = "slate" }: { label: string; value: number; icon: typeof Users; tone?: "slate" | "blue" | "green" | "red" }) {
  const tones = { slate: "bg-slate-100 text-brand-navy", blue: "bg-blue-50 text-brand-blue", green: "bg-green-50 text-brand-green", red: "bg-red-50 text-red-600" };
  return <Card className="grid grid-cols-[48px_1fr] items-center gap-3 rounded-xl bg-white p-4 shadow-panel"><span className={cn("grid size-11 place-items-center rounded-full", tones[tone])}><Icon size={22} /></span><span><small className="block font-semibold text-brand-muted">{label}</small><strong className="mt-1 block text-2xl font-bold text-brand-navy">{value}</strong></span></Card>;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}
