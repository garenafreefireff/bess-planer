"use client";

import { CheckCircle2, Folder, LoaderCircle, RefreshCw, Search, UserRound, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminProjectsApi,
  adminUsersApi,
  readAdminApiError,
  type AdminProjectResponse,
  type AdminProjectStatus,
  type AdminProjectType,
  type AdminUserResponse
} from "@/lib/api/admin.api";
import { cn } from "@/lib/utils";
import { AdminShell } from "./admin-pages";

export function AdminProjectsApiPage() {
  const [projects, setProjects] = useState<AdminProjectResponse[]>([]);
  const [owners, setOwners] = useState<Map<string, AdminUserResponse>>(new Map());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [projectType, setProjectType] = useState<AdminProjectType | "">("");
  const [status, setStatus] = useState<AdminProjectStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectPage, userPage] = await Promise.all([
        adminProjectsApi.list({ page: 1, page_size: 100, search: search.trim() || undefined, type: projectType, status }),
        adminUsersApi.list({ page: 1, page_size: 100 })
      ]);
      setProjects(projectPage.items);
      setTotal(projectPage.meta.total);
      setOwners(new Map(userPage.items.map((user) => [user.id, user])));
    } catch (loadError) {
      setError(readAdminApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, [projectType, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => ({
    active: projects.filter((project) => project.status === "active").length,
    completed: projects.filter((project) => project.status === "completed").length,
    planner: projects.filter((project) => project.project_type === "bess_planning").length
  }), [projects]);

  const updateStatus = async (project: AdminProjectResponse, nextStatus: AdminProjectStatus) => {
    setBusyId(project.id);
    setError("");
    try {
      const updated = await adminProjectsApi.update(project.id, { status: nextStatus });
      setProjects((rows) => rows.map((row) => row.id === updated.id ? updated : row));
    } catch (updateError) {
      setError(readAdminApiError(updateError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <AdminShell
      activeItem="Dự án của người dùng"
      title="Dự án của người dùng"
      subtitle="Theo dõi dự án khách hàng, chủ sở hữu, loại công cụ và trạng thái xử lý."
      action={<Button variant="secondary" disabled={loading} onClick={() => void load()}><RefreshCw className={cn(loading && "animate-spin")} size={17} />Làm mới</Button>}
    >
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <Metric label="Tổng dự án" value={total} icon={Folder} />
        <Metric label="Đang hoạt động" value={summary.active} icon={Zap} tone="blue" />
        <Metric label="Hoàn thành" value={summary.completed} icon={CheckCircle2} tone="green" />
        <Metric label="BESS Planner" value={summary.planner} icon={Folder} tone="purple" />
      </div>

      <Card className="rounded-xl bg-white p-4 shadow-panel">
        <form className="grid grid-cols-[minmax(260px,1fr)_220px_220px_auto] gap-3 max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
            <Input className="h-11 pl-10" placeholder="Tên dự án, địa điểm, ngành..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className="h-11 rounded-md border border-brand-line bg-white px-3 text-sm font-semibold" value={projectType} onChange={(event) => setProjectType(event.target.value as AdminProjectType | "")}>
            <option value="">Tất cả công cụ</option>
            <option value="quick_sizing">Quick Sizing</option>
            <option value="bess_planning">BESS Planner</option>
          </select>
          <select className="h-11 rounded-md border border-brand-line bg-white px-3 text-sm font-semibold" value={status} onChange={(event) => setStatus(event.target.value as AdminProjectStatus | "")}>
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="active">Hoạt động</option>
            <option value="completed">Hoàn thành</option>
            <option value="archived">Lưu trữ</option>
          </select>
          <Button className="h-11" type="submit">Lọc</Button>
        </form>
        {error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      </Card>

      <Card className="overflow-hidden rounded-xl bg-white shadow-panel">
        {loading ? <div className="grid min-h-[360px] place-items-center"><LoaderCircle className="animate-spin text-brand-blue" size={36} /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-brand-muted">
                <tr><th className="px-4 py-3">Dự án</th><th className="px-4 py-3">Chủ sở hữu</th><th className="px-4 py-3">Công cụ</th><th className="px-4 py-3">Quy mô tham chiếu</th><th className="px-4 py-3">Kịch bản</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th></tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const owner = owners.get(project.user_id);
                  return (
                    <tr className="border-t border-brand-line" key={project.id}>
                      <td className="px-4 py-3"><strong className="block text-brand-navy">{project.name}</strong><span className="text-xs font-medium text-brand-muted">{stringValue(project.configuration.location) || project.id}</span></td>
                      <td className="px-4 py-3"><span className="flex items-center gap-2 font-semibold text-brand-navy"><UserRound size={15} />{owner?.representative_name || project.user_id}</span><span className="mt-1 block text-xs text-brand-muted">{owner?.company_name || owner?.email || "Không tìm thấy owner"}</span></td>
                      <td className="px-4 py-3"><span className={cn("rounded-full px-3 py-1 text-xs font-bold", project.project_type === "bess_planning" ? "bg-green-50 text-brand-green" : "bg-violet-50 text-violet-700")}>{project.project_type === "bess_planning" ? "BESS Planner" : "Quick Sizing"}</span></td>
                      <td className="px-4 py-3 font-medium text-brand-navy">{formatSizing(project.configuration)}</td>
                      <td className="px-4 py-3 font-medium text-brand-muted">{project.scenarios.length}</td>
                      <td className="px-4 py-3"><select className="h-9 rounded-md border border-brand-line bg-white px-2 text-xs font-bold" disabled={busyId === project.id} value={project.status} onChange={(event) => void updateStatus(project, event.target.value as AdminProjectStatus)}><option value="draft">Bản nháp</option><option value="active">Hoạt động</option><option value="completed">Hoàn thành</option><option value="archived">Lưu trữ</option></select></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-brand-muted">{formatDateTime(project.updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!projects.length ? <div className="grid min-h-[280px] place-items-center text-sm font-semibold text-brand-muted">Không có dự án phù hợp.</div> : null}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}

function Metric({ label, value, icon: Icon, tone = "slate" }: { label: string; value: number; icon: typeof Folder; tone?: "slate" | "blue" | "green" | "purple" }) {
  const tones = { slate: "bg-slate-100 text-brand-navy", blue: "bg-blue-50 text-brand-blue", green: "bg-green-50 text-brand-green", purple: "bg-violet-50 text-violet-700" };
  return <Card className="grid grid-cols-[48px_1fr] items-center gap-3 rounded-xl bg-white p-4 shadow-panel"><span className={cn("grid size-11 place-items-center rounded-full", tones[tone])}><Icon size={22} /></span><span><small className="block font-semibold text-brand-muted">{label}</small><strong className="mt-1 block text-2xl font-bold text-brand-navy">{value}</strong></span></Card>;
}

function formatSizing(configuration: Record<string, unknown>) {
  const power = numericValue(configuration.powerKw);
  const energy = numericValue(configuration.energyKwh);
  return power !== null && energy !== null ? `${formatNumber(power)} kW / ${formatNumber(energy)} kWh` : "—";
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}
