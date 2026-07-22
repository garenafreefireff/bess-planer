"use client";

import Link from "next/link";
import { ArrowRight, BatteryCharging, FileBarChart, FolderOpen, MoreVertical, Plus, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectRow = {
  name: string;
  company: string;
  tool: "BESS Planner" | "Quick Sizing";
  status: "Bản nháp" | "Đang phân tích" | "Hoàn thành";
  updated: string;
};

const sampleProjects: ProjectRow[] = [
  { name: "Nhà máy May Bình An - GĐ2", company: "Bình An Textile Co., Ltd.", tool: "BESS Planner", status: "Đang phân tích", updated: "14/05/2026 09:30" },
  { name: "Kho lạnh Lâm Đồng", company: "Green Cold Storage", tool: "Quick Sizing", status: "Hoàn thành", updated: "13/05/2026 16:45" },
  { name: "Nhà máy thực phẩm Hưng Phát", company: "Hưng Phát Foods", tool: "BESS Planner", status: "Hoàn thành", updated: "13/05/2026 10:12" }
];

export function MyProjectsPage() {
  const [query, setQuery] = useState("");
  const [draftProject, setDraftProject] = useState<ProjectRow | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("energyinsight.bessPlanner.projectDraft.v1");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { project?: { name?: string; industry?: string } };
      if (draft.project?.name) {
        setDraftProject({
          name: draft.project.name,
          company: draft.project.industry || "Chưa xác định",
          tool: "BESS Planner",
          status: "Bản nháp",
          updated: "Đã lưu trên trình duyệt"
        });
      }
    } catch {
      window.localStorage.removeItem("energyinsight.bessPlanner.projectDraft.v1");
    }
  }, []);

  const projects = useMemo(() => {
    const all = draftProject ? [draftProject, ...sampleProjects] : sampleProjects;
    const normalized = query.trim().toLowerCase();
    return normalized ? all.filter((project) => `${project.name} ${project.company} ${project.tool} ${project.status}`.toLowerCase().includes(normalized)) : all;
  }, [draftProject, query]);

  return (
    <main className="w-full pb-8 pt-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold text-brand-navy">Dự án của tôi</h1>
          <p className="mt-2 text-sm font-medium text-brand-muted">Quản lý bản nháp Quick Sizing và các dự án BESS Planner trong cùng một nơi.</p>
        </div>
        <Link className={buttonVariants({ className: "h-11" })} href="/customer-portal/du-an-cua-toi/tao-du-an"><Plus size={18} />Tạo dự án BESS Planner</Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <MetricCard label="Tổng dự án hiển thị" value={String(projects.length)} icon={FolderOpen} />
        <MetricCard label="Dự án BESS Planner" value={String(projects.filter((item) => item.tool === "BESS Planner").length)} icon={BatteryCharging} />
        <MetricCard label="Đã hoàn thành" value={String(projects.filter((item) => item.status === "Hoàn thành").length)} icon={FileBarChart} />
      </div>

      <Card className="mt-5 overflow-hidden rounded-xl bg-white shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line p-4">
          <h2 className="text-xl font-bold text-brand-navy">Danh sách dự án</h2>
          <label className="relative block w-[360px] max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
            <input className="h-10 w-full rounded-lg border border-brand-line pl-10 pr-4 text-sm outline-none focus:border-brand-blue" onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên dự án, công ty, trạng thái..." value={query} />
          </label>
        </div>
        {projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-brand-muted"><tr><th className="px-4 py-3">Tên dự án</th><th className="px-4 py-3">Công ty / Ngành</th><th className="px-4 py-3">Công cụ</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th><th className="w-12 px-3 py-3" /></tr></thead>
              <tbody>{projects.map((project, index) => <tr className="border-t border-brand-line" key={`${project.name}-${index}`}><td className="px-4 py-3 font-bold text-brand-navy"><Link className="inline-flex items-center gap-3 hover:text-brand-blue" href={project.status === "Bản nháp" ? "/customer-portal/du-an-cua-toi/tao-du-an" : "/customer-portal/du-an-cua-toi/ket-qua"}><span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand-blue"><FileBarChart size={17} /></span>{project.name}</Link></td><td className="px-4 py-3 font-medium text-brand-muted">{project.company}</td><td className="px-4 py-3 font-semibold text-brand-navy">{project.tool}</td><td className="px-4 py-3"><Status status={project.status} /></td><td className="px-4 py-3 font-medium text-brand-muted">{project.updated}</td><td className="px-3 py-3"><button aria-label={`Thao tác ${project.name}`} className="text-brand-muted" type="button"><MoreVertical size={18} /></button></td></tr>)}</tbody>
            </table>
          </div>
        ) : <div className="grid min-h-[260px] place-items-center p-8 text-center"><div><FolderOpen className="mx-auto text-brand-muted" size={44} /><h3 className="mt-3 text-lg font-bold text-brand-navy">Không tìm thấy dự án</h3><p className="mt-1 text-sm font-medium text-brand-muted">Thử từ khóa khác hoặc tạo dự án mới.</p></div></div>}
        <div className="flex justify-end border-t border-brand-line p-4"><Link className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue" href="/customer-portal/du-an-cua-toi/tao-du-an">Tạo dự án mới<ArrowRight size={16} /></Link></div>
      </Card>
    </main>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return <Card className="grid grid-cols-[52px_1fr] items-center gap-4 rounded-xl p-4 shadow-panel"><span className="grid size-12 place-items-center rounded-full bg-blue-50 text-brand-blue"><Icon size={25} /></span><span><small className="block text-sm font-medium text-brand-muted">{label}</small><strong className="mt-1 block text-2xl font-bold text-brand-navy">{value}</strong></span></Card>;
}

function Status({ status }: { status: ProjectRow["status"] }) {
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", status === "Hoàn thành" ? "bg-green-50 text-brand-green" : status === "Đang phân tích" ? "bg-blue-50 text-brand-blue" : "bg-amber-50 text-amber-700")}>{status}</span>;
}
