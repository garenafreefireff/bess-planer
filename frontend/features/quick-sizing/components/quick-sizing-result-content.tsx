 "use client";

import { useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { assumptionRows, resultMetrics } from "../data/quick-sizing-result-content";
import { ReportLeadPanel } from "./quick-sizing-result-sidebar";
import { cn } from "@/lib/utils";

export function QuickSizingResultContent() {
  return (
    <section className="site-container pb-0 pt-4">
      <div className="flex items-center gap-3 text-sm font-semibold text-brand-muted">
        <span>Trang chủ</span>
        <ArrowRight size={14} />
        <span>Quick Sizing</span>
        <ArrowRight size={14} />
        <span className="text-brand-navy">Kết quả</span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_520px] gap-9 max-xl:grid-cols-1">
        <div>
          <h1 className="text-[34px] font-extrabold leading-tight text-brand-navy">
            Kết quả <span className="text-brand-green">Quick Sizing</span>
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-brand-muted">
            Dưới đây là kết quả ước tính sơ bộ cho hệ thống BESS của doanh nghiệp bạn dựa trên các thông tin đầu vào.
          </p>

          <MetricGrid />

          <div className="mt-4 grid grid-cols-[1.45fr_0.85fr] gap-5 max-lg:grid-cols-1">
            <SavingsChart />
            <AssumptionSummary />
          </div>

          <div className="mt-4 flex gap-3 rounded-md bg-blue-50 px-5 py-4 text-sm font-semibold leading-6 text-brand-blue">
            <Info className="shrink-0" size={22} />
            <span>
              Lưu ý: Kết quả Quick Sizing chỉ mang tính chất ước tính sơ bộ dựa trên các giả định mặc định. Để có phân tích chính xác hơn với dữ liệu thực tế,
              mô hình tài chính chi tiết và các kịch bản vận hành tối ưu, vui lòng sử dụng BESS Planner hoặc liên hệ đội ngũ EnergyInsight.
            </span>
          </div>
        </div>

        <ReportLeadPanel />
      </div>
    </section>
  );
}

function MetricGrid() {
  return (
    <div className="mt-4 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {resultMetrics.map(({ icon: Icon, label, tone, unit, value }) => (
        <Card className="grid min-h-[96px] grid-cols-[54px_1fr] items-center gap-4 bg-white p-4 shadow-none" key={label}>
          <span
            className={cn(
              "grid size-12 place-items-center rounded-lg",
              tone === "green" && "bg-green-50 text-brand-green",
              tone === "blue" && "bg-blue-50 text-brand-blue",
              tone === "purple" && "bg-violet-50 text-violet-600",
              tone === "orange" && "bg-orange-50 text-orange-500"
            )}
          >
            <Icon size={30} />
          </span>
          <span>
            <small className="block text-xs font-bold text-brand-muted">{label}</small>
            <strong className="mt-1 block text-2xl font-extrabold text-brand-navy">
              {value} <span className="text-base font-bold">{unit}</span>
            </strong>
          </span>
        </Card>
      ))}
    </div>
  );
}

function SavingsChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedYear, setSelectedYear] = useState(5);
  const chart = { left: 20, right: 230, top: 9, bottom: 74, zeroY: 48 };
  const maxYear = 15;
  const minValue = -20;
  const maxValue = 30;
  const data = [
    { year: 0, value: -7 },
    { year: 1, value: -11 },
    { year: 2, value: -11 },
    { year: 3, value: -7 },
    { year: 4, value: -4 },
    { year: 5, value: -2.6 },
    { year: 6, value: -1.5 },
    { year: 7, value: 0.4 },
    { year: 8, value: 3.2 },
    { year: 9, value: 5.6 },
    { year: 10, value: 8.3 },
    { year: 11, value: 11.4 },
    { year: 12, value: 13.7 },
    { year: 13, value: 17.4 },
    { year: 14, value: 20.7 },
    { year: 15, value: 23.6 }
  ];
  const xForYear = (year: number) => chart.left + (year / maxYear) * (chart.right - chart.left);
  const yForValue = (value: number) => chart.bottom - ((value - minValue) / (maxValue - minValue)) * (chart.bottom - chart.top);
  const points = data.map(({ year, value }) => [xForYear(year), yForValue(value)]);
  const path = points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const selectedPoint = data[selectedYear];
  const selectedX = xForYear(selectedPoint.year);
  const selectedY = yForValue(selectedPoint.value);
  const tooltipX = Math.min(Math.max(selectedX - 16, chart.left + 4), chart.right - 36);

  const updateSelectedYear = (clientX: number) => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 248;
    const nextYear = Math.round(((x - chart.left) / (chart.right - chart.left)) * maxYear);
    setSelectedYear(Math.min(maxYear, Math.max(0, nextYear)));
  };

  return (
    <Card className="bg-white p-6 shadow-none">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-brand-navy">
        Tiết kiệm lũy kế (dòng tiền ròng) dự kiến trong 15 năm
        <Info size={16} className="text-brand-muted" />
      </h2>
      <div className="mt-4 h-[285px]">
        <svg
          ref={svgRef}
          viewBox="0 0 248 92"
          className="h-full w-full cursor-ew-resize touch-none select-none overflow-visible"
          role="img"
          tabIndex={0}
          aria-label={`Tiết kiệm lũy kế năm ${selectedPoint.year}: ${selectedPoint.value.toLocaleString("vi-VN")} tỷ VND`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            updateSelectedYear(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1 || event.pointerType === "touch") {
              updateSelectedYear(event.clientX);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setSelectedYear((year) => Math.max(0, year - 1));
            }

            if (event.key === "ArrowRight") {
              event.preventDefault();
              setSelectedYear((year) => Math.min(maxYear, year + 1));
            }
          }}
        >
          {[9, 22, 35, 48, 61].map((y) => (
            <line key={y} x1="18" x2="232" y1={y} y2={y} stroke="#dbe6f6" strokeDasharray="2 3" strokeWidth="0.35" />
          ))}
          <line x1="18" x2="232" y1="48" y2="48" stroke="#b9c7de" strokeWidth="0.45" />
          <path d={`${path} L 230 48 L 20 48 Z`} fill="rgba(7,91,234,0.08)" />
          <path d={path} fill="none" stroke="#075BEA" strokeWidth="0.95" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.15" fill="#075BEA" />
          ))}
          <line x1={selectedX} x2={selectedX} y1="30" y2="72" stroke="#8fb7ff" strokeDasharray="1.5 2" strokeWidth="0.45" />
          <circle cx={selectedX} cy={selectedY} r="2.1" fill="#075BEA" stroke="#ffffff" strokeWidth="0.8" />
          <foreignObject x="-1000" y="-1000" width="32" height="12">
            <div className="rounded bg-blue-50 px-1 py-0.5 text-[3.2px] font-bold leading-tight text-brand-blue shadow-sm">Điểm hòa vốn<br />~ 5,1 năm</div>
          </foreignObject>
          <foreignObject x={tooltipX} y={Math.max(17, selectedY - 21)} width="38" height="16" className="pointer-events-none">
            <div className="rounded bg-blue-50 px-1.5 py-1 text-[3.2px] font-bold leading-tight text-brand-blue shadow-sm">
              Năm {selectedPoint.year}<br />
              {selectedPoint.value.toLocaleString("vi-VN")} tỷ VND
            </div>
          </foreignObject>
          <text x="3" y="10" fontSize="3.2" fill="#627194">30</text>
          <text x="3" y="23" fontSize="3.2" fill="#627194">20</text>
          <text x="3" y="36" fontSize="3.2" fill="#627194">10</text>
          <text x="6" y="49" fontSize="3.2" fill="#627194">0</text>
          <text x="1" y="62" fontSize="3.2" fill="#627194">-10</text>
          <text x="1" y="75" fontSize="3.2" fill="#627194">-20</text>
          {[0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15].map((year) => (
            <text key={year} x={20 + year * 14} y="82" textAnchor="middle" fontSize="3.2" fill="#627194">
              {year}
            </text>
          ))}
          <text x="68" y="89" fontSize="3.2" fill="#627194">Năm</text>
          <text x="4" y="8" fontSize="3.2" fill="#627194">Tỷ VND</text>
          <rect x="64" y="85" width="18" height="6" fill="#fff" />
          <text x="122" y="89" fontSize="3.2" fill="#627194">Năm</text>
          <rect x="0" y="3" width="18" height="10" fill="#fff" />
          <text x="4" y="6" fontSize="3.2" fill="#627194">Tỷ VND</text>
          <text x="3" y="12" fontSize="3.2" fill="#627194">30</text>
        </svg>
      </div>
    </Card>
  );
}

function AssumptionSummary() {
  return (
    <Card className="bg-white p-6 shadow-none">
      <h2 className="text-lg font-extrabold text-brand-navy">Giả định chính (mặc định tối ưu)</h2>
      <div className="mt-4 grid gap-3">
        {assumptionRows.map(([label, value]) => (
          <div className="grid grid-cols-[22px_1fr_auto] items-center gap-2 text-sm font-semibold text-brand-muted" key={label}>
            <CheckCircle2 className="text-brand-green" size={18} />
            <span>{label}</span>
            <strong className="text-brand-navy">{value}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
