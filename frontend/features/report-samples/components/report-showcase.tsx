"use client";

import Image from "next/image";
import { useState } from "react";
import { BarChart3, CalendarDays, Download, ExternalLink, LayoutGrid, Zap, type LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReportTone = "blue" | "green" | "purple" | "orange";

interface GalleryReport {
  title: string;
  text: string;
  icon: LucideIcon;
  tone: ReportTone;
  image: string;
  bullets: string[];
}

const reportCards: GalleryReport[] = [
  {
    title: "Quick Sizing Summary",
    text: "Tổng hợp nhanh kết quả sizing và hiệu quả tài chính.",
    icon: Zap,
    tone: "blue",
    image: "/Quick-Sizing-Summary.png",
    bullets: ["KPI tài chính chính", "Sizing & P_max đề xuất", "Dòng tiền 15 năm"]
  },
  {
    title: "BESS Planner Technical Report",
    text: "Báo cáo kỹ thuật chi tiết từ BESS Planner về cấu hình và vận hành hệ thống.",
    icon: LayoutGrid,
    tone: "green",
    image: "/BESS-Planner-Technical-Report.png",
    bullets: ["Cấu hình hệ thống", "Phân tích vận hành", "Kiểm tra ràng buộc kỹ thuật"]
  },
  {
    title: "BESS Finance Dashboard",
    text: "Dashboard tài chính trực quan cho lãnh đạo và nhà đầu tư.",
    icon: BarChart3,
    tone: "purple",
    image: "/BESS-Finance-Dashboard.png",
    bullets: ["NPV, IRR, Payback", "Biểu đồ dòng tiền", "So sánh kịch bản"]
  },
  {
    title: "Monthly Sizing & P_max",
    text: "Sizing & P_max theo tháng phù hợp với biến động phụ tải.",
    icon: CalendarDays,
    tone: "orange",
    image: "/Monthly-Sizing-&-P_max.png",
    bullets: ["P_max theo tháng", "Khuyến nghị sizing", "Tải trọng & peak shaving"]
  }
];

const reportGalleryMeta: Record<string, { badge: string; chips: string[] }> = {
  "Quick Sizing Summary": {
    badge: "Quick Sizing",
    chips: ["KPI", "Sizing", "Pmax", "Cash Flow"]
  },
  "BESS Planner Technical Report": {
    badge: "Technical",
    chips: ["System", "Operation", "Constraints", "BESS"]
  },
  "BESS Finance Dashboard": {
    badge: "Finance",
    chips: ["NPV", "IRR", "CAPEX", "Scenario"]
  },
  "Monthly Sizing & P_max": {
    badge: "Monthly",
    chips: ["Monthly", "Pmax", "Peak", "Load"]
  }
};

const reportToneStyles = {
  blue: {
    accent: "text-brand-blue",
    badge: "border-blue-100 bg-blue-50 text-brand-blue",
    chip: "border-blue-100 bg-blue-50/70 text-brand-blue",
    primary: "bg-brand-blue hover:bg-brand-blue/90",
    active: "border-brand-blue shadow-[0_14px_32px_rgba(7,91,234,0.14)]"
  },
  green: {
    accent: "text-brand-green",
    badge: "border-green-100 bg-green-50 text-brand-green",
    chip: "border-green-100 bg-green-50/70 text-brand-green",
    primary: "bg-brand-green hover:bg-brand-green/90",
    active: "border-brand-green shadow-[0_14px_32px_rgba(12,163,75,0.14)]"
  },
  purple: {
    accent: "text-violet-600",
    badge: "border-violet-100 bg-violet-50 text-violet-600",
    chip: "border-violet-100 bg-violet-50/70 text-violet-600",
    primary: "bg-violet-600 hover:bg-violet-600/90",
    active: "border-violet-300 shadow-[0_14px_32px_rgba(124,58,237,0.14)]"
  },
  orange: {
    accent: "text-orange-500",
    badge: "border-orange-100 bg-orange-50 text-orange-600",
    chip: "border-orange-100 bg-orange-50/70 text-orange-600",
    primary: "bg-orange-500 hover:bg-orange-500/90",
    active: "border-orange-300 shadow-[0_14px_32px_rgba(249,115,22,0.14)]"
  }
};

export function ReportShowcase() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeReport = reportCards[selectedIndex] ?? reportCards[0];

  return (
    <section className="site-container" id="report-gallery">
      <Card className="rounded-[32px] border border-[#E8EEF7] bg-[#F8FBFF] px-6 py-7 shadow-none max-sm:px-4 max-sm:py-5">
        <div className="flex items-start justify-between gap-6 max-md:flex-col max-md:gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-blue">Templates</span>
            <h2 className="mt-2 text-[32px] font-extrabold leading-tight text-brand-navy max-sm:text-[25px]">Report Gallery</h2>
            <p className="mt-2 max-w-[680px] text-sm font-semibold leading-6 text-brand-muted">
              Khám phá các báo cáo được tạo từ Quick Sizing và BESS Planner.
            </p>
          </div>
          <span className="inline-flex h-9 shrink-0 items-center rounded-full border border-blue-100 bg-white px-4 text-xs font-bold text-brand-blue shadow-sm">
            {reportCards.length} Reports
          </span>
        </div>

        <div className="mt-8 max-sm:mt-6">
          <div className="mx-auto max-w-[1020px]">
            <ReportPreview report={activeReport} />
            <ReportMeta report={activeReport} />
          </div>
          <ReportThumbnailList activeIndex={selectedIndex} reports={reportCards} onSelect={setSelectedIndex} />
        </div>
      </Card>

      <style jsx global>{`
        @keyframes reportShowcaseIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

function ReportPreview({ report }: { report: GalleryReport }) {
  return (
    <a
      key={`${report.title}-preview`}
      className="relative mx-auto block aspect-[16/10] w-full rounded-[26px] border border-[#E8EEF7] bg-white p-5 shadow-[0_24px_70px_rgba(15,43,91,0.12)] transition duration-200 hover:border-brand-blue/30 motion-safe:animate-[reportShowcaseIn_250ms_ease-out] max-md:aspect-[4/3] max-sm:p-3"
      href={report.image}
      target="_blank"
      rel="noreferrer"
      aria-label={`Preview ${report.title}`}
    >
      <span className="absolute left-6 top-6 z-10 rounded-md border border-red-100 bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-red-500 shadow-sm max-sm:left-4 max-sm:top-4">
        PDF
      </span>
      <span className="absolute bottom-6 right-6 z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 max-sm:bottom-4 max-sm:right-4">
        EnergyInsight
      </span>
      <Image
        className="rounded-[18px] object-contain p-3 transition duration-200 hover:scale-[1.02] max-sm:p-2"
        src={report.image}
        alt={`${report.title} preview`}
        fill
        sizes="(max-width: 768px) 100vw, 80vw"
        priority={report.title === reportCards[0].title}
      />
    </a>
  );
}

function ReportMeta({ report }: { report: GalleryReport }) {
  const meta = reportGalleryMeta[report.title] ?? { badge: "Report", chips: report.bullets.slice(0, 4) };
  const toneStyle = reportToneStyles[report.tone];
  const Icon = report.icon;

  return (
    <div key={`${report.title}-meta`} className="mx-auto mt-7 max-w-[760px] text-center motion-safe:animate-[reportShowcaseIn_250ms_ease-out] max-sm:mt-5 max-sm:text-left">
      <div className="flex items-center justify-center gap-3 max-sm:justify-start">
        <span className={cn("inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-bold", toneStyle.badge)}>
          {meta.badge}
        </span>
        <Icon className={toneStyle.accent} size={21} />
      </div>
      <h3 className="mt-4 text-[30px] font-extrabold leading-tight text-brand-navy max-sm:text-[23px]">{report.title}</h3>
      <p className="mx-auto mt-2 max-w-[620px] text-sm font-semibold leading-6 text-brand-muted max-sm:mx-0">{report.text}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2 max-sm:justify-start">
        {meta.chips.map((chip) => (
          <span className={cn("inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold", toneStyle.chip)} key={chip}>
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3 max-sm:justify-start">
        <a className={buttonVariants({ variant: "secondary", className: "h-11 min-w-[132px] rounded-xl px-5 text-sm" })} href={report.image} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Preview
        </a>
        <a className={buttonVariants({ className: cn("h-11 min-w-[158px] rounded-xl px-5 text-sm text-white", toneStyle.primary) })} href={report.image} download>
          <Download size={16} />
          Download PDF
        </a>
      </div>
    </div>
  );
}

function ReportThumbnailList({
  activeIndex,
  reports,
  onSelect
}: {
  activeIndex: number;
  reports: GalleryReport[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mt-8 flex gap-3 overflow-x-auto pb-2 max-sm:mt-6">
      {reports.map((report, index) => (
        <ReportThumbnail active={activeIndex === index} index={index} key={report.title} report={report} onSelect={onSelect} />
      ))}
    </div>
  );
}

function ReportThumbnail({
  active,
  index,
  report,
  onSelect
}: {
  active: boolean;
  index: number;
  report: GalleryReport;
  onSelect: (index: number) => void;
}) {
  const meta = reportGalleryMeta[report.title] ?? { badge: "Report", chips: report.bullets.slice(0, 4) };
  const toneStyle = reportToneStyles[report.tone];

  return (
    <button
      className={cn(
        "group grid min-w-[210px] flex-1 grid-cols-[72px_minmax(0,1fr)] items-center gap-3 rounded-[18px] border border-[#E8EEF7] bg-white p-3 text-left shadow-[0_6px_18px_rgba(15,43,91,0.04)] transition duration-200 hover:scale-[1.02] hover:shadow-[0_10px_28px_rgba(15,43,91,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/25 max-sm:min-w-[230px]",
        active ? toneStyle.active : "hover:border-slate-300"
      )}
      type="button"
      onClick={() => onSelect(index)}
      aria-pressed={active}
    >
      <span className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        <Image className="object-contain p-1.5" src={report.image} alt="" fill sizes="72px" loading="lazy" />
      </span>
      <span className="min-w-0">
        <span className={cn("inline-flex h-5 items-center rounded-full border px-2 text-[9px] font-bold", active ? toneStyle.badge : "border-slate-200 bg-slate-50 text-brand-muted")}>
          {meta.badge}
        </span>
        <strong className="mt-2 block truncate text-[12px] leading-4 text-brand-navy">{report.title}</strong>
      </span>
    </button>
  );
}
