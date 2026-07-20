import {
  ChevronDown,
  FileDown,
  Play,
  Save,
  Share2
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = ["Tổng quan", "Khuyến nghị", "Planning chi tiết", "So sánh chế độ", "Sizing theo tháng", "Dữ liệu đầu vào"];

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
  ["SLSM chọn", "500/175", "kWh / kW", "green"],
  ["Tiết kiệm/năm", "664 tr", "kịch bản cơ sở", "blue"],
  ["NPV 10 năm", "0,83 tỷ", "payback 5,3 năm", "green"],
  ["P_max hợp đồng", "410 kW", "đỉnh oracle +5%", "orange"]
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

export function BessPlannerResultPage() {
  return (
    <>
      <AppHeader activeItem="BESS Planner" variant="dashboard" />
      <main className="mx-auto w-[min(1440px,calc(100%_-_96px))] pb-12 pt-3 max-xl:w-[min(1180px,calc(100%_-_40px))]">
        <Breadcrumb />

        <section className="mt-3 flex items-start justify-between gap-6 max-lg:flex-col">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-[21px] font-extrabold leading-tight text-brand-navy">Kết quả phân tích</h1>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-brand-green">Hoàn tất</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-brand-muted">Cập nhật lần cuối: 15/07/2026 10:30</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-9 items-center rounded-md border border-brand-line bg-white pl-4 text-sm font-semibold text-brand-muted">
              Thời hạn phân tích
              <select className="ml-3 h-full min-w-[92px] appearance-none border-l border-brand-line bg-white px-4 font-bold text-brand-navy outline-none" defaultValue="10 năm">
                <option>10 năm</option>
                <option>15 năm</option>
              </select>
            </label>
            <button className={buttonVariants({ variant: "secondary", size: "sm", className: "border-brand-line text-brand-blue" })} type="button">
              <FileDown size={16} className="text-red-500" />
              Xuất PDF
            </button>
            <button className={buttonVariants({ variant: "secondary", size: "sm", className: "border-brand-line text-brand-blue" })} type="button">
              <Save size={16} />
              Lưu kịch bản
            </button>
            <button className={buttonVariants({ variant: "secondary", size: "sm", className: "border-brand-line text-brand-blue" })} type="button">
              <Share2 size={16} />
              Chia sẻ
            </button>
          </div>
        </section>

        <Tabs />

        <section className="mt-2 grid grid-cols-2 gap-3 max-xl:grid-cols-1">
          <ParetoChart />
          <RecommendationCard />
        </section>

        <PlanningSection />
        <ComparisonSection />
        <MonthlySizingSection />
      </main>
    </>
  );
}

function Breadcrumb() {
  return (
    <div className="flex items-center gap-4 text-sm font-semibold text-brand-muted">
      <span>BESS Planner</span>
      <ChevronDown className="-rotate-90" size={14} />
      <span>Nhà máy ABC - Bình Dương</span>
      <ChevronDown className="-rotate-90" size={14} />
      <span className="font-bold text-brand-navy">Kết quả phân tích</span>
    </div>
  );
}

function Tabs() {
  return (
    <div className="mt-2 flex border-b border-brand-line">
      {tabs.map((tab) => (
        <button
          className={cn(
            "relative h-8 min-w-[115px] px-3 text-sm font-semibold text-brand-muted",
            tab === "Khuyến nghị" && "font-extrabold text-brand-blue after:absolute after:bottom-[-1px] after:left-0 after:h-[3px] after:w-full after:bg-brand-blue"
          )}
          key={tab}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
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
      <h2 className="text-sm font-extrabold text-brand-blue">Mặt Pareto (Savings × ROI)</h2>
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
            <text x="403" y="10">SLSM ★</text>
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
      <h2 className="text-[13px] font-extrabold text-brand-blue">Khuyến nghị</h2>
      <div className="mt-1.5 space-y-0 text-[10.5px] font-semibold leading-[14px] text-brand-navy">
        <p className="font-extrabold text-brand-blue">SLSM chọn: 500 kWh / 175 kW</p>
        <p>Tiết kiệm: <strong>664 triệu/năm</strong> · NPV: <strong>0,83 tỷ</strong> · Payback: <strong>5,3 năm</strong></p>
        <p><strong>P_max hợp đồng đề xuất:</strong> 410 kW <span className="text-brand-muted">(đỉnh oracle 387,1 kW + 5%)</span></p>
        <p className="text-brand-muted">→ Sang tab Cài đặt, đặt E_cap/P_rated theo khuyến nghị rồi train policy.</p>
      </div>

      <table className="mt-1 w-full text-left text-[10px] font-semibold leading-[13px]">
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
      <button className="mx-auto mt-0.5 flex items-center gap-1 text-[10.5px] font-extrabold text-brand-blue" type="button">
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
          <h2 className="text-sm font-extrabold uppercase text-brand-blue">PLANNING+ — đầy đủ kịch bản (khuyến nghị dùng thay sweep cơ bản)</h2>
          <div className="mt-3 flex items-center gap-3">
            <LabeledSelect label="Dataset (phây)" value="real" width="140px" />
            <button className={buttonVariants({ size: "sm", className: "bg-brand-blue text-white hover:bg-brand-blue/90" })} type="button">
              <Play size={15} fill="currentColor" />
              Chạy Planning+ (sweep + kịch bản + chi tiết top-3)
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-2">
          {kpis.map(([label, value, sub, tone]) => (
            <div className="min-w-[118px] rounded-md border border-brand-line bg-white px-4 py-3" key={label}>
              <p className="text-xs font-bold text-brand-muted">{label}</p>
              <strong className={cn("mt-1 block text-xl font-extrabold", tone === "green" ? "text-brand-green" : tone === "orange" ? "text-orange-500" : "text-brand-blue")}>{value}</strong>
              <small className="font-semibold text-brand-muted">{sub}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-brand-line p-3">
        <p className="text-sm font-extrabold text-orange-500">
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
            <h3 className="text-xs font-extrabold text-brand-navy">P_max rủi ro</h3>
            <MetricLine label="Đỉnh oracle P50 / P95 / max" value="348 / 387 / 387 kW" />
            <MetricLine label="Xấu nhất (BESS báo trì – no-BESS)" value="502 kW" />
            <button className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-4 h-8 text-xs" })} type="button">Dùng sizing này (P_max = max tháng)</button>
          </div>
          <div className="border-l border-brand-line pl-5 max-lg:border-l-0 max-lg:pl-0">
            <h3 className="text-xs font-extrabold text-brand-navy">P_max hợp đồng theo tháng</h3>
            <div className="mt-3 grid grid-cols-3 text-center text-xs">
              <span>No-BESS</span><span>Oracle</span><span>HD đề xuất</span>
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
      <h2 className="text-sm font-extrabold uppercase text-brand-blue">SO SÁNH 2 CHẾ ĐỘ BIỂU GIÁ — TOU-only vs TOU + Peak shaving</h2>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <LabeledSelect label="Dataset (phây)" value="real" width="140px" />
        <LabeledInput label="E_cap (kWh)" value="500" />
        <LabeledInput label="P_rated (kW)" value="250" />
        <button className={buttonVariants({ variant: "secondary", size: "sm", className: "h-9" })} type="button">
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
      <h2 className="text-sm font-extrabold uppercase text-brand-blue">Sizing & P_max THEO THÁNG (dataset nhiều tháng từ API)</h2>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <LabeledSelect label="Dataset" value="real" width="120px" />
        <button className={buttonVariants({ size: "sm", className: "bg-blue-100 text-brand-blue hover:bg-blue-100" })} type="button">Sizing từng tháng</button>
        <LabeledInput label="E_cap đã chọn" value="500" />
        <LabeledInput label="P_rated đã chọn" value="250" />
        <button className={buttonVariants({ variant: "secondary", size: "sm", className: "h-9 text-xs" })} type="button">P_max từng tháng cho sizing này</button>
      </div>
      <FullTable
        className="mt-3"
        headers={["Tháng", "Ngày", "E khuyến nghị (kWh)", "P (kW)", "P_max HD (kW)", "Tiết kiệm oracle (tr/tháng)", ""]}
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
      <h3 className="text-xs font-extrabold text-brand-navy">{title}</h3>
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
