"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BatteryCharging,
  CheckCircle2,
  Clock3,
  FileDown,
  Gauge,
  LoaderCircle,
  Save,
  Sparkles,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sizingLabApi } from "../api/sizing-lab.api";
import { readWorkspaceApiError, type AnalysisRunResponse, type DatasetResponse, type ProjectResponse, type WorkspaceFileResponse } from "../api/workspace.api";
import { type SizingLabCandidate } from "../data/sizing-lab.types";
import { useSizingLab } from "../hooks/use-sizing-lab";
import { ProjectDataFilesPanel } from "./project-data-files-panel";

const tabs = [
  "Tổng quan",
  "Khuyến nghị",
  "Planning chi tiết",
  "So sánh chế độ",
  "Sizing theo tháng",
  "Dữ liệu đầu vào"
] as const;

type ResultTab = (typeof tabs)[number];

export function SizingLabResultPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const sizing = useSizingLab(projectId);
  const [activeTab, setActiveTab] = useState<ResultTab>("Tổng quan");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (sizing.result?.selected.id) setSelectedCandidateId(sizing.result.selected.id);
  }, [sizing.result?.selected.id]);

  const selectedCandidate = useMemo(() => {
    if (!sizing.result) return null;
    return sizing.result.candidates.find((item) => item.id === selectedCandidateId)
      ?? sizing.result.selected;
  }, [selectedCandidateId, sizing.result]);

  const applyCandidate = async () => {
    if (!selectedCandidate || !sizing.analysisRun?.id) return;
    setApplying(true);
    try {
      await sizingLabApi.applySelection(sizing.analysisRun.id, selectedCandidate.id);
      await sizing.reload();
      toast.success("Đã áp dụng phương án Sizing Lab và tạo kịch bản dự án.");
    } catch (error) {
      toast.error(readWorkspaceApiError(error));
    } finally {
      setApplying(false);
    }
  };

  if (!projectId) {
    return <EmptyState title="Thiếu mã dự án" description="Mở kết quả từ danh sách dự án hoặc sau khi hoàn thành wizard Sizing Lab." />;
  }

  if (sizing.loading) {
    return <LoadingState />;
  }

  if (sizing.error && !sizing.project) {
    return <EmptyState title="Không tải được Sizing Lab" description={sizing.error} />;
  }

  if (!sizing.result || !selectedCandidate) {
    return (
      <main className="w-full pb-12 pt-7">
        <ResultBreadcrumb projectName={sizing.project?.name} />
        <EmptyState
          title="Chưa có kết quả Sizing Lab"
          description={sizing.error || "Dự án đã có dữ liệu nhưng chưa chạy phân tích hoặc lần phân tích hiện tại chưa hợp lệ."}
          action={(
            <Link className={buttonVariants({ className: "mt-5" })} href="/customer-portal/du-an-cua-toi/tao-du-an">
              Tải file và chạy Sizing Lab
            </Link>
          )}
        />
      </main>
    );
  }

  const result = sizing.result;

  return (
    <main className="w-full pb-14 pt-7">
      <ResultBreadcrumb projectName={sizing.project?.name} />

      <section className="mt-4 flex items-start justify-between gap-5 max-lg:flex-col">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[30px] font-bold text-brand-navy">Sizing Lab</h1>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-brand-green">Hoàn thành</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">Phân tích tối ưu</span>
          </div>
          <p className="mt-2 text-sm font-medium text-brand-muted">
            {sizing.project?.name} · {result.summary.candidate_count} phương án · {result.summary.pareto_count} phương án Pareto
          </p>
          <p className="mt-1 text-xs font-semibold text-brand-muted">
            Mã lần phân tích: {sizing.analysisRun?.id ?? "—"} · Phiên bản tính toán {formatEngineVersion(sizing.analysisRun?.engine_version)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={buttonVariants({ variant: "secondary", size: "sm" })} onClick={() => window.print()} type="button">
            <FileDown size={16} />In / Lưu PDF
          </button>
          <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href="/customer-portal/du-an-cua-toi/tao-du-an">
            Chạy lại với file mới
          </Link>
          <button className={buttonVariants({ variant: "green", size: "sm" })} disabled={applying} onClick={() => void applyCandidate()} type="button">
            {applying ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
            Áp dụng phương án
          </button>
        </div>
      </section>

      {sizing.error ? <Notice tone="danger" text={sizing.error} /> : null}
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs font-medium leading-5 text-brand-muted">
        <strong className="block text-sm text-brand-blue">Thông số tính toán</strong>
        <span>
          {result.parity.billing_mode === "2tc" ? "Biểu giá hai thành phần" : "Biểu giá theo thời gian sử dụng"} · Cao điểm {formatNumber(result.parity.peak_price_vnd_per_kwh)} · Bình thường {formatNumber(result.parity.normal_price_vnd_per_kwh)} · Thấp điểm {formatNumber(result.parity.offpeak_price_vnd_per_kwh)} VND/kWh · Phí công suất {formatNumber(result.parity.demand_charge_vnd_per_kw_month)} VND/kW-tháng · Khung cao điểm {result.parity.peak_windows} · Khung thấp điểm {result.parity.offpeak_windows}
        </span>
        {result.parity.migrated_legacy_configuration ? <span className="mt-1 block font-bold text-amber-700">Dự án cũ đã được tự đồng bộ sang cấu hình EMS hiện tại khi chạy.</span> : null}
      </div>
      {result.warnings.length ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
            <div>
              <strong className="text-sm text-amber-900">Lưu ý về kết quả</strong>
              <div className="mt-1 grid gap-1 text-xs font-medium leading-5 text-amber-800">
                {result.warnings.map((warning) => <p key={warning}>• {warning}</p>)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="mt-5 flex overflow-x-auto border-b border-brand-line" aria-label="Kết quả Sizing Lab">
        {tabs.map((tab) => (
          <button
            className={cn(
              "relative h-11 min-w-[145px] whitespace-nowrap px-4 text-sm font-semibold text-brand-muted",
              activeTab === tab && "font-bold text-brand-blue after:absolute after:bottom-[-1px] after:left-0 after:h-[3px] after:w-full after:bg-brand-blue"
            )}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Tổng quan" ? <OverviewTab result={result} candidate={selectedCandidate} onOpenRecommendation={() => setActiveTab("Khuyến nghị")} /> : null}
      {activeTab === "Khuyến nghị" ? <RecommendationTab result={result} selectedCandidateId={selectedCandidate.id} onSelect={setSelectedCandidateId} /> : null}
      {activeTab === "Planning chi tiết" ? <PlanningTab result={result} candidate={result.selected} /> : null}
      {activeTab === "So sánh chế độ" ? <ComparisonTab result={result} /> : null}
      {activeTab === "Sizing theo tháng" ? <MonthlyTab result={result} /> : null}
      {activeTab === "Dữ liệu đầu vào" ? <InputTab result={result} project={sizing.project} datasets={sizing.datasets} files={sizing.files} analysisRun={sizing.analysisRun} history={sizing.history} /> : null}

      <div className="sticky bottom-4 z-10 mt-5 flex items-center justify-between gap-4 rounded-xl border border-brand-line bg-white/95 p-4 shadow-panel backdrop-blur max-md:flex-col max-md:items-stretch">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-brand-muted">Phương án đang chọn</span>
          <strong className="mt-1 block text-base text-brand-navy">
            {formatNumber(selectedCandidate.energy_kwh)} kWh / {formatNumber(selectedCandidate.power_kw)} kW · hoàn vốn {formatPayback(selectedCandidate.payback_years)}
          </strong>
        </div>
        <button className={buttonVariants({ variant: "green" })} disabled={applying} onClick={() => void applyCandidate()} type="button">
          {applying ? <LoaderCircle className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
          Dùng sizing này
        </button>
      </div>
    </main>
  );
}

function OverviewTab({ result, candidate, onOpenRecommendation }: { result: NonNullable<ReturnType<typeof useSizingLab>["result"]>; candidate: SizingLabCandidate; onOpenRecommendation: () => void }) {
  const kpis = [
    { label: "Dung lượng đề xuất", value: `${formatNumber(candidate.energy_kwh)} kWh`, sub: `${formatNumber(candidate.power_kw)} kW · ${candidate.c_rate.toFixed(2)}C`, icon: BatteryCharging },
    { label: "Tiết kiệm Oracle", value: formatMoney(candidate.annual_saving_vnd), sub: `Thực hiện dự kiến ${formatMoney(candidate.annual_saving_realized_vnd)}/năm`, icon: WalletCards },
    { label: `NPV ${result.summary.analysis_years} năm`, value: formatMoney(candidate.npv_vnd), sub: `ROI ${(candidate.roi * 100).toFixed(1)}%`, icon: BarChart3 },
    { label: "Thời gian hoàn vốn", value: formatPayback(candidate.payback_years), sub: `Tuổi thọ ${candidate.lifespan_years.toFixed(1)} năm`, icon: Clock3 },
    { label: "Pmax hợp đồng", value: `${formatNumber(candidate.contract_pmax_kw)} kW`, sub: `Giảm ${candidate.peak_reduction_pct.toFixed(1)}%`, icon: Gauge }
  ];
  return (
    <div className="mt-4 grid gap-4">
      <section className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
        {kpis.map(({ label, value, sub, icon: Icon }) => (
          <Card className="rounded-xl bg-white p-4 shadow-none" key={label}>
            <div className="flex items-start justify-between gap-3"><span className="text-xs font-bold text-brand-muted">{label}</span><Icon className="text-brand-blue" size={18} /></div>
            <strong className="mt-3 block text-xl text-brand-navy">{value}</strong>
            <small className="mt-1 block font-semibold text-brand-muted">{sub}</small>
          </Card>
        ))}
      </section>
      <section className="grid grid-cols-[1.15fr_0.85fr] gap-4 max-xl:grid-cols-1">
        <ParetoChart candidates={result.candidates} selectedCandidateId={candidate.id} onSelect={() => onOpenRecommendation()} compact />
        <Card className="rounded-xl border-green-100 bg-gradient-to-br from-green-50 to-white p-5 shadow-none">
          <div className="flex items-center gap-2 text-brand-green"><Sparkles size={20} /><h2 className="font-bold">Phương án khuyến nghị</h2></div>
          <strong className="mt-4 block text-3xl text-brand-navy">{formatNumber(candidate.energy_kwh)} kWh / {formatNumber(candidate.power_kw)} kW</strong>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Metric label="CAPEX" value={formatMoney(candidate.capex_vnd)} />
            <Metric label="Saving/năm" value={formatMoney(candidate.annual_saving_vnd)} />
            <Metric label="Pmax sau BESS" value={`${formatNumber(candidate.pmax_kw)} kW`} />
            <Metric label="EFC/ngày" value={candidate.efc_per_day.toFixed(2)} />
          </div>
          <div className="mt-4 rounded-lg border border-green-100 bg-white p-3 text-xs font-medium leading-5 text-brand-muted">
            Nằm trên Pareto front tiết kiệm × ROI và được SLSM chọn tại điểm cân bằng lợi ích người dùng–nhà đầu tư.
          </div>
          <button className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-4" })} onClick={onOpenRecommendation} type="button">Xem toàn bộ phương án</button>
        </Card>
      </section>
    </div>
  );
}

function RecommendationTab({ result, selectedCandidateId, onSelect }: { result: NonNullable<ReturnType<typeof useSizingLab>["result"]>; selectedCandidateId: string; onSelect: (id: string) => void }) {
  const selected = result.candidates.find((item) => item.id === selectedCandidateId) ?? result.selected;
  return (
    <div className="mt-4 grid gap-4">
      <ParetoChart candidates={result.candidates} selectedCandidateId={selectedCandidateId} onSelect={onSelect} />
      <section className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
        <Card className="overflow-hidden rounded-xl bg-white shadow-none">
          <div className="border-b border-brand-line p-4"><h2 className="font-bold text-brand-navy">Danh sách phương án</h2><p className="mt-1 text-xs font-medium text-brand-muted">Chọn một dòng để xem chi tiết và áp dụng.</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-xs">
              <thead className="bg-slate-50 text-brand-muted"><tr>{["Phương án", "CAPEX", "Saving/năm", "NPV", "Payback", "Pmax", "Giảm đỉnh", "Trạng thái"].map((head) => <th className="px-4 py-3 font-bold" key={head}>{head}</th>)}</tr></thead>
              <tbody className="divide-y divide-brand-line">
                {result.candidates.map((candidate) => (
                  <tr className={cn("cursor-pointer hover:bg-blue-50/50", candidate.id === selectedCandidateId && "bg-blue-50")} key={candidate.id} onClick={() => onSelect(candidate.id)}>
                    <td className="px-4 py-3 font-bold text-brand-navy">{formatNumber(candidate.energy_kwh)}/{formatNumber(candidate.power_kw)}</td>
                    <td className="px-4 py-3">{formatMoney(candidate.capex_vnd)}</td>
                    <td className="px-4 py-3 font-bold text-brand-green">{formatMoney(candidate.annual_saving_vnd)}</td>
                    <td className="px-4 py-3">{formatMoney(candidate.npv_vnd)}</td>
                    <td className="px-4 py-3">{formatPayback(candidate.payback_years)}</td>
                    <td className="px-4 py-3">{formatNumber(candidate.pmax_kw)} kW</td>
                    <td className="px-4 py-3">{candidate.peak_reduction_pct.toFixed(1)}%</td>
                    <td className="px-4 py-3"><CandidateBadge candidate={candidate} recommendedId={result.selected.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <CandidateDetail candidate={selected} recommended={selected.id === result.selected.id} />
      </section>
    </div>
  );
}

function ParetoChart({ candidates, selectedCandidateId, onSelect, compact = false }: { candidates: SizingLabCandidate[]; selectedCandidateId: string; onSelect: (id: string) => void; compact?: boolean }) {
  const width = compact ? 760 : 1200;
  const height = compact ? 260 : 520;
  const padding = compact
    ? { left: 66, right: 24, top: 28, bottom: 48 }
    : { left: 82, right: 32, top: 34, bottom: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const savingValues = candidates.map((item) => item.annual_saving_vnd);
  const roiValues = candidates.map((item) => item.roi);
  const [minX, maxX] = getPaddedDomain(savingValues, 0.05);
  const [minY, maxY] = getPaddedDomain(roiValues, 0.08);
  const x = (value: number) => padding.left + normalize(value, minX, maxX) * plotWidth;
  const y = (value: number) => padding.top + (1 - normalize(value, minY, maxY)) * plotHeight;
  return (
    <Card className={cn("rounded-xl bg-white p-4 shadow-none", !compact && "p-6 max-sm:p-4")}>
      <div className="flex items-center justify-between gap-3"><div><h2 className={cn("font-bold text-brand-navy", !compact && "text-xl")}>Mặt Pareto tiết kiệm × ROI</h2><p className={cn("mt-1 font-medium text-brand-muted", compact ? "text-xs" : "text-sm")}>Đúng Sizing Lab EMS: Pareto theo tiết kiệm Oracle và ROI; ngôi sao do SLSM chọn.</p></div><span className={cn("shrink-0 rounded-full bg-blue-50 px-3 py-1 font-bold text-brand-blue", compact ? "text-xs" : "text-sm")}>{candidates.length} phương án</span></div>
      <svg className={cn("mt-4 block w-full", compact ? "aspect-[760/260]" : "aspect-[1200/520]")} role="img" aria-label="Mặt Pareto tiết kiệm theo ROI" viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const lineY = padding.top + fraction * plotHeight;
          return <line key={fraction} x1={padding.left} x2={width - padding.right} y1={lineY} y2={lineY} stroke="#e4ebf5" />;
        })}
        {[0.25, 0.5, 0.75].map((fraction) => {
          const lineX = padding.left + fraction * plotWidth;
          return <line key={fraction} x1={lineX} x2={lineX} y1={padding.top} y2={height - padding.bottom} stroke="#eef3fa" />;
        })}
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} stroke="#9aa9bf" />
        <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} stroke="#9aa9bf" />
        <text fill="#4d5f82" fontSize="12" textAnchor="middle" x={width / 2} y={height - 12}>Tiết kiệm Oracle/năm</text>
        <text fill="#4d5f82" fontSize="12" textAnchor="middle" transform={`rotate(-90 23 ${height / 2})`} x="23" y={height / 2}>ROI (NPV/CAPEX)</text>
        {candidates.map((candidate) => {
          const selected = candidate.id === selectedCandidateId;
          const recommended = candidate.selected;
          return recommended ? (
            <text className="cursor-pointer" fill="#ef4444" fontSize={selected ? 28 : 23} key={candidate.id} onClick={() => onSelect(candidate.id)} textAnchor="middle" x={x(candidate.annual_saving_vnd)} y={y(candidate.roi) + 8}>
              <title>{`${formatNumber(candidate.energy_kwh)} kWh / ${formatNumber(candidate.power_kw)} kW · ${formatMoney(candidate.annual_saving_vnd)}/năm · ROI ${(candidate.roi * 100).toFixed(1)}%`}</title>
              ★
            </text>
          ) : (
            <circle className="cursor-pointer" cx={x(candidate.annual_saving_vnd)} cy={y(candidate.roi)} fill={candidate.on_pareto ? "#147fe8" : "#a6abb6"} key={candidate.id} onClick={() => onSelect(candidate.id)} r={selected ? 8 : candidate.on_pareto ? 6 : 5} stroke={selected ? "#1d2b4f" : "white"} strokeWidth={selected ? 2 : 1.5}>
              <title>{`${formatNumber(candidate.energy_kwh)} kWh / ${formatNumber(candidate.power_kw)} kW · ${formatMoney(candidate.annual_saving_vnd)}/năm · ROI ${(candidate.roi * 100).toFixed(1)}%`}</title>
            </circle>
          );
        })}
      </svg>
    </Card>
  );
}

function CandidateDetail({ candidate, recommended }: { candidate: SizingLabCandidate; recommended: boolean }) {
  return (
    <Card className="h-fit rounded-xl bg-white p-5 shadow-none">
      <div className="flex items-center justify-between"><h2 className="font-bold text-brand-navy">Chi tiết phương án</h2>{recommended ? <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-brand-green">Khuyến nghị</span> : null}</div>
      <strong className="mt-4 block text-2xl text-brand-blue">{formatNumber(candidate.energy_kwh)} kWh / {formatNumber(candidate.power_kw)} kW</strong>
      <div className="mt-4 grid gap-2">
        <DetailRow label="Thời lượng" value={`${candidate.duration_hours.toFixed(2)} giờ`} />
        <DetailRow label="CAPEX" value={formatMoney(candidate.capex_vnd)} />
        <DetailRow label="Tiết kiệm Oracle/năm" value={formatMoney(candidate.annual_saving_vnd)} />
        <DetailRow label="Tiết kiệm thực hiện/năm" value={formatMoney(candidate.annual_saving_realized_vnd)} />
        <DetailRow label="NPV Oracle" value={formatMoney(candidate.npv_vnd)} />
        <DetailRow label="NPV thực hiện" value={formatMoney(candidate.npv_realized_vnd)} />
        <DetailRow label="ROI Oracle" value={`${(candidate.roi * 100).toFixed(1)}%`} />
        <DetailRow label="Hoàn vốn Oracle" value={formatPayback(candidate.payback_years)} />
        <DetailRow label="Hoàn vốn thực hiện" value={formatPayback(candidate.payback_realized_years)} />
        <DetailRow label="Pmax hợp đồng" value={`${formatNumber(candidate.contract_pmax_kw)} kW`} />
        <DetailRow label="EFC/ngày" value={candidate.efc_per_day.toFixed(2)} />
      </div>
    </Card>
  );
}

function PlanningTab({ result, candidate }: { result: NonNullable<ReturnType<typeof useSizingLab>["result"]>; candidate: SizingLabCandidate }) {
  const planning = result.planning;
  return (
    <div className="mt-4 grid gap-4">
      <Card className="rounded-xl bg-white p-5 shadow-none">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="text-xs font-bold uppercase text-brand-blue">Planning+</span><h2 className="mt-1 text-xl font-bold text-brand-navy">{formatNumber(candidate.energy_kwh)} kWh / {formatNumber(candidate.power_kw)} kW</h2></div><div className="text-right"><small className="font-semibold text-brand-muted">CAPEX hòa vốn</small><strong className="block text-lg text-brand-green">{formatMoney(planning.break_even_capex_vnd)}</strong></div></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-brand-line text-brand-muted"><tr>{["Kịch bản", "CAPEX", "NPV", "ROI", "Payback", "OPEX/năm"].map((head) => <th className="py-3 font-bold" key={head}>{head}</th>)}</tr></thead><tbody className="divide-y divide-brand-line">{planning.scenarios.map((scenario) => <tr key={scenario.key}><td className="py-3 font-bold text-brand-navy">{scenario.label}</td><td>{formatMoney(scenario.capex_vnd)}</td><td className={scenario.npv_vnd >= 0 ? "font-bold text-brand-green" : "font-bold text-red-600"}>{formatMoney(scenario.npv_vnd)}</td><td>{(scenario.roi * 100).toFixed(1)}%</td><td>{formatPayback(scenario.payback_years)}</td><td>{formatMoney(scenario.annual_opex_vnd)}</td></tr>)}</tbody></table></div>
      </Card>
      <section className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        {planning.details.map((detail, index) => (
          <Card className={cn("rounded-xl p-5 shadow-none", index === 0 && "border-green-200 bg-green-50/40")} key={detail.candidate_id}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase text-brand-muted">Top {index + 1}</span>
              {index === 0 ? <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-brand-green">SLSM</span> : null}
            </div>
            <strong className="mt-3 block text-xl text-brand-navy">{formatNumber(detail.energy_kwh)} kWh / {formatNumber(detail.power_kw)} kW</strong>
            <div className="mt-4 grid gap-2">
              <DetailRow label="Tiết kiệm Oracle/năm" value={formatMoney(detail.annual_saving_vnd)} />
              <DetailRow label="NPV" value={formatMoney(detail.npv_vnd)} />
              <DetailRow label="Hoàn vốn" value={formatPayback(detail.payback_years)} />
              <DetailRow label="Pmax P95" value={`${formatNumber(detail.pmax_risk.p95_kw)} kW`} />
              <DetailRow label="Tuổi thọ" value={`${detail.longevity.estimated_lifespan_years.toFixed(1)} năm`} />
            </div>
          </Card>
        ))}
      </section>
      <section className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        <Card className="rounded-xl p-5 shadow-none"><h3 className="font-bold text-brand-navy">Rủi ro Pmax</h3><div className="mt-4 grid gap-2"><DetailRow label="P50" value={`${formatNumber(planning.pmax_risk.p50_kw)} kW`} /><DetailRow label="P95" value={`${formatNumber(planning.pmax_risk.p95_kw)} kW`} /><DetailRow label="Lớn nhất" value={`${formatNumber(planning.pmax_risk.max_kw)} kW`} /><DetailRow label="Không BESS" value={`${formatNumber(planning.pmax_risk.no_bess_kw)} kW`} /></div><span className={cn("mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold", planning.pmax_risk.risk_level === "low" ? "bg-green-50 text-brand-green" : "bg-amber-50 text-amber-700")}>Rủi ro {planning.pmax_risk.risk_level === "low" ? "thấp" : "trung bình"}</span></Card>
        <Card className="rounded-xl p-5 shadow-none"><h3 className="font-bold text-brand-navy">Tuổi thọ</h3><div className="mt-4 grid gap-2"><DetailRow label="EFC/ngày" value={planning.longevity.efc_per_day.toFixed(2)} /><DetailRow label="EFC/năm" value={formatNumber(planning.longevity.efc_per_year)} /><DetailRow label="Tuổi thọ ước tính" value={`${planning.longevity.estimated_lifespan_years.toFixed(1)} năm`} /><DetailRow label="Dung lượng cuối kỳ" value={`${planning.longevity.remaining_capacity_pct_at_horizon.toFixed(1)}%`} /></div></Card>
        <Card className="rounded-xl p-5 shadow-none"><h3 className="font-bold text-brand-navy">Theo loại ngày</h3><div className="mt-4 grid gap-3">{planning.day_types.map((item) => <div className="rounded-lg bg-slate-50 p-3" key={item.key}><div className="flex justify-between gap-3 text-sm"><strong className="text-brand-navy">{item.label}</strong><span className="font-bold text-brand-green">{formatMoney(item.average_saving_vnd)}/ngày</span></div><p className="mt-1 text-xs font-medium text-brand-muted">{item.days} ngày · P10–P90: {formatMoney(item.p10_vnd)}–{formatMoney(item.p90_vnd)}</p></div>)}</div></Card>
      </section>
      <PlanningDetailTables details={planning.details} />
    </div>
  );
}

function PlanningDetailTables({ details }: { details: NonNullable<ReturnType<typeof useSizingLab>["result"]>["planning"]["details"] }) {
  return (
    <div className="grid gap-4">
      {details.map((detail, index) => (
        <Card className="rounded-xl bg-white p-5 shadow-none" key={detail.candidate_id}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase text-brand-blue">Planning+ top {index + 1}</span>
              <h3 className="mt-1 text-lg font-bold text-brand-navy">{formatNumber(detail.energy_kwh)} kWh / {formatNumber(detail.power_kw)} kW</h3>
            </div>
            <div className="text-right text-sm"><span className="font-semibold text-brand-muted">CAPEX hòa vốn</span><strong className="block text-brand-green">{formatMoney(detail.break_even_capex_vnd)}</strong></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-5 max-xl:grid-cols-1">
            <div className="overflow-x-auto">
              <strong className="text-sm text-brand-navy">Ma trận kịch bản tài chính</strong>
              <table className="mt-3 w-full min-w-[560px] text-left text-xs"><thead className="bg-slate-50 text-brand-muted"><tr>{["Kịch bản", "CAPEX", "NPV", "ROI", "Payback"].map((head) => <th className="px-3 py-2 font-bold" key={head}>{head}</th>)}</tr></thead><tbody className="divide-y divide-brand-line">{detail.scenarios.map((scenario) => <tr key={scenario.key}><td className="px-3 py-2 font-bold text-brand-navy">{scenario.label}</td><td>{formatMoney(scenario.capex_vnd)}</td><td>{formatMoney(scenario.npv_vnd)}</td><td>{(scenario.roi * 100).toFixed(1)}%</td><td>{formatPayback(scenario.payback_years)}</td></tr>)}</tbody></table>
            </div>
            <div className="overflow-x-auto">
              <strong className="text-sm text-brand-navy">Pmax và tiết kiệm theo block/tháng</strong>
              <table className="mt-3 w-full min-w-[600px] text-left text-xs"><thead className="bg-slate-50 text-brand-muted"><tr>{["Tháng", "No-BESS", "Oracle", "Hợp đồng", "Saving/tháng"].map((head) => <th className="px-3 py-2 font-bold" key={head}>{head}</th>)}</tr></thead><tbody className="divide-y divide-brand-line">{detail.monthly.map((row) => <tr key={row.month}><td className="px-3 py-2 font-bold text-brand-navy">{formatMonthLabel(row.month)}</td><td>{formatNumber(row.peak_load_kw)} kW</td><td>{formatNumber(row.pmax_after_bess_kw)} kW</td><td>{formatNumber(row.contract_pmax_kw)} kW</td><td className="font-bold text-brand-green">{formatMoney(row.saving_month_vnd)}</td></tr>)}</tbody></table>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
            {detail.day_types.map((item) => <div className="rounded-lg bg-slate-50 p-3" key={item.key}><strong className="text-sm text-brand-navy">{item.label}</strong><p className="mt-1 text-xs font-medium text-brand-muted">{item.days} ngày · TB {formatMoney(item.average_saving_vnd)}/ngày</p><p className="text-xs font-medium text-brand-muted">P10–P90: {formatMoney(item.p10_vnd)}–{formatMoney(item.p90_vnd)}</p></div>)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ComparisonTab({ result }: { result: NonNullable<ReturnType<typeof useSizingLab>["result"]> }) {
  return (
    <Card className="mt-4 rounded-xl bg-white p-5 shadow-none">
      <div><span className="text-xs font-bold uppercase text-brand-blue">So sánh chế độ</span><h2 className="mt-1 text-xl font-bold text-brand-navy">TOU-only và TOU + Peak shaving</h2></div>
      <div className="mt-5 grid grid-cols-3 gap-4 max-lg:grid-cols-1">{result.comparison.modes.map((mode) => <div className={cn("rounded-xl border p-4", mode.key === "tou_peak" ? "border-green-200 bg-green-50/50" : "border-brand-line bg-slate-50")} key={mode.key}><strong className="text-brand-navy">{mode.label}</strong><span className="mt-4 block text-xs font-semibold text-brand-muted">Tiền điện/năm</span><strong className="mt-1 block text-2xl text-brand-blue">{formatMoney(mode.annual_bill_vnd)}</strong><div className="mt-4 grid gap-2"><DetailRow label="Tiết kiệm Oracle" value={formatMoney(mode.annual_saving_vnd)} /><DetailRow label="Tiết kiệm thực hiện" value={formatMoney(mode.annual_saving_realized_vnd)} /><DetailRow label="NPV" value={formatMoney(mode.npv_vnd)} /><DetailRow label="ROI" value={`${(mode.roi * 100).toFixed(1)}%`} /><DetailRow label="Hoàn vốn Oracle" value={formatPayback(mode.payback_years)} /><DetailRow label="Hoàn vốn thực hiện" value={formatPayback(mode.payback_realized_years)} /><DetailRow label="Pmax" value={`${formatNumber(mode.pmax_kw)} kW`} /></div></div>)}</div>
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-brand-muted">Peak shaving đóng góp <strong className="text-brand-navy">{formatMoney(result.comparison.peak_shaving_contribution_vnd)}/năm</strong>, tương đương <strong className="text-brand-navy">{result.comparison.peak_shaving_contribution_pct.toFixed(1)}%</strong> tổng mức tiết kiệm.</div>
    </Card>
  );
}

function MonthlyTab({ result }: { result: NonNullable<ReturnType<typeof useSizingLab>["result"]> }) {
  return (
    <div className="mt-4 grid gap-4">
      <Card className="overflow-hidden rounded-xl bg-white shadow-none">
        <div className="p-5"><span className="text-xs font-bold uppercase text-brand-blue">Sizing từng tháng</span><h2 className="mt-1 text-xl font-bold text-brand-navy">Oracle LP-PF + Pareto + SLSM riêng cho từng tháng</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-brand-muted"><tr>{["Tháng", "Số ngày", "Peak tải", "Pmax sau BESS", "Pmax hợp đồng", "Tiết kiệm Oracle/tháng", "Sizing SLSM"].map((head) => <th className="px-5 py-3 font-bold" key={head}>{head}</th>)}</tr></thead><tbody className="divide-y divide-brand-line">{result.monthly.map((row) => <tr key={row.month}><td className="px-5 py-3 font-bold text-brand-navy">{formatMonthLabel(row.month)}</td><td>{row.days}</td><td>{formatNumber(row.peak_load_kw)} kW</td><td>{formatNumber(row.pmax_after_bess_kw)} kW</td><td>{formatNumber(row.contract_pmax_kw)} kW</td><td className="font-bold text-brand-green">{formatMoney(row.saving_month_vnd)}</td><td>{formatNumber(row.energy_kwh)}/{formatNumber(row.power_kw)}</td></tr>)}</tbody></table></div>
      </Card>
      <Card className="overflow-hidden rounded-xl bg-white shadow-none">
        <div className="p-5"><span className="text-xs font-bold uppercase text-brand-blue">Pmax theo tháng</span><h2 className="mt-1 text-xl font-bold text-brand-navy">Sizing tổng đã chọn: {formatNumber(result.selected.energy_kwh)} kWh / {formatNumber(result.selected.power_kw)} kW</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-brand-muted"><tr>{["Tháng", "Số ngày", "No-BESS Pmax", "Oracle Pmax", "Pmax hợp đồng", "Tiết kiệm Oracle/tháng"].map((head) => <th className="px-5 py-3 font-bold" key={head}>{head}</th>)}</tr></thead><tbody className="divide-y divide-brand-line">{result.selected_monthly.map((row) => <tr key={row.month}><td className="px-5 py-3 font-bold text-brand-navy">{formatMonthLabel(row.month)}</td><td>{row.days}</td><td>{formatNumber(row.peak_load_kw)} kW</td><td>{formatNumber(row.pmax_after_bess_kw)} kW</td><td className="font-bold text-brand-blue">{formatNumber(row.contract_pmax_kw)} kW</td><td className="font-bold text-brand-green">{formatMoney(row.saving_month_vnd)}</td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}

function InputTab({ result, project, datasets, files, analysisRun, history }: { result: NonNullable<ReturnType<typeof useSizingLab>["result"]>; project: ProjectResponse | null; datasets: DatasetResponse[]; files: WorkspaceFileResponse[]; analysisRun: AnalysisRunResponse | null; history: AnalysisRunResponse[] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 max-xl:grid-cols-1">
      <ProjectDataFilesPanel project={project} datasets={datasets} files={files} analysisRun={analysisRun} />
      <Card className="rounded-xl p-5 shadow-none"><h2 className="font-bold text-brand-navy">Giả định đã sử dụng</h2><div className="mt-4 grid gap-2">{Object.entries(result.assumptions).map(([key, value]) => <DetailRow key={key} label={humanizeKey(key)} value={formatNumber(value, 2)} />)}</div></Card>
      <Card className="rounded-xl p-5 shadow-none"><h2 className="font-bold text-brand-navy">Cấu hình dự án</h2><div className="mt-4 grid gap-2">{Object.entries(project?.configuration ?? {}).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) => <DetailRow key={key} label={humanizeKey(key)} value={String(value)} />)}</div></Card>
      <Card className="rounded-xl p-5 shadow-none"><h2 className="font-bold text-brand-navy">Chất lượng dữ liệu</h2><div className="mt-4 grid gap-2"><DetailRow label="Múi giờ" value={result.input_quality.timezone} /><DetailRow label="Đơn vị Load" value={result.input_quality.configured_units.load} /><DetailRow label="Đơn vị PV" value={result.input_quality.configured_units.pv} /><DetailRow label="Peak Load" value={`${formatNumber(result.summary.site_peak_kw)} kW`} /><DetailRow label="Năng lượng năm" value={`${formatNumber(result.summary.annual_load_energy_kwh)} kWh`} /></div></Card>
      <Card className="col-span-2 rounded-xl p-5 shadow-none max-xl:col-span-1"><h2 className="font-bold text-brand-navy">Lịch sử Sizing Lab</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-brand-line text-brand-muted"><tr><th className="py-3 font-bold">Thời gian</th><th className="py-3 font-bold">Lần phân tích</th><th className="py-3 font-bold">Trạng thái</th><th className="py-3 font-bold">Phiên bản tính toán</th><th className="py-3 font-bold">Phương án đề xuất</th></tr></thead><tbody className="divide-y divide-brand-line">{history.map((run) => { const runResult = run.result as Record<string, unknown>; const selected = runResult.selected && typeof runResult.selected === "object" && !Array.isArray(runResult.selected) ? runResult.selected as Record<string, unknown> : null; return <tr key={run.id ?? run.created_at}><td className="py-3">{formatDate(run.created_at)}</td><td className="py-3 font-mono text-xs">{run.id?.slice(-8) ?? "—"}</td><td className="py-3 font-semibold text-brand-blue">{formatAnalysisStatus(run.status)}</td><td className="py-3">{formatEngineVersion(run.engine_version)}</td><td className="py-3 font-bold text-brand-navy">{selected && typeof selected.energy_kwh === "number" && typeof selected.power_kw === "number" ? `${formatNumber(selected.energy_kwh)} / ${formatNumber(selected.power_kw)}` : "—"}</td></tr>; })}</tbody></table></div></Card>
    </div>
  );
}

function ResultBreadcrumb({ projectName }: { projectName?: string }) {
  return <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-muted"><Link className="flex items-center gap-1 hover:text-brand-blue" href="/customer-portal/du-an-cua-toi"><ArrowLeft size={15} />Dự án của tôi</Link><span>/</span><span>{projectName || "Dự án"}</span><span>/</span><strong className="text-brand-navy">Sizing Lab</strong></div>;
}

function LoadingState() {
  return <main className="w-full pb-12 pt-7"><div className="animate-pulse"><div className="h-5 w-64 rounded bg-slate-200" /><div className="mt-6 h-10 w-80 rounded bg-slate-200" /><div className="mt-5 grid grid-cols-5 gap-3">{Array.from({ length: 5 }, (_, index) => <div className="h-32 rounded-xl bg-slate-100" key={index} />)}</div><div className="mt-4 h-80 rounded-xl bg-slate-100" /></div></main>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <Card className="mx-auto mt-12 max-w-2xl rounded-xl bg-white p-10 text-center shadow-none"><BatteryCharging className="mx-auto text-brand-blue" size={48} /><h1 className="mt-5 text-2xl font-bold text-brand-navy">{title}</h1><p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-brand-muted">{description}</p>{action}</Card>;
}

function Notice({ tone, text }: { tone: "danger"; text: string }) {
  return <div className={cn("mt-4 rounded-xl border p-4 text-sm font-semibold", tone === "danger" && "border-red-200 bg-red-50 text-red-700")}>{text}</div>;
}

function CandidateBadge({ candidate, recommendedId }: { candidate: SizingLabCandidate; recommendedId: string }) {
  if (candidate.id === recommendedId) return <span className="rounded-full bg-green-50 px-2.5 py-1 font-bold text-brand-green">Khuyến nghị</span>;
  if (candidate.on_pareto) return <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-brand-blue">Pareto</span>;
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-brand-muted">Ứng viên</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-brand-line bg-white p-3"><small className="font-semibold text-brand-muted">{label}</small><strong className="mt-1 block text-brand-navy">{value}</strong></div>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-brand-line py-2 text-sm"><span className="font-medium text-brand-muted">{label}</span><strong className="text-right text-brand-navy">{value}</strong></div>;
}

function formatMoney(value: number) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absolute >= 1_000_000_000) return `${sign}${(absolute / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  if (absolute >= 1_000_000) return `${sign}${(absolute / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} đ`;
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits });
}

function formatPayback(value: number | null) {
  return value === null ? "> thời hạn" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} năm`;
}

function formatMonthLabel(value: string | number) {
  const text = String(value);
  return /^\d{1,2}$/.test(text) ? `Tháng ${text}` : text;
}

function normalize(value: number, minimum: number, maximum: number) {
  return maximum === minimum ? 0.5 : (value - minimum) / (maximum - minimum);
}

function getPaddedDomain(values: number[], paddingRatio: number): [number, number] {
  if (!values.length) return [0, 1];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) {
    const fallbackPadding = Math.max(Math.abs(minimum) * paddingRatio, 1);
    return [minimum - fallbackPadding, maximum + fallbackPadding];
  }
  const padding = (maximum - minimum) * paddingRatio;
  return [minimum - padding, maximum + padding];
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function formatAnalysisStatus(value: string) {
  const labels: Record<string, string> = {
    queued: "Đang chờ",
    running: "Đang phân tích",
    completed: "Hoàn thành",
    failed: "Không thành công",
    cancelled: "Đã hủy"
  };
  return labels[value] ?? "Chưa xác định";
}

function formatEngineVersion(value: string | null | undefined) {
  if (!value) return "—";
  const version = value.match(/(\d+\.\d+\.\d+)$/)?.[1];
  return version ? `v${version}` : "Hiện hành";
}

function humanizeKey(value: string) {
  const labels: Record<string, string> = {
    battery_cost_vnd_per_kwh: "Đơn giá pin",
    pcs_cost_vnd_per_kw: "Đơn giá PCS",
    opex_pct: "Chi phí vận hành hằng năm",
    discount_rate_pct: "Tỷ lệ chiết khấu",
    analysis_years: "Thời hạn phân tích",
    realization_rate_pct: "Tỷ lệ lợi ích thực hiện",
    power_kw: "Công suất BESS",
    energy_kwh: "Dung lượng BESS",
    objective: "Mục tiêu phân tích",
    billing_mode: "Phương thức tính tiền điện"
  };
  return labels[value] ?? value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}
