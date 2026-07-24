"use client";

import {
  ChevronDown,
  FileDown,
  Play,
  Save,
  Share2
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analysesApi, datasetsApi, projectsApi, readWorkspaceApiError, type AnalysisRunResponse, type DatasetResponse, type ProjectResponse } from "../api/workspace.api";

const tabs = ["Tổng quan", "Khuyến nghị", "Planning chi tiết", "So sánh chế độ", "Sizing theo tháng", "Dữ liệu đầu vào"] as const;
type ResultTab = (typeof tabs)[number];

type ProjectSnapshot = {
  project?: { name?: string; location?: string; industry?: string; voltageLevel?: string; timezone?: string };
  loadFile?: { name?: string; rowCount?: number | null; status?: string; sizeLabel?: string } | null;
  pvFile?: { name?: string; rowCount?: number | null; status?: string; sizeLabel?: string } | null;
  config?: { objective?: string; analysisYears?: number; energyKwh?: number; powerKw?: number; optimizePeak?: boolean; optimizeTou?: boolean };
  backendProject?: ProjectResponse;
  datasets?: DatasetResponse[];
  analysisRun?: AnalysisRunResponse;
  createdAt?: number;
};

const recommendationRows = [
  ["250", "88", "439", "1,13", "3,9", "440", true],
  ["250", "125", "454", "1,06", "4,2", "440", true],
  ["250", "175", "464", "0,90", "4,6", "440", true],
  ["500", "175", "664", "0,83", "5,3", "410", true],
  ["500", "250", "669", "0,52", "5,8", "410", true],
  ["500", "350", "669", "0,06", "6,6", "410", true]
];

const kpis = [
  ["Đỉnh tải site", "597 kW", "grid ×1", "blue"],
  ["Cấu hình khuyến nghị", "500/175", "kWh / kW", "green"],
  ["Tiết kiệm/năm", "664 tr", "kịch bản cơ sở", "blue"],
  ["NPV 10 năm", "0,83 tỷ", "payback 5,3 năm", "green"],
  ["P_max hợp đồng", "410 kW", "đỉnh tham chiếu +5%", "orange"]
];

const scenarioRows = [
  ["Bi quan (giá +, CAPEX +10%, fade 25%, r 12%)", "-0,59 tỷ", "6,6 năm", "3,52 tỷ"],
  ["Cơ sở (giá +5%/n, fade 15%, r 8%)", "1,38 tỷ", "5 năm", "3,2 tỷ"],
  ["Lạc quan (giá +10%/n, CAPEX -10%, r 7%)", "3,36 tỷ", "4,1 năm", "2,88 tỷ"]
];

const dayRows = [
  ["lam_viec_mua", "10", "0,43M", "0,17 - 0,68M"],
  ["lam_viec_nang", "6", "0,74M", "0,59 - 0,83M"],
  ["lam_viec_trung_binh", "5", "0,74M", "0,62 - 0,82M"],
  ["nghi_nang", "4", "1,10M", "1,08 - 1,11M"],
  ["nghi_trung_binh", "5", "1,11M", "1,11 - 1,11M"]
];

const compareRows = [
  ["TOU + Peak shaving (2TC)", "669", "401", "0,52", "0,15", "5,8", "10,6"],
  ["Chỉ TOU (1 thành phần)", "308", "185", "-1,9", "-0,54", "14,7", "30,5"]
];

const monthlyRows = [
  ["block-1", "30", "500", "175", "410", "55", ""],
  ["block-2", "31", "500", "175", "386", "50", ""],
  ["block-3", "30", "500", "175", "402", "52", ""],
  ["block-4", "31", "500", "175", "415", "58", ""]
];

export function BessPlannerResultPage({ embedded = false }: { embedded?: boolean } = {}) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [activeTab, setActiveTab] = useState<ResultTab>("Khuyến nghị");
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [backendLoading, setBackendLoading] = useState(Boolean(projectId));
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    let active = true;
    const localSnapshot = readLocalProjectSnapshot();
    if (localSnapshot) setSnapshot(localSnapshot);

    if (!projectId) {
      setBackendLoading(false);
      return () => { active = false; };
    }

    const loadProject = async () => {
      setBackendLoading(true);
      setBackendError("");
      try {
        const [project, datasetPage] = await Promise.all([
          projectsApi.get(projectId),
          datasetsApi.list({ page: 1, page_size: 100, project_id: projectId })
        ]);
        const analysisRun = project.latest_analysis_run_id
          ? await analysesApi.get(project.latest_analysis_run_id)
          : undefined;
        if (active) setSnapshot(snapshotFromBackendProject(project, localSnapshot, datasetPage.items, analysisRun));
      } catch (error) {
        if (active) setBackendError(readWorkspaceApiError(error));
      } finally {
        if (active) setBackendLoading(false);
      }
    };
    void loadProject();
    return () => { active = false; };
  }, [projectId]);

  const runDemoAction = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 1800);
  };

  const saveScenario = async () => {
    const savedAt = new Date().toISOString();
    window.localStorage.setItem("energyinsight.bessPlanner.savedScenario.v1", JSON.stringify({ snapshot, savedAt }));
    if (!snapshot?.backendProject) {
      runDemoAction("Đã lưu kịch bản trên trình duyệt");
      return;
    }

    try {
      const scenario = {
        saved_at: savedAt,
        source: "bess_planner_result_demo",
        configuration: snapshot.config ?? {},
        note: "KPI phân tích vẫn là dữ liệu demo cho tới khi optimizer backend được triển khai."
      };
      const updated = await projectsApi.update(snapshot.backendProject.id, {
        scenarios: [...snapshot.backendProject.scenarios, scenario]
      });
      setSnapshot((current) => current ? { ...current, backendProject: updated } : current);
      runDemoAction("Đã lưu kịch bản vào dự án backend");
    } catch (error) {
      runDemoAction(`Không lưu được backend: ${readWorkspaceApiError(error)}`);
    }
  };

  const shareResult = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      runDemoAction("Đã sao chép đường dẫn kết quả");
    } catch {
      runDemoAction("Không thể sao chép tự động; hãy sao chép URL trên thanh địa chỉ");
    }
  };

  const content = (
    <main className={embedded ? "w-full pb-12 pt-7" : "mx-auto w-[min(1440px,calc(100%_-_96px))] pb-12 pt-3 max-xl:w-[min(1180px,calc(100%_-_40px))]"}>
      <Breadcrumb projectName={snapshot?.project?.name} />

      <section className="mt-3 flex items-start justify-between gap-6 max-lg:flex-col">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-[21px] font-bold leading-tight text-brand-navy">Kết quả phân tích</h1>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">{snapshot?.backendProject ? "Dự án đã lưu" : "Dữ liệu demo"}</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-brand-muted">{snapshot?.createdAt ? `Tạo lúc: ${new Date(snapshot.createdAt).toLocaleString("vi-VN")}` : "Dữ liệu minh họa frontend"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-9 items-center rounded-md border border-brand-line bg-white pl-4 text-sm font-semibold text-brand-muted">
            Thời hạn phân tích
            <select className="ml-3 h-full min-w-[92px] appearance-none border-l border-brand-line bg-white px-4 font-bold text-brand-navy outline-none" defaultValue={`${snapshot?.config?.analysisYears ?? 10} năm`}>
              <option>5 năm</option>
              <option>10 năm</option>
              <option>15 năm</option>
            </select>
          </label>
          <button className={buttonVariants({ variant: "secondary", size: "sm", className: "border-brand-line text-brand-blue" })} onClick={() => window.print()} type="button">
            <FileDown size={16} className="text-red-500" />
            In / Lưu PDF
          </button>
          <button className={buttonVariants({ variant: "secondary", size: "sm", className: "border-brand-line text-brand-blue" })} onClick={() => void saveScenario()} type="button">
            <Save size={16} />
            Lưu kịch bản
          </button>
          <button className={buttonVariants({ variant: "secondary", size: "sm", className: "border-brand-line text-brand-blue" })} onClick={() => void shareResult()} type="button">
            <Share2 size={16} />
            Chia sẻ
          </button>
        </div>
      </section>

      {actionMessage ? <div className="mt-3 rounded-lg border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-brand-green">{actionMessage}</div> : null}
      {backendLoading ? <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-brand-blue">Đang tải dự án từ backend...</div> : null}
      {backendError ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">Không tải được dự án backend: {backendError}</div> : null}
      {snapshot?.analysisRun ? <div className={cn("mt-3 rounded-lg border px-4 py-2 text-sm font-semibold leading-6", isReadyForOptimization(snapshot.analysisRun) ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800")}>Kiểm tra dữ liệu backend: {isReadyForOptimization(snapshot.analysisRun) ? "đã sẵn sàng cho bước tối ưu" : "còn điều kiện cần xử lý"}. Dispatch optimizer và KPI tài chính bên dưới chưa được chạy.</div> : snapshot?.backendProject ? <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold leading-6 text-amber-800">Dự án đã được tải từ backend nhưng chưa có BESS Planner precheck.</div> : null}
      {snapshot?.analysisRun ? <AnalysisPrecheckDetails analysisRun={snapshot.analysisRun} /> : null}

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "Tổng quan" ? <OverviewTab snapshot={snapshot} /> : null}
      {activeTab === "Khuyến nghị" ? <section className="mt-2 grid grid-cols-2 gap-3 max-xl:grid-cols-1"><ParetoChart /><RecommendationCard /></section> : null}
      {activeTab === "Planning chi tiết" ? <PlanningSection /> : null}
      {activeTab === "So sánh chế độ" ? <ComparisonSection /> : null}
      {activeTab === "Sizing theo tháng" ? <MonthlySizingSection /> : null}
      {activeTab === "Dữ liệu đầu vào" ? <InputDataSection snapshot={snapshot} /> : null}
    </main>
  );

  if (embedded) return content;

  return (
    <>
      <AppHeader activeItem="BESS Planner" variant="dashboard" />
      {content}
    </>
  );
}

function readLocalProjectSnapshot(): ProjectSnapshot | null {
  const raw = window.localStorage.getItem("energyinsight.bessPlanner.lastProject.v1");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProjectSnapshot;
  } catch {
    window.localStorage.removeItem("energyinsight.bessPlanner.lastProject.v1");
    return null;
  }
}

function snapshotFromBackendProject(project: ProjectResponse, fallback: ProjectSnapshot | null, datasets: DatasetResponse[] = [], analysisRun?: AnalysisRunResponse): ProjectSnapshot {
  const configuration = project.configuration;
  const updatedAt = Date.parse(project.updated_at);
  return {
    ...fallback,
    project: {
      ...fallback?.project,
      name: project.name,
      location: readString(configuration.location, fallback?.project?.location),
      industry: readString(configuration.industry, fallback?.project?.industry),
      voltageLevel: readString(configuration.voltageLevel, fallback?.project?.voltageLevel),
      timezone: readString(configuration.timezone, fallback?.project?.timezone)
    },
    config: {
      ...fallback?.config,
      objective: readString(configuration.objective, fallback?.config?.objective),
      analysisYears: readNumber(configuration.analysisYears, fallback?.config?.analysisYears),
      energyKwh: readNumber(configuration.energyKwh, fallback?.config?.energyKwh),
      powerKw: readNumber(configuration.powerKw, fallback?.config?.powerKw),
      optimizePeak: readBoolean(configuration.optimizePeak, fallback?.config?.optimizePeak),
      optimizeTou: readBoolean(configuration.optimizeTou, fallback?.config?.optimizeTou)
    },
    loadFile: readFileMetadata(configuration.loadFile) ?? fallback?.loadFile,
    pvFile: readFileMetadata(configuration.pvFile) ?? fallback?.pvFile,
    backendProject: project,
    datasets,
    analysisRun: analysisRun ?? fallback?.analysisRun,
    createdAt: Number.isNaN(updatedAt) ? fallback?.createdAt : updatedAt
  };
}

function readString(value: unknown, fallback?: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNumber(value: unknown, fallback?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback?: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function isReadyForOptimization(analysisRun: AnalysisRunResponse) {
  return analysisRun.result.ready_for_optimization === true;
}

function AnalysisPrecheckDetails({ analysisRun }: { analysisRun: AnalysisRunResponse }) {
  const blockers = readStringArray(analysisRun.result.blockers);
  const warnings = readStringArray(analysisRun.result.warnings);
  if (!blockers.length && !warnings.length) return null;
  return <div className="mt-3 grid grid-cols-2 gap-3 max-md:grid-cols-1">{blockers.length ? <Card className="border-red-200 bg-red-50 p-4 shadow-none"><h3 className="text-sm font-bold text-red-700">Điều kiện chặn</h3><div className="mt-2 grid gap-1 text-xs font-medium leading-5 text-red-700">{blockers.map((item) => <p key={item}>• {item}</p>)}</div></Card> : null}{warnings.length ? <Card className="border-amber-200 bg-amber-50 p-4 shadow-none"><h3 className="text-sm font-bold text-amber-800">Cảnh báo dữ liệu</h3><div className="mt-2 grid gap-1 text-xs font-medium leading-5 text-amber-800">{warnings.map((item) => <p key={item}>• {item}</p>)}</div></Card> : null}</div>;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readFileMetadata(value: unknown): ProjectSnapshot["loadFile"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  return {
    name: readString(record.name),
    rowCount: typeof record.rowCount === "number" ? record.rowCount : null,
    status: readString(record.status),
    sizeLabel: readString(record.sizeLabel)
  };
}

function Breadcrumb({ projectName }: { projectName?: string }) {
  return (
    <div className="flex items-center gap-4 text-sm font-semibold text-brand-muted">
      <span>BESS Planner</span>
      <ChevronDown className="-rotate-90" size={14} />
      <span>{projectName || "Dự án demo"}</span>
      <ChevronDown className="-rotate-90" size={14} />
      <span className="font-bold text-brand-navy">Kết quả phân tích</span>
    </div>
  );
}

function Tabs({ activeTab, onChange }: { activeTab: ResultTab; onChange: (tab: ResultTab) => void }) {
  return (
    <div className="mt-3 flex overflow-x-auto border-b border-brand-line">
      {tabs.map((tab) => (
        <button
          aria-current={activeTab === tab ? "page" : undefined}
          className={cn(
            "relative h-10 min-w-[132px] whitespace-nowrap px-3 text-sm font-semibold text-brand-muted",
            activeTab === tab && "font-bold text-brand-blue after:absolute after:bottom-[-1px] after:left-0 after:h-[3px] after:w-full after:bg-brand-blue"
          )}
          key={tab}
          onClick={() => onChange(tab)}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({ snapshot }: { snapshot: ProjectSnapshot | null }) {
  const config = snapshot?.config;
  const cards = [
    ["Dự án", snapshot?.project?.name || "Dự án demo"],
    ["Địa điểm", snapshot?.project?.location || "Chưa xác định"],
    ["Sizing tham chiếu", `${config?.powerKw ?? 500} kW / ${config?.energyKwh ?? 1000} kWh`],
    ["Thời hạn", `${config?.analysisYears ?? 10} năm`],
    ["File phụ tải", snapshot?.loadFile?.name || "Dữ liệu minh họa"],
    ["Mục tiêu", config?.objective || "Tối thiểu tổng chi phí vòng đời"]
  ];

  return (
    <div className="mt-3 grid gap-3">
      <Card className="rounded-xl bg-white p-4 shadow-none">
        <h2 className="text-lg font-bold text-brand-navy">Tổng quan dự án</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {cards.map(([label, value]) => (
            <div className="rounded-lg border border-brand-line bg-slate-50 p-3" key={label}>
              <small className="block text-xs font-semibold text-brand-muted">{label}</small>
              <strong className="mt-1 block text-sm font-bold text-brand-navy">{value}</strong>
            </div>
          ))}
        </div>
      </Card>
      <section className="grid grid-cols-2 gap-3 max-xl:grid-cols-1"><ParetoChart /><RecommendationCard /></section>
    </div>
  );
}

function InputDataSection({ snapshot }: { snapshot: ProjectSnapshot | null }) {
  if (!snapshot) {
    return <Card className="mt-3 rounded-xl bg-white p-6 text-center shadow-none"><h2 className="text-lg font-bold text-brand-navy">Chưa có snapshot dự án</h2><p className="mt-2 text-sm font-medium text-brand-muted">Hãy tạo dự án qua wizard để xem lại dữ liệu đầu vào tại đây.</p></Card>;
  }
  const rows = [
    ["Tên dự án", snapshot.project?.name || "—"],
    ["Địa điểm", snapshot.project?.location || "—"],
    ["Ngành", snapshot.project?.industry || "—"],
    ["Cấp điện áp", snapshot.project?.voltageLevel || "—"],
    ["Múi giờ", snapshot.project?.timezone || "—"],
    ["File phụ tải", snapshot.loadFile?.name || "—"],
    ["Số dòng phụ tải", snapshot.loadFile?.rowCount == null ? "Chưa xác định" : String(snapshot.loadFile.rowCount)],
    ["Trạng thái phụ tải", snapshot.loadFile?.status || "—"],
    ["File PV", snapshot.pvFile?.name || "Không sử dụng"],
    ["Mục tiêu tối ưu", snapshot.config?.objective || "—"],
    ["Sizing tham chiếu", `${snapshot.config?.powerKw ?? "—"} kW / ${snapshot.config?.energyKwh ?? "—"} kWh`],
    ["Peak shaving", snapshot.config?.optimizePeak ? "Có" : "Không"],
    ["TOU", snapshot.config?.optimizeTou ? "Có" : "Không"]
  ];
  return <div className="mt-3 grid gap-3"><Card className="rounded-xl bg-white p-4 shadow-none"><h2 className="text-lg font-bold text-brand-navy">Dữ liệu đầu vào đã lưu</h2><div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 max-md:grid-cols-1">{rows.map(([label, value]) => <div className="flex justify-between gap-4 border-b border-brand-line py-2 text-sm" key={label}><span className="font-medium text-brand-muted">{label}</span><strong className="text-right text-brand-navy">{value}</strong></div>)}</div></Card><Card className="rounded-xl bg-white p-4 shadow-none"><h2 className="text-lg font-bold text-brand-navy">Dataset backend</h2>{snapshot.datasets?.length ? <div className="mt-4 grid gap-3">{snapshot.datasets.map((dataset) => <div className="grid grid-cols-[1fr_auto] gap-4 rounded-lg border border-brand-line bg-slate-50 p-4" key={dataset.id}><div><strong className="block text-sm text-brand-navy">{dataset.dataset_type === "load_profile" ? "Phụ tải" : "Điện mặt trời"}</strong><span className="mt-1 block text-xs font-medium text-brand-muted">{dataset.valid_row_count.toLocaleString("vi-VN")}/{dataset.row_count.toLocaleString("vi-VN")} dòng hợp lệ · interval {dataset.interval_minutes ?? "—"} phút · {dataset.timestamp_column ?? "—"} / {dataset.value_column ?? "—"}</span></div><span className={cn("h-fit rounded-full px-3 py-1 text-xs font-bold", dataset.status === "ready" ? "bg-green-50 text-brand-green" : dataset.status === "warning" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600")}>{dataset.status}</span></div>)}</div> : <p className="mt-3 text-sm font-medium text-brand-muted">Dự án chưa có dataset backend.</p>}<div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium leading-5 text-brand-muted">File gốc và kết quả chuẩn hóa hiện được lưu trên backend. KPI tối ưu vẫn là dữ liệu demo cho tới khi optimizer được triển khai.</div></Card></div>;
}

function ParetoChart() {
  const points = [
    [90, 44, "blue"], [103, 58, "blue"], [116, 77, "blue"],
    [310, 137, "gray"], [310, 116, "blue"], [310, 100, "star"],
    [455, 150, "gray"], [455, 130, "blue"], [455, 118, "blue"],
    [552, 164, "gray"], [552, 150, "blue"], [552, 140, "blue"],
    [640, 175, "gray"], [640, 160, "blue"], [640, 154, "blue"]
  ] as const;

  return (
    <Card className="h-[262px] bg-white p-4 shadow-none">
      <h2 className="text-sm font-bold text-brand-blue">Mặt Pareto (Savings × ROI)</h2>
      <div className="mt-2 h-[220px]">
        <svg viewBox="0 0 680 215" className="h-full w-full overflow-visible">
          <g fontSize="11" fill="#4d5f82">
            <text x="22" y="36">0.8</text>
            <text x="22" y="67">0.6</text>
            <text x="22" y="97">0.4</text>
            <text x="22" y="128">0.2</text>
            <text x="34" y="158">0</text>
            <text x="20" y="188">-0.2</text>
            {[400, 500, 600, 700, 800, 900, 1000, 1100].map((x, index) => (
              <text x={50 + index * 82} y="206" textAnchor="middle" key={x}>{x.toLocaleString("en-US")}</text>
            ))}
          </g>
          {[22, 52, 82, 112, 142, 172].map((y) => (
            <line key={`h-${y}`} x1="52" x2="650" y1={y} y2={y} stroke="#d9e2ef" strokeWidth="1" />
          ))}
          {[52, 134, 216, 298, 380, 462, 544, 626].map((x) => (
            <line key={`v-${x}`} x1={x} x2={x} y1="22" y2="185" stroke="#e4ebf5" strokeWidth="1" />
          ))}
          <text x="318" y="213" textAnchor="middle" fontSize="11" fill="#4d5f82">Tiết kiệm/năm (triệu VND)</text>
          <text x="10" y="112" transform="rotate(-90 10 112)" textAnchor="middle" fontSize="11" fill="#4d5f82">ROI (NPV/CAPEX)</text>
          <g fontSize="11" fontWeight="700" fill="#1d2b4f">
            <rect x="235" y="2" width="11" height="8" fill="#a3a8b4" />
            <text x="251" y="10">Ứng viên</text>
            <rect x="312" y="2" width="11" height="8" fill="#1e86f5" />
            <text x="328" y="10">Pareto</text>
            <rect x="387" y="2" width="11" height="8" fill="#ff5656" />
            <text x="403" y="10">Khuyến nghị ★</text>
          </g>
          {points.map(([x, y, tone], index) =>
            tone === "star" ? (
              <text x={x} y={y + 3} textAnchor="middle" fontSize="18" fill="#ff5656" key={index}>★</text>
            ) : (
              <circle cx={x} cy={y} r="4.5" fill={tone === "blue" ? "#147fe8" : "#a6abb6"} key={index} />
            )
          )}
        </svg>
      </div>
    </Card>
  );
}

function RecommendationCard() {
  return (
    <Card className="h-[262px] overflow-hidden bg-white p-3 shadow-none">
      <h2 className="text-[13px] font-bold text-brand-blue">Khuyến nghị</h2>
      <div className="mt-1.5 space-y-0 text-xs font-semibold leading-[14px] text-brand-navy">
        <p className="font-bold text-brand-blue">Cấu hình khuyến nghị: 500 kWh / 175 kW</p>
        <p>Tiết kiệm: <strong>664 triệu/năm</strong> · NPV: <strong>0,83 tỷ</strong> · Payback: <strong>5,3 năm</strong></p>
        <p><strong>P_max hợp đồng đề xuất:</strong> 410 kW <span className="text-brand-muted">(đỉnh tham chiếu tối ưu 387,1 kW + 5%)</span></p>
        <p className="text-brand-muted">→ Có thể dùng cấu hình này làm đầu vào cho mô phỏng vận hành chi tiết.</p>
      </div>

      <table className="mt-1 w-full text-left text-xs font-semibold leading-[13px]">
        <thead className="border-b border-brand-line text-brand-muted">
          <tr>
            {["E (kWh)", "P (kW)", "Tiết kiệm/năm (tr)", "NPV (tỷ)", "Payback (năm)", "P_max HD (kW)", "Pareto"].map((head) => (
              <th className="py-px font-bold" key={head}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-line text-brand-navy">
          {recommendationRows.map((row) => (
            <tr className={row[0] === "500" && row[1] === "175" ? "bg-green-50/70 text-brand-green" : ""} key={`${row[0]}-${row[1]}`}>
              {row.slice(0, 6).map((cell) => <td className="py-px" key={String(cell)}>{cell}</td>)}
              <td className="py-px text-brand-blue">✓</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="mx-auto mt-0.5 flex items-center gap-1 text-xs font-bold text-brand-muted opacity-60" disabled title="Cần dịch vụ phân tích để tải thêm phương án" type="button">
        Xem thêm 11 phương án
        <ChevronDown size={14} />
      </button>
    </Card>
  );
}

function PlanningSection() {
  return (
    <Card className="mt-3 bg-white p-4 shadow-none">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase text-brand-blue">PHÂN TÍCH MỞ RỘNG (PLANNING+) — khảo sát cấu hình và kịch bản</h2>
          <div className="mt-3 flex items-center gap-3">
            <LabeledSelect label="Bộ dữ liệu" value="Dữ liệu thực tế" width="160px" />
            <button className={buttonVariants({ size: "sm", className: "bg-slate-300 text-white" })} disabled title="Cần dịch vụ tối ưu để chạy phân tích mở rộng" type="button">
              <Play size={15} fill="currentColor" />
              Chạy khảo sát cấu hình và kịch bản
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-2">
          {kpis.map(([label, value, sub, tone]) => (
            <div className="min-w-[118px] rounded-md border border-brand-line bg-white px-4 py-3" key={label}>
              <p className="text-xs font-bold text-brand-muted">{label}</p>
              <strong className={cn("mt-1 block text-xl font-bold", tone === "green" ? "text-brand-green" : tone === "orange" ? "text-orange-500" : "text-brand-blue")}>{value}</strong>
              <small className="font-semibold text-brand-muted">{sub}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-brand-line p-3">
        <p className="text-sm font-bold text-orange-500">
          Chi tiết 500 kWh / 175 kW — tiết kiệm 664 tr/năm
          <span className="ml-5 text-brand-green">tuổi thọ 15.3 năm (1.075 EFC/ngày)</span>
        </p>
        <div className="mt-3 grid grid-cols-[1.35fr_0.72fr_0.5fr_0.75fr] gap-5 max-xl:grid-cols-2 max-lg:grid-cols-1">
          <MiniTable
            title="Ma trận kịch bản tài chính"
            headers={["Kịch bản", "NPV", "Payback", "CAPEX"]}
            rows={scenarioRows}
            footer="Điểm hòa vốn CAPEX: 3,93 tỷ (≈ 6,46 tr/kWh)"
          />
          <div className="border-l border-brand-line pl-5 max-lg:border-l-0 max-lg:pl-0">
            <h3 className="text-xs font-bold text-brand-navy">P_max rủi ro</h3>
            <MetricLine label="Đỉnh tham chiếu P50 / P95 / max" value="348 / 387 / 387 kW" />
            <MetricLine label="Xấu nhất (BESS báo trì – no-BESS)" value="502 kW" />
            <button className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-4 h-8 text-xs opacity-60" })} disabled title="Cần lưu kịch bản qua dịch vụ dự án" type="button">Dùng sizing này (P_max = max tháng)</button>
          </div>
          <div className="border-l border-brand-line pl-5 max-lg:border-l-0 max-lg:pl-0">
            <h3 className="text-xs font-bold text-brand-navy">P_max hợp đồng theo tháng</h3>
            <div className="mt-3 grid grid-cols-3 text-center text-xs">
              <span>Không BESS</span><span>Tham chiếu</span><span>HĐ đề xuất</span>
              <strong>502</strong><strong>387</strong><strong>410</strong>
            </div>
          </div>
          <MiniTable title="Tiết kiệm theo loại ngày (VND/ngày)" headers={["Loại", "Ngày", "TB", "P10-P90"]} rows={dayRows} />
        </div>
      </div>
    </Card>
  );
}

function ComparisonSection() {
  return (
    <Card className="mt-3 bg-white p-4 shadow-none">
      <h2 className="text-sm font-bold uppercase text-brand-blue">SO SÁNH 2 CHẾ ĐỘ BIỂU GIÁ — TOU-only vs TOU + Peak shaving</h2>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <LabeledSelect label="Bộ dữ liệu" value="Dữ liệu thực tế" width="160px" />
        <LabeledInput label="E_cap (kWh)" value="500" />
        <LabeledInput label="P_rated (kW)" value="250" />
        <button className={buttonVariants({ variant: "secondary", size: "sm", className: "h-9 opacity-60" })} disabled title="Cần dịch vụ tính toán để chạy so sánh" type="button">
          <Play size={14} fill="currentColor" />
          So sánh
        </button>
      </div>
      <FullTable
        className="mt-3"
        headers={["Chế độ", "Tiết kiệm/năm (tr)", "Tiết kiệm thực (tr)", "NPV (tỷ)", "ROI", "Payback (năm)", "Payback thực"]}
        rows={compareRows}
      />
      <p className="mt-3 text-sm font-semibold text-brand-muted">
        Phần <strong className="text-brand-navy">Peak shaving</strong> đóng góp: <strong>361 tr/năm</strong> · NPV +2,42 tỷ · rút ngắn payback 8,9 năm
      </p>
      <p className="text-xs font-semibold text-brand-muted">
        Cùng dataset + cùng BESS, chấm 2 lần: 2TC vừa arbitrage vừa giữ SOC cắt đỉnh vs TOU-only.
      </p>
    </Card>
  );
}

function MonthlySizingSection() {
  return (
    <Card className="mt-3 bg-white p-4 shadow-none">
      <h2 className="text-sm font-bold uppercase text-brand-blue">Sizing & P_max THEO THÁNG (dataset nhiều tháng từ API)</h2>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <LabeledSelect label="Dataset" value="real" width="120px" />
        <button className={buttonVariants({ size: "sm", className: "bg-slate-100 text-brand-muted opacity-60" })} disabled title="Cần dữ liệu nhiều tháng và dịch vụ tính toán" type="button">Sizing từng tháng</button>
        <LabeledInput label="E_cap đã chọn" value="500" />
        <LabeledInput label="P_rated đã chọn" value="250" />
        <button className={buttonVariants({ variant: "secondary", size: "sm", className: "h-9 text-xs opacity-60" })} disabled title="Cần dịch vụ tính toán theo tháng" type="button">P_max từng tháng cho sizing này</button>
      </div>
      <FullTable
        className="mt-3"
        headers={["Tháng", "Ngày", "E khuyến nghị (kWh)", "P (kW)", "P_max HĐ (kW)", "Tiết kiệm tham chiếu (tr/tháng)", ""]}
        rows={monthlyRows}
      />
    </Card>
  );
}

function LabeledSelect({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-brand-muted" style={{ width }}>
      {label}
      <span className="relative">
        <select className="h-9 w-full appearance-none rounded-md border border-brand-line bg-white px-3 pr-8 text-sm font-semibold text-brand-navy outline-none" defaultValue={value}>
          <option>{value}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted" size={14} />
      </span>
    </label>
  );
}

function LabeledInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid w-[150px] gap-1 text-xs font-bold text-brand-muted">
      {label}
      <input className="h-9 rounded-md border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy outline-none" defaultValue={value} />
    </label>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 flex justify-between gap-3 text-xs font-semibold text-brand-navy">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniTable({
  footer,
  headers,
  rows,
  title
}: {
  footer?: string;
  headers: string[];
  rows: string[][];
  title: string;
}) {
  return (
    <div>
      <h3 className="text-xs font-bold text-brand-navy">{title}</h3>
      <table className="mt-2 w-full text-left text-xs font-semibold text-brand-navy">
        <thead className="border-b border-brand-line text-brand-muted">
          <tr>{headers.map((head) => <th className="py-1.5 font-bold" key={head}>{head}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-brand-line">
          {rows.map((row) => (
            <tr key={row.join("-")}>{row.map((cell) => <td className="py-1.5" key={cell}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {footer ? <p className="mt-2 text-xs font-semibold text-brand-muted">{footer}</p> : null}
    </div>
  );
}

function FullTable({ className, headers, rows }: { className?: string; headers: string[]; rows: string[][] }) {
  return (
    <table className={cn("w-full text-left text-xs font-semibold text-brand-navy", className)}>
      <thead className="border-b border-brand-line text-brand-muted">
        <tr>{headers.map((head) => <th className="py-2 font-bold" key={head}>{head}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-brand-line">
        {rows.map((row) => (
          <tr key={row.join("-")}>{row.map((cell) => <td className="py-2" key={cell}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
