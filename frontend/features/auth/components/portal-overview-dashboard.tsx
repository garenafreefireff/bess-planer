"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Database,
  FileBarChart,
  FolderOpen,
  Gauge,
  Layers3,
  LoaderCircle,
  RefreshCw,
  ServerCog,
  Settings2,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { readWorkspaceApiError, type AnalysisRunResponse, type ProjectResponse } from "@/features/bess-planner/api/workspace.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/lib/utils";
import { loadPortalOverview, type PortalOverviewData } from "../api/portal-overview.api";

type ActivityRow = {
  id: string;
  title: string;
  detail: string;
  at: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "purple" | "orange" | "red";
};

const toneClasses = {
  blue: "bg-blue-50 text-brand-blue",
  green: "bg-green-50 text-brand-green",
  purple: "bg-violet-50 text-violet-700",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600"
};

export function PortalOverviewDashboard() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<PortalOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loadPortalOverview());
    } catch (loadError) {
      setError(readWorkspaceApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => buildSummary(data), [data]);

  return (
    <div className="py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold leading-tight text-brand-navy">Tổng quan Portal</h1>
          <p className="mt-2 text-[15px] font-medium text-brand-muted">
            Nền tảng phân tích & lập kế hoạch năng lượng toàn diện cho doanh nghiệp.
          </p>
          <p className="mt-1 text-xs font-semibold text-brand-muted">
            Dữ liệu được đồng bộ trực tiếp từ backend cho {user?.company_name || user?.email || "workspace hiện tại"}.
          </p>
        </div>
        <button
          className={buttonVariants({ variant: "secondary", className: "h-10" })}
          disabled={loading}
          onClick={() => void load()}
          type="button"
        >
          <RefreshCw className={cn(loading && "animate-spin")} size={17} />
          Làm mới dữ liệu
        </button>
      </div>

      {error ? (
        <Card className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-red-200 bg-red-50 p-4 shadow-none">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
            <div>
              <strong className="text-sm text-red-800">Không tải được dữ liệu tổng quan</strong>
              <p className="mt-1 text-xs font-medium text-red-700">{error}</p>
            </div>
          </div>
          <button className={buttonVariants({ variant: "secondary", size: "sm" })} onClick={() => void load()} type="button">
            Thử lại
          </button>
        </Card>
      ) : null}

      {loading && !data ? <OverviewLoading /> : null}

      {data ? (
        <div className="mt-6 grid grid-cols-[minmax(0,1.92fr)_minmax(330px,0.88fr)] gap-5 max-xl:grid-cols-1">
          <div className="grid min-w-0 content-start gap-5">
            <ApplicationsSection summary={summary} />
            <KpiGrid summary={summary} />
            <RecentProjects projects={summary.recentProjects} siteNames={summary.siteNames} />
          </div>

          <div className="grid content-start gap-5">
            <RecentActivity activities={summary.activities} />
            <WorkspaceHealth summary={summary} companyName={user?.company_name || "Workspace của bạn"} />
            <NextStepCard summary={summary} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApplicationsSection({ summary }: { summary: OverviewSummary }) {
  const plannerReady = summary.activeSites > 0 && summary.activeTariffs > 0 && summary.activeCatalog > 0;
  const cards = [
    {
      title: "Quick Sizing",
      description: "Ước tính nhanh công suất PV và BESS trước khi lập dự án chi tiết.",
      href: "/quick-sizing",
      action: "Mở ứng dụng",
      icon: Zap,
      tone: "blue" as const,
      meta: `${summary.quickSizingProjects} dự án`
    },
    {
      title: "BESS Planner",
      description: "Phân tích Oracle LP-PF, Pareto và SLSM trên dữ liệu vận hành thật.",
      href: plannerReady ? "/customer-portal/du-an-cua-toi" : "/customer-portal?section=data",
      action: plannerReady ? "Mở ứng dụng" : "Hoàn thiện cấu hình",
      icon: BatteryCharging,
      tone: "green" as const,
      meta: plannerReady ? `${summary.bessProjects} dự án` : "Thiếu Site, biểu giá hoặc BESS catalog"
    },
    {
      title: "Cấu hình hệ thống",
      description: "Quản lý Site, biểu giá và BESS catalog dùng cho các lần phân tích.",
      href: "/customer-portal?section=data",
      action: "Mở cấu hình",
      icon: Database,
      tone: "purple" as const,
      meta: `${summary.activeSites} site · ${summary.activeTariffs} biểu giá · ${summary.activeCatalog} catalog`
    }
  ];

  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Ứng dụng khả dụng</h2>
          <p className="mt-1 text-xs font-medium text-brand-muted">Trạng thái ứng dụng được xác định từ tài nguyên backend hiện có.</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", plannerReady ? "bg-green-50 text-brand-green" : "bg-amber-50 text-amber-700")}> 
          {plannerReady ? "Workspace sẵn sàng" : "Cần bổ sung cấu hình"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        {cards.map(({ action, description, href, icon: Icon, meta, title, tone }) => (
          <div
            className={cn(
              "flex min-h-[205px] flex-col rounded-xl border p-4",
              tone === "green"
                ? "border-green-100 bg-green-50/35"
                : tone === "purple"
                  ? "border-violet-100 bg-violet-50/35"
                  : "border-blue-100 bg-blue-50/35"
            )}
            key={title}
          >
            <div className="flex items-start gap-3">
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", toneClasses[tone])}>
                <Icon size={24} />
              </span>
              <div>
                <h3 className={cn("font-bold", tone === "green" ? "text-brand-green" : tone === "purple" ? "text-violet-700" : "text-brand-blue")}>{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">{description}</p>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <span className="mb-3 block text-xs font-bold text-brand-muted">{meta}</span>
              <Link
                className={cn(
                  "flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold",
                  tone === "green"
                    ? "bg-brand-green text-white"
                    : tone === "purple"
                      ? "border border-violet-200 bg-white text-violet-700"
                      : "bg-brand-blue text-white"
                )}
                href={href}
              >
                {action}<ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function KpiGrid({ summary }: { summary: OverviewSummary }) {
  const cards = [
    {
      label: "Tổng dự án",
      value: summary.totalProjects,
      detail: `${summary.activeProjects} đang hoạt động · ${summary.completedProjects} hoàn thành`,
      icon: FolderOpen,
      tone: "blue" as const
    },
    {
      label: "Kịch bản đã lưu",
      value: summary.savedScenarios,
      detail: `${summary.projectsWithScenarios} dự án có kịch bản`,
      icon: Layers3,
      tone: "green" as const
    },
    {
      label: "Tổng lượt phân tích",
      value: summary.totalAnalyses,
      detail: `${summary.runningAnalyses} đang chạy · ${summary.failedAnalyses} lỗi`,
      icon: Gauge,
      tone: "blue" as const
    },
    {
      label: "Phân tích hoàn thành",
      value: summary.completedAnalyses,
      detail: "Chỉ lưu cấu hình và kết quả, không lưu file đầu vào",
      icon: FileBarChart,
      tone: "purple" as const
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {cards.map(({ detail, icon: Icon, label, tone, value }) => (
        <Card className="grid min-h-[112px] grid-cols-[52px_1fr] items-center gap-4 rounded-xl bg-white p-4 shadow-panel" key={label}>
          <span className={cn("grid size-12 place-items-center rounded-full", toneClasses[tone])}><Icon size={25} /></span>
          <span>
            <span className="block text-sm font-medium text-brand-muted">{label}</span>
            <strong className="mt-1 block text-[29px] font-bold leading-none text-brand-navy">{value}</strong>
            <small className="mt-2 block font-semibold text-brand-muted">{detail}</small>
          </span>
        </Card>
      ))}
    </div>
  );
}

function RecentProjects({ projects, siteNames }: { projects: ProjectResponse[]; siteNames: Map<string, string> }) {
  return (
    <Card className="overflow-hidden rounded-xl bg-white shadow-panel">
      <div className="flex items-center justify-between gap-3 border-b border-brand-line px-4 py-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Dự án gần đây</h2>
          <p className="mt-1 text-xs font-medium text-brand-muted">Sắp xếp theo thời điểm cập nhật từ backend.</p>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue" href="/customer-portal/du-an-cua-toi">
          Xem tất cả dự án<ArrowRight size={17} />
        </Link>
      </div>

      {projects.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-brand-muted">
              <tr>
                <th className="px-4 py-3">Tên dự án</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Ứng dụng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr className="border-t border-brand-line" key={project.id}>
                  <td className="px-4 py-3 font-bold text-brand-navy">
                    <Link
                      className="hover:text-brand-blue"
                      href={project.project_type === "quick_sizing" ? "/quick-sizing/ket-qua" : `/customer-portal/du-an-cua-toi/ket-qua?projectId=${project.id}`}
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-muted">{siteNames.get(project.site_id) || `Site ${project.site_id.slice(-6)}`}</td>
                  <td className="px-4 py-3 font-semibold text-brand-navy">{project.project_type === "quick_sizing" ? "Quick Sizing" : "BESS Planner"}</td>
                  <td className="px-4 py-3"><ProjectStatus status={project.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-brand-muted">{formatDateTime(project.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyCard icon={FolderOpen} title="Chưa có dự án" description="Tạo dự án BESS Planner đầu tiên để bắt đầu phân tích." actionHref="/customer-portal/du-an-cua-toi/tao-du-an" actionLabel="Tạo dự án" />
      )}
    </Card>
  );
}

function RecentActivity({ activities }: { activities: ActivityRow[] }) {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Hoạt động gần đây</h2>
          <p className="mt-1 text-xs font-medium text-brand-muted">Tổng hợp từ dự án và các analysis run đã lưu.</p>
        </div>
        <Activity className="text-brand-blue" size={20} />
      </div>
      {activities.length ? (
        <div className="mt-5 grid gap-4">
          {activities.map(({ at, detail, icon: Icon, id, title, tone }) => (
            <div className="grid grid-cols-[40px_1fr] gap-3" key={id}>
              <span className={cn("grid size-10 place-items-center rounded-full", toneClasses[tone])}><Icon size={19} /></span>
              <div className="min-w-0">
                <strong className="block text-sm font-bold text-brand-navy">{title}</strong>
                <p className="mt-1 truncate text-xs font-medium text-brand-muted" title={detail}>{detail}</p>
                <time className="mt-1 block text-[11px] font-semibold text-brand-muted">{formatDateTime(at)}</time>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
          <Activity className="mx-auto text-brand-muted" size={32} />
          <p className="mt-2 text-sm font-semibold text-brand-muted">Chưa phát sinh hoạt động.</p>
        </div>
      )}
    </Card>
  );
}

function WorkspaceHealth({ summary, companyName }: { summary: OverviewSummary; companyName: string }) {
  const checks = [
    { label: "Site hoạt động", value: `${summary.activeSites}/${summary.totalSites}`, ok: summary.activeSites > 0 },
    { label: "Biểu giá hoạt động", value: `${summary.activeTariffs}/${summary.totalTariffs}`, ok: summary.activeTariffs > 0 },
    { label: "BESS catalog hoạt động", value: `${summary.activeCatalog}/${summary.totalCatalog}`, ok: summary.activeCatalog > 0 }
  ];
  const readyCount = checks.filter((item) => item.ok).length;
  const readinessPct = Math.round((readyCount / checks.length) * 100);

  return (
    <Card className="rounded-xl border-green-100 bg-gradient-to-br from-green-50/70 to-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-brand-green">Tình trạng workspace</span>
          <h2 className="mt-1 text-lg font-bold text-brand-navy">{companyName}</h2>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", readinessPct === 100 ? "bg-green-100 text-brand-green" : "bg-amber-50 text-amber-700")}>{readinessPct}% sẵn sàng</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${readinessPct}%` }} /></div>
      <div className="mt-4 grid gap-2">
        {checks.map((item) => (
          <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-sm" key={item.label}>
            <span className="flex items-center gap-2 font-semibold text-brand-muted">
              {item.ok ? <CheckCircle2 className="text-brand-green" size={17} /> : <AlertTriangle className="text-amber-600" size={17} />}
              {item.label}
            </span>
            <strong className="text-brand-navy">{item.value}</strong>
          </div>
        ))}
      </div>
      <Link className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-4 w-full" })} href="/customer-portal?section=data">
        <Settings2 size={16} />Quản lý tài nguyên
      </Link>
    </Card>
  );
}

function NextStepCard({ summary }: { summary: OverviewSummary }) {
  const next = getNextStep(summary);
  const Icon = next.icon;
  return (
    <Card className="rounded-xl border-blue-100 bg-blue-50/45 p-4 shadow-panel">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-brand-blue"><Icon size={23} /></span>
        <div>
          <h2 className="font-bold text-brand-navy">Bước tiếp theo</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">{next.description}</p>
        </div>
      </div>
      <Link className={buttonVariants({ className: "mt-4 w-full" })} href={next.href}>{next.action}<ArrowRight size={16} /></Link>
    </Card>
  );
}

function OverviewLoading() {
  return (
    <div className="mt-6 grid min-h-[420px] place-items-center rounded-xl border border-brand-line bg-white shadow-panel">
      <div className="text-center">
        <LoaderCircle className="mx-auto animate-spin text-brand-blue" size={40} />
        <h2 className="mt-4 font-bold text-brand-navy">Đang tổng hợp dữ liệu workspace</h2>
        <p className="mt-1 text-sm font-medium text-brand-muted">Đang đọc dự án, cấu hình và analysis run từ backend.</p>
      </div>
    </div>
  );
}

function EmptyCard({ actionHref, actionLabel, description, icon: Icon, title }: { actionHref: string; actionLabel: string; description: string; icon: LucideIcon; title: string }) {
  return (
    <div className="grid min-h-[260px] place-items-center p-8 text-center">
      <div>
        <Icon className="mx-auto text-brand-muted" size={42} />
        <h3 className="mt-3 text-lg font-bold text-brand-navy">{title}</h3>
        <p className="mt-1 text-sm font-medium text-brand-muted">{description}</p>
        <Link className={buttonVariants({ size: "sm", className: "mt-4" })} href={actionHref}>{actionLabel}</Link>
      </div>
    </div>
  );
}

function ProjectStatus({ status }: { status: ProjectResponse["status"] }) {
  const labels: Record<ProjectResponse["status"], string> = {
    draft: "Bản nháp",
    active: "Đang hoạt động",
    completed: "Hoàn thành",
    archived: "Đã lưu trữ"
  };
  const style = status === "completed" ? "bg-green-50 text-brand-green" : status === "active" ? "bg-blue-50 text-brand-blue" : status === "archived" ? "bg-slate-100 text-brand-muted" : "bg-amber-50 text-amber-700";
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", style)}>{labels[status]}</span>;
}

type OverviewSummary = ReturnType<typeof buildSummary>;

function buildSummary(data: PortalOverviewData | null) {
  const projects = data?.projects ?? [];
  const analyses = data?.analyses ?? [];
  const sites = data?.sites ?? [];
  const tariffs = data?.tariffs ?? [];
  const catalog = data?.bessCatalog ?? [];
  const siteNames = new Map(sites.map((site) => [site.id, site.name]));
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((item) => item.status === "active").length,
    completedProjects: projects.filter((item) => item.status === "completed").length,
    quickSizingProjects: projects.filter((item) => item.project_type === "quick_sizing").length,
    bessProjects: projects.filter((item) => item.project_type === "bess_planning").length,
    savedScenarios: projects.reduce((total, project) => total + project.scenarios.length, 0),
    projectsWithScenarios: projects.filter((project) => project.scenarios.length > 0).length,
    totalAnalyses: analyses.length,
    completedAnalyses: analyses.filter((item) => item.status === "completed").length,
    runningAnalyses: analyses.filter((item) => item.status === "running" || item.status === "queued").length,
    failedAnalyses: analyses.filter((item) => item.status === "failed").length,
    totalSites: sites.length,
    activeSites: sites.filter((item) => item.status === "active").length,
    totalTariffs: tariffs.length,
    activeTariffs: tariffs.filter((item) => item.status === "active").length,
    totalCatalog: catalog.length,
    activeCatalog: catalog.filter((item) => item.status === "active").length,
    siteNames,
    recentProjects: [...projects].sort((a, b) => dateValue(b.updated_at) - dateValue(a.updated_at)).slice(0, 7),
    activities: buildActivities(data, projectNames)
  };
}

function buildActivities(data: PortalOverviewData | null, projectNames: Map<string, string>): ActivityRow[] {
  if (!data) return [];

  const projectRows: ActivityRow[] = data.projects.map((project) => ({
    id: `project-${project.id}`,
    title: project.status === "completed" ? "Dự án đã hoàn thành" : project.status === "draft" ? "Dự án đang ở bản nháp" : "Dự án được cập nhật",
    detail: project.name,
    at: project.updated_at,
    icon: project.status === "completed" ? CheckCircle2 : FolderOpen,
    tone: project.status === "completed" ? "green" : "blue"
  }));

  const analysisRows: ActivityRow[] = data.analyses.map((analysis) => analysisActivity(analysis, projectNames));

  return [...projectRows, ...analysisRows]
    .sort((a, b) => dateValue(b.at) - dateValue(a.at))
    .slice(0, 6);
}

function analysisActivity(analysis: AnalysisRunResponse, projectNames: Map<string, string>): ActivityRow {
  const projectName = analysis.project_id ? projectNames.get(analysis.project_id) : null;
  const labels: Record<AnalysisRunResponse["status"], string> = {
    queued: "Phân tích đang chờ",
    running: "Phân tích đang chạy",
    completed: "Phân tích đã hoàn thành",
    failed: "Phân tích thất bại"
  };
  return {
    id: `analysis-${analysis.id || analysis.created_at}`,
    title: labels[analysis.status],
    detail: projectName || `${analysis.analysis_type} · ${analysis.engine_version}`,
    at: analysis.updated_at,
    icon: analysis.status === "completed" ? FileBarChart : analysis.status === "failed" ? AlertTriangle : Gauge,
    tone: analysis.status === "completed" ? "green" : analysis.status === "failed" ? "red" : "blue"
  };
}

function getNextStep(summary: OverviewSummary) {
  if (summary.activeSites === 0 || summary.activeTariffs === 0 || summary.activeCatalog === 0) {
    return {
      icon: ServerCog,
      description: "BESS Planner cần ít nhất một Site, một biểu giá và một BESS catalog đang hoạt động.",
      href: "/customer-portal?section=data",
      action: "Hoàn thiện cấu hình"
    };
  }
  if (summary.runningAnalyses > 0) {
    return {
      icon: LoaderCircle,
      description: `Có ${summary.runningAnalyses} analysis run đang chạy hoặc đang chờ xử lý.`,
      href: "/customer-portal/du-an-cua-toi",
      action: "Theo dõi dự án"
    };
  }
  if (summary.completedAnalyses === 0) {
    return {
      icon: Sparkles,
      description: "Tạo dự án, chọn file Load/PV và chạy Oracle. File đầu vào chỉ được xử lý tạm thời rồi tự xóa.",
      href: "/customer-portal/du-an-cua-toi/tao-du-an",
      action: "Tạo phân tích đầu tiên"
    };
  }
  return {
    icon: ShieldCheck,
    description: "Workspace đang hoạt động tốt. Anh có thể mở kết quả gần nhất hoặc tạo thêm kịch bản phân tích.",
    href: "/customer-portal/du-an-cua-toi",
    action: "Mở danh sách dự án"
  };
}

function dateValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}
