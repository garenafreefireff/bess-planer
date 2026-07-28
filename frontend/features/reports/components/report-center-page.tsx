"use client";

import { ArrowRight, BookOpen, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { REPORT_TYPE_CARDS } from "../data/report.mock";
import { useReportCenter } from "../hooks/use-report-center";
import { AttentionPanel, LatestAnalysisCard } from "./latest-analysis-card";
import { RecentReportList } from "./recent-report-list";
import { ReportEmptyState } from "./report-empty-state";
import { ReportFilterBar } from "./report-filter-bar";
import { ReportSummaryStrip } from "./report-summary-strip";
import { ReportTypeCard } from "./report-type-card";

export function ReportCenterPage() {
  const {
    attentionItems,
    filteredReports,
    filters,
    hasActiveFilters,
    kpis,
    latestReport,
    resetFilters,
    setFilter
  } = useReportCenter();

  return (
    <section className="w-full pb-10 pt-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-muted">
            <Link className="hover:text-brand-blue" href="/customer-portal">Customer Portal</Link>
            <ArrowRight size={14} />
            <span className="text-brand-navy">Báo cáo</span>
          </div>
          <h1 className="mt-4 text-[34px] font-bold leading-tight text-brand-navy max-sm:text-[28px]">Trung tâm báo cáo</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-brand-muted">
            Quản lý báo cáo Quick Sizing, Sizing Lab và tài liệu phân tích của các dự án trong workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 max-sm:w-full">
          <Link className={buttonVariants({ variant: "secondary", className: "h-11 rounded-lg max-sm:flex-1" })} href="/bao-cao-mau">
            <BookOpen size={17} />
            Xem thư viện mẫu
          </Link>
          <Link className={buttonVariants({ className: "h-11 rounded-lg max-sm:flex-1" })} href="/quick-sizing">
            <Plus size={17} />
            Tạo báo cáo
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <ReportFilterBar filters={filters} hasActiveFilters={hasActiveFilters} onReset={resetFilters} onUpdate={setFilter} />
      </div>

      <div className="mt-5">
        <ReportSummaryStrip items={kpis} />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-xl:grid-cols-1">
        <div className="min-w-0">
          {filteredReports.length ? <RecentReportList reports={filteredReports} /> : <ReportEmptyState filtered={hasActiveFilters} />}
        </div>
        <aside className="grid h-fit gap-5">
          <LatestAnalysisCard report={latestReport} />
          <AttentionPanel items={attentionItems} />
        </aside>
      </div>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Loại báo cáo</h2>
            <p className="mt-1 text-sm font-medium text-brand-muted">Chọn luồng phù hợp với mức độ dữ liệu và mục tiêu phân tích.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
          {REPORT_TYPE_CARDS.map((item) => (
            <ReportTypeCard item={item} key={item.id} />
          ))}
        </div>
      </section>
    </section>
  );
}
