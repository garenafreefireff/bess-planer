"use client";

import Link from "next/link";
import {
  Archive,
  ArrowRight,
  BatteryCharging,
  FileBarChart,
  FolderOpen,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  projectsApi,
  readWorkspaceApiError,
  type ProjectResponse,
  type ProjectStatus
} from "../api/workspace.api";

type ProjectRow = {
  id: string;
  name: string;
  company: string;
  tool: "Sizing Lab" | "Quick Sizing";
  status: ProjectStatus | "local_draft";
  updated: string;
  source: "backend" | "local";
};

export function MyProjectsApiPage() {
  const [query, setQuery] = useState("");
  const [backendProjects, setBackendProjects] = useState<ProjectResponse[]>([]);
  const [draftProject, setDraftProject] = useState<ProjectRow | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await projectsApi.list({ page: 1, page_size: 100 });
      setBackendProjects(response.items);
      setTotal(response.meta.total);
    } catch (loadError) {
      setError(readWorkspaceApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();

    const raw = window.localStorage.getItem("energyinsight.bessPlanner.projectDraft.v1");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { project?: { name?: string; industry?: string } };
      if (draft.project?.name) {
        setDraftProject({
          id: "local-draft",
          name: draft.project.name,
          company: draft.project.industry || "Chưa xác định",
          tool: "Sizing Lab",
          status: "local_draft",
          updated: "Đã lưu trên trình duyệt",
          source: "local"
        });
      }
    } catch {
      window.localStorage.removeItem("energyinsight.bessPlanner.projectDraft.v1");
    }
  }, [loadProjects]);

  const rows = useMemo<ProjectRow[]>(() => {
    const remoteRows: ProjectRow[] = backendProjects.map((project) => ({
      id: project.id,
      name: project.name,
      company: readProjectCompany(project),
      tool: project.project_type === "quick_sizing" ? "Quick Sizing" : "Sizing Lab",
      status: project.status,
      updated: formatDateTime(project.updated_at),
      source: "backend" as const
    }));
    return draftProject ? [draftProject, ...remoteRows] : remoteRows;
  }, [backendProjects, draftProject]);

  const projects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? rows.filter((project) =>
          `${project.name} ${project.company} ${project.tool} ${formatProjectStatus(project.status)}`
            .toLowerCase()
            .includes(normalized)
        )
      : rows;
  }, [query, rows]);

  const updateStatus = async (project: ProjectRow, status: ProjectStatus) => {
    if (project.source !== "backend") return;
    setActionId(project.id);
    try {
      const updated = await projectsApi.update(project.id, { status });
      setBackendProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(status === "archived" ? "Đã lưu trữ dự án." : "Đã khôi phục dự án.");
    } catch (updateError) {
      toast.error(readWorkspaceApiError(updateError));
    } finally {
      setActionId(null);
    }
  };

  const removeProject = async (project: ProjectRow) => {
    if (project.source === "local") {
      if (!window.confirm("Xóa bản nháp BESS Planner đang lưu trên trình duyệt?")) return;
      window.localStorage.removeItem("energyinsight.bessPlanner.projectDraft.v1");
      setDraftProject(null);
      toast.success("Đã xóa bản nháp cục bộ.");
      return;
    }

    if (!window.confirm(`Xóa dự án “${project.name}” khỏi backend?`)) return;
    setActionId(project.id);
    try {
      await projectsApi.remove(project.id);
      setBackendProjects((current) => current.filter((item) => item.id !== project.id));
      setTotal((current) => Math.max(0, current - 1));
      toast.success("Đã xóa dự án.");
    } catch (removeError) {
      toast.error(readWorkspaceApiError(removeError));
    } finally {
      setActionId(null);
    }
  };

  return (
    <main className="w-full pb-8 pt-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold text-brand-navy">Dự án của tôi</h1>
          <p className="mt-2 text-sm font-medium text-brand-muted">
            Dữ liệu dự án được đọc trực tiếp từ API `/projects`; bản nháp chưa gửi backend vẫn được hiển thị riêng.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={buttonVariants({ variant: "secondary", className: "h-11" })}
            disabled={loading}
            onClick={() => void loadProjects()}
            type="button"
          >
            <RefreshCw className={cn(loading && "animate-spin")} size={18} />
            Làm mới
          </button>
          <Link className={buttonVariants({ className: "h-11" })} href="/customer-portal/du-an-cua-toi/tao-du-an">
            <Plus size={18} />
            Tạo dự án Sizing Lab
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <MetricCard label="Tổng dự án backend" value={String(total)} icon={FolderOpen} />
        <MetricCard
          label="Dự án BESS Planner"
          value={String(backendProjects.filter((item) => item.project_type === "bess_planning").length)}
          icon={BatteryCharging}
        />
        <MetricCard
          label="Đã hoàn thành"
          value={String(backendProjects.filter((item) => item.status === "completed").length)}
          icon={FileBarChart}
        />
      </div>

      {error ? (
        <Card className="mt-5 rounded-xl border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-none">
          Không tải được danh sách dự án: {error}
        </Card>
      ) : null}

      <Card className="mt-5 overflow-hidden rounded-xl bg-white shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line p-4">
          <h2 className="text-xl font-bold text-brand-navy">Danh sách dự án</h2>
          <label className="relative block w-[360px] max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
            <input
              className="h-10 w-full rounded-lg border border-brand-line pl-10 pr-4 text-sm outline-none focus:border-brand-blue"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên dự án, site, trạng thái..."
              value={query}
            />
          </label>
        </div>

        {loading ? (
          <div className="grid min-h-[260px] place-items-center p-8 text-center">
            <LoaderCircle className="animate-spin text-brand-blue" size={38} />
          </div>
        ) : projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-brand-muted">
                <tr>
                  <th className="px-4 py-3">Tên dự án</th>
                  <th className="px-4 py-3">Site / nguồn</th>
                  <th className="px-4 py-3">Công cụ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="w-[150px] px-3 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const busy = actionId === project.id;
                  const href =
                    project.source === "local"
                      ? "/customer-portal/du-an-cua-toi/tao-du-an"
                      : `/customer-portal/du-an-cua-toi/ket-qua?projectId=${project.id}`;

                  return (
                    <tr className="border-t border-brand-line" key={project.id}>
                      <td className="px-4 py-3 font-bold text-brand-navy">
                        <Link className="inline-flex items-center gap-3 hover:text-brand-blue" href={href}>
                          <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand-blue">
                            <FileBarChart size={17} />
                          </span>
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-brand-muted">{project.company}</td>
                      <td className="px-4 py-3 font-semibold text-brand-navy">{project.tool}</td>
                      <td className="px-4 py-3"><Status status={project.status} /></td>
                      <td className="px-4 py-3 font-medium text-brand-muted">{project.updated}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          {project.source === "backend" ? (
                            <button
                              aria-label={project.status === "archived" ? "Khôi phục dự án" : "Lưu trữ dự án"}
                              className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted hover:bg-blue-50 hover:text-brand-blue disabled:opacity-50"
                              disabled={busy}
                              onClick={() => void updateStatus(project, project.status === "archived" ? "active" : "archived")}
                              type="button"
                            >
                              <Archive size={17} />
                            </button>
                          ) : null}
                          <button
                            aria-label={`Xóa ${project.name}`}
                            className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            disabled={busy}
                            onClick={() => void removeProject(project)}
                            type="button"
                          >
                            {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[260px] place-items-center p-8 text-center">
            <div>
              <FolderOpen className="mx-auto text-brand-muted" size={44} />
              <h3 className="mt-3 text-lg font-bold text-brand-navy">Không tìm thấy dự án</h3>
              <p className="mt-1 text-sm font-medium text-brand-muted">Thử từ khóa khác hoặc tạo dự án mới trên backend.</p>
            </div>
          </div>
        )}

        <div className="flex justify-between border-t border-brand-line p-4">
          <span className="text-sm font-semibold text-brand-muted">
            {draftProject ? "Có 1 bản nháp cục bộ chưa đồng bộ." : "Không có bản nháp cục bộ."}
          </span>
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue" href="/customer-portal/du-an-cua-toi/tao-du-an">
            Tạo dự án mới
            <ArrowRight size={16} />
          </Link>
        </div>
      </Card>
    </main>
  );
}

function readProjectCompany(project: ProjectResponse) {
  const configuration = project.configuration;
  const company = configuration.companyName ?? configuration.industry ?? configuration.location;
  return typeof company === "string" && company.trim() ? company : `Site ${project.site_id.slice(-6)}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function formatProjectStatus(status: ProjectRow["status"]) {
  const labels: Record<ProjectRow["status"], string> = {
    local_draft: "Bản nháp cục bộ",
    draft: "Bản nháp",
    active: "Đang hoạt động",
    completed: "Hoàn thành",
    archived: "Đã lưu trữ"
  };
  return labels[status];
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Card className="grid grid-cols-[52px_1fr] items-center gap-4 rounded-xl p-4 shadow-panel">
      <span className="grid size-12 place-items-center rounded-full bg-blue-50 text-brand-blue"><Icon size={25} /></span>
      <span><small className="block text-sm font-medium text-brand-muted">{label}</small><strong className="mt-1 block text-2xl font-bold text-brand-navy">{value}</strong></span>
    </Card>
  );
}

function Status({ status }: { status: ProjectRow["status"] }) {
  const classes =
    status === "completed"
      ? "bg-green-50 text-brand-green"
      : status === "active"
        ? "bg-blue-50 text-brand-blue"
        : status === "archived"
          ? "bg-slate-100 text-brand-muted"
          : "bg-amber-50 text-amber-700";
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", classes)}>{formatProjectStatus(status)}</span>;
}
