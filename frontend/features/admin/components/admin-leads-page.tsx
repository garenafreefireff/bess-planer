"use client";

import {
  CheckCircle2,
  Filter,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  leadsApi,
  readLeadApiError,
  type LeadResponse,
  type LeadSource,
  type LeadStatus
} from "@/lib/api/leads.api";
import { cn } from "@/lib/utils";
import { AdminShell } from "./admin-pages";

const statuses: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "converted", "lost"];
const sources: LeadSource[] = ["quick_sizing", "contact_form", "registration"];

export function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "">("");
  const [selected, setSelected] = useState<LeadResponse | null>(null);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await leadsApi.listAdmin({
        page: 1,
        page_size: 100,
        status: statusFilter,
        source: sourceFilter,
        search: search.trim() || undefined
      });
      setLeads(page.items);
      setTotal(page.meta.total);
      setSelected((current) => current ? page.items.find((lead) => lead.id === current.id) ?? null : null);
    } catch (loadError) {
      setError(readLeadApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => ({
    newCount: leads.filter((lead) => lead.status === "new").length,
    qualifiedCount: leads.filter((lead) => lead.status === "qualified" || lead.status === "proposal").length,
    convertedCount: leads.filter((lead) => lead.status === "converted").length,
    quickSizingCount: leads.filter((lead) => lead.sources.includes("quick_sizing")).length
  }), [leads]);

  const updateLead = async (
    lead: LeadResponse,
    updates: Partial<Pick<LeadResponse, "status" | "assigned_to" | "admin_note" | "tags">>
  ) => {
    setBusyId(lead.id);
    setError("");
    try {
      const updated = await leadsApi.updateAdmin(lead.id, updates);
      setLeads((rows) => rows.map((row) => row.id === updated.id ? updated : row));
      setSelected((current) => current?.id === updated.id ? updated : current);
    } catch (updateError) {
      setError(readLeadApiError(updateError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <AdminShell
      activeItem="Lead khách hàng"
      title="Lead khách hàng"
      subtitle="Theo dõi lead từ Quick Sizing, form liên hệ và đăng ký tài khoản trong cùng một pipeline."
      action={<Button variant="secondary" disabled={loading} onClick={() => void load()}><RefreshCw className={cn(loading && "animate-spin")} size={17} />Làm mới</Button>}
    >
      <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <MetricCard icon={Users} label="Tổng lead" value={total} />
        <MetricCard icon={UserPlus} label="Lead mới" value={summary.newCount} tone="blue" />
        <MetricCard icon={Filter} label="Từ Quick Sizing" value={summary.quickSizingCount} tone="purple" />
        <MetricCard icon={UserCheck} label="Đang qualify" value={summary.qualifiedCount} tone="orange" />
        <MetricCard icon={CheckCircle2} label="Đã chuyển đổi" value={summary.convertedCount} tone="green" />
      </div>

      <Card className="rounded-xl bg-white p-4 shadow-panel">
        <form className="grid grid-cols-[minmax(260px,1fr)_220px_220px_auto] gap-3 max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
            <Input className="h-11 pl-10" placeholder="Tìm tên, email, công ty, số điện thoại..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className="h-11 rounded-md border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as LeadSource | "")}>
            <option value="">Tất cả nguồn</option>
            {sources.map((source) => <option key={source} value={source}>{sourceLabel(source)}</option>)}
          </select>
          <select className="h-11 rounded-md border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "")}>
            <option value="">Tất cả trạng thái</option>
            {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <Button className="h-11" type="submit"><Filter size={17} />Lọc lead</Button>
        </form>
        {error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4 max-2xl:grid-cols-1">
        <Card className="overflow-hidden rounded-xl bg-white shadow-panel">
          {loading ? (
            <div className="grid min-h-[360px] place-items-center"><LoaderCircle className="animate-spin text-brand-blue" size={36} /></div>
          ) : leads.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-sm">
                <thead className="bg-slate-50 text-left text-brand-muted">
                  <tr>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Liên hệ</th>
                    <th className="px-4 py-3">Nguồn</th>
                    <th className="px-4 py-3">Nhu cầu</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr className={cn("cursor-pointer border-t border-brand-line hover:bg-blue-50/40", selected?.id === lead.id && "bg-blue-50")} key={lead.id} onClick={() => setSelected(lead)}>
                      <td className="px-4 py-3"><strong className="block text-brand-navy">{lead.full_name || "Chưa có tên"}</strong><span className="mt-1 block text-xs font-medium text-brand-muted">{lead.company_name || lead.industry || "Chưa có công ty"}</span></td>
                      <td className="px-4 py-3"><span className="flex items-center gap-2 text-brand-navy"><Mail size={14} />{lead.email}</span><span className="mt-1 flex items-center gap-2 text-xs text-brand-muted"><Phone size={13} />{lead.phone || "Chưa có SĐT"}</span></td>
                      <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{lead.sources.map((source) => <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700" key={source}>{sourceLabel(source)}</span>)}</div></td>
                      <td className="max-w-[220px] px-4 py-3"><span className="line-clamp-2 font-medium text-brand-muted">{lead.interest || lead.message || "Chưa xác định"}</span></td>
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <select className="h-9 rounded-md border border-brand-line bg-white px-2 text-xs font-bold text-brand-navy" disabled={busyId === lead.id} value={lead.status} onChange={(event) => void updateLead(lead, { status: event.target.value as LeadStatus })}>
                          {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-brand-muted">{formatDateTime(lead.updated_at)}<span className="mt-1 block">{lead.touch_count} tương tác</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="grid min-h-[360px] place-items-center text-sm font-semibold text-brand-muted">Không có lead phù hợp bộ lọc.</div>}
        </Card>

        <LeadDetail lead={selected} busy={busyId === selected?.id} onSave={updateLead} />
      </div>
    </AdminShell>
  );
}

function LeadDetail({ lead, busy, onSave }: { lead: LeadResponse | null; busy: boolean; onSave: (lead: LeadResponse, updates: Partial<Pick<LeadResponse, "assigned_to" | "admin_note" | "tags">>) => Promise<void> }) {
  const [assignedTo, setAssignedTo] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    setAssignedTo(lead?.assigned_to ?? "");
    setNote(lead?.admin_note ?? "");
    setTags(lead?.tags.join(", ") ?? "");
  }, [lead]);

  if (!lead) return <Card className="rounded-xl bg-white p-5 text-center shadow-panel"><Users className="mx-auto text-brand-muted" size={34} /><p className="mt-3 text-sm font-semibold text-brand-muted">Chọn một lead để xem và cập nhật.</p></Card>;

  const quickInput = lead.latest_quick_sizing_input;
  const quickResult = lead.latest_quick_sizing_result;
  const quickCandidate = readQuickSizingCandidate(quickResult);

  return (
    <Card className="sticky top-24 rounded-xl bg-white p-5 shadow-panel max-2xl:static">
      <div className="flex items-start justify-between gap-3">
        <div><span className="text-xs font-bold uppercase tracking-wide text-brand-blue">Hồ sơ lead</span><h2 className="mt-1 text-xl font-bold text-brand-navy">{lead.full_name || lead.email}</h2></div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">{statusLabel(lead.status)}</span>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <InfoRow label="Email" value={lead.email} />
        <InfoRow label="Số điện thoại" value={lead.phone || "—"} />
        <InfoRow label="Công ty" value={lead.company_name || "—"} />
        <InfoRow label="Nguồn" value={lead.sources.map(sourceLabel).join(", ")} />
        <InfoRow label="Consent training" value={lead.training_consent ? "Có" : "Không"} />
        <InfoRow label="Mã Quick Sizing" value={lead.result_code || "—"} />
      </div>

      {quickInput || quickResult ? <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50 p-3 text-xs font-medium leading-5 text-brand-muted"><strong className="block text-violet-700">Có dữ liệu Quick Sizing</strong>{lead.training_consent ? "Đã lưu snapshot input/result và được phép dùng dữ liệu ẩn danh để cải thiện mô hình." : "Đã lưu snapshot input/result để tư vấn; không được đưa vào tập training khi chưa có consent."}</div> : null}

      {quickCandidate ? <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><QuickMetric label="Sizing" value={`${formatNumber(quickCandidate.power_kw)} kW / ${formatNumber(quickCandidate.energy_kwh)} kWh`} /><QuickMetric label="CAPEX" value={formatVnd(quickCandidate.capex_vnd)} /><QuickMetric label="NPV" value={formatVnd(quickCandidate.npv_vnd)} /><QuickMetric label="Payback" value={quickCandidate.payback_years === null ? "Chưa hoàn vốn" : `${formatNumber(quickCandidate.payback_years, 1)} năm`} /></div> : null}

      <div className="mt-5 grid gap-3">
        <label className="grid gap-1.5 text-sm font-bold text-brand-navy">Người phụ trách<Input value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Tên sales/kỹ sư" /></label>
        <label className="grid gap-1.5 text-sm font-bold text-brand-navy">Tags<Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="quick-sizing, ưu tiên..." /></label>
        <label className="grid gap-1.5 text-sm font-bold text-brand-navy">Ghi chú<textarea className="min-h-[110px] rounded-md border border-brand-line px-3 py-2 text-sm font-medium outline-none focus:border-brand-blue" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Lịch sử trao đổi, nhu cầu, bước tiếp theo..." /></label>
        <Button disabled={busy} onClick={() => void onSave(lead, { assigned_to: assignedTo || null, admin_note: note || null, tags: tags.split(",").map((item) => item.trim()).filter(Boolean) })}>{busy ? <LoaderCircle className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}Lưu cập nhật</Button>
      </div>
    </Card>
  );
}

function MetricCard({ icon: Icon, label, tone = "slate", value }: { icon: LucideIcon; label: string; tone?: "slate" | "blue" | "purple" | "orange" | "green"; value: number }) {
  const tones = { slate: "bg-slate-100 text-brand-navy", blue: "bg-blue-50 text-brand-blue", purple: "bg-violet-50 text-violet-700", orange: "bg-orange-50 text-orange-600", green: "bg-green-50 text-brand-green" };
  return <Card className="grid grid-cols-[48px_1fr] items-center gap-3 rounded-xl bg-white p-4 shadow-panel"><span className={cn("grid size-11 place-items-center rounded-full", tones[tone])}><Icon size={22} /></span><span><small className="block font-semibold text-brand-muted">{label}</small><strong className="mt-1 block text-2xl font-bold text-brand-navy">{value}</strong></span></Card>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2"><span className="font-semibold text-brand-muted">{label}</span><strong className="max-w-[220px] break-words text-right text-brand-navy">{value}</strong></div>;
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-2"><span className="block font-semibold text-brand-muted">{label}</span><strong className="mt-1 block text-brand-navy">{value}</strong></div>;
}

function readQuickSizingCandidate(result: Record<string, unknown> | null) {
  const candidate = result?.selected_candidate;
  if (!candidate || typeof candidate !== "object") return null;
  const values = candidate as Record<string, unknown>;
  const powerKw = numericValue(values.power_kw);
  const energyKwh = numericValue(values.energy_kwh);
  if (powerKw === null || energyKwh === null) return null;
  return {
    power_kw: powerKw,
    energy_kwh: energyKwh,
    capex_vnd: numericValue(values.capex_vnd),
    npv_vnd: numericValue(values.npv_vnd),
    payback_years: numericValue(values.payback_years)
  };
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatNumber(value: number | null, digits = 0) {
  return value === null ? "—" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
}

function formatVnd(value: number | null) {
  if (value === null) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 1)} tỷ VND`;
  if (Math.abs(value) >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)} triệu VND`;
  return `${formatNumber(value, 0)} VND`;
}

function sourceLabel(source: LeadSource) {
  return { quick_sizing: "Quick Sizing", contact_form: "Liên hệ", registration: "Đăng ký" }[source];
}

function statusLabel(status: LeadStatus) {
  return { new: "Mới", contacted: "Đã liên hệ", qualified: "Đủ điều kiện", proposal: "Đã gửi đề xuất", converted: "Đã chuyển đổi", lost: "Không thành công" }[status];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}
