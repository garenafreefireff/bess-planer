import {
  ArrowDown,
  BarChart3,
  BatteryCharging,
  CircleDollarSign,
  FileText,
  Gauge,
  Lock,
  Scale,
  ShieldCheck,
  Zap
} from "lucide-react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { LogoStrip } from "@/features/landing/components/logo-strip";
import { ReportShowcase } from "@/features/report-samples/components/report-showcase";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const includedItems = [
  { title: "KPI tài chính", text: "NPV, IRR, Payback, LCOE và các chỉ số đầu tư quan trọng.", icon: CircleDollarSign, tone: "blue" },
  { title: "Sizing khuyến nghị", text: "Công suất BESS, P_max đề xuất và cấu hình tối ưu.", icon: BatteryCharging, tone: "green" },
  { title: "Biểu đồ dòng tiền", text: "Dòng tiền tích lũy 15 năm, nguồn thu & chi và điểm hòa vốn.", icon: BarChart3, tone: "purple" },
  { title: "So sánh kịch bản", text: "Đa kịch bản về giá điện, CAPEX, lãi suất và chính sách hỗ trợ.", icon: Scale, tone: "orange" },
  { title: "Kiểm tra dữ liệu", text: "Kiểm tra phụ tải, dữ liệu PV, ràng buộc & chất lượng dữ liệu.", icon: ShieldCheck, tone: "blue" },
  { title: "Phân tích biểu giá", text: "Phân tích biểu giá điện và tối ưu hóa chi phí theo thời gian.", icon: Gauge, tone: "green" },
  { title: "Trình bày chuyên nghiệp", text: "Bố cục chuẩn, biểu đồ đẹp, dễ đọc và dễ chia sẻ với nội bộ & đối tác.", icon: FileText, tone: "purple" }
];

const heroFeatureChips = ["PDF Export", "Executive Summary", "Technical Report", "Finance", "NPV", "CAPEX", "Cash Flow", "KPI"];

const heroMetrics = [
  { value: "20+", label: "Mẫu chỉ số" },
  { value: "1 Click", label: "Xuất PDF" },
  { value: "100%", label: "Đồng bộ dữ liệu" }
];

export function ReportSamplesPage() {
  return (
    <>
      <PublicHeader activeItem="Báo cáo mẫu" />
      <main>
        <section className="site-container grid min-h-[220px] grid-cols-[minmax(0,1fr)_360px] items-center gap-12 py-10 max-lg:grid-cols-1 max-lg:gap-8 max-md:py-8">
          <div className="max-w-[760px]">
            <span className="inline-flex h-8 items-center rounded-full border border-blue-100 bg-blue-50 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-blue">Report Library</span>
            <h1 className="mt-5 max-w-[760px] text-[52px] font-extrabold leading-[1.02] tracking-[-0.025em] text-brand-navy max-xl:text-[46px] max-md:text-[38px] max-sm:text-[32px]">
              Báo cáo BESS chuyên nghiệp cho doanh nghiệp
            </h1>
            <p className="mt-4 max-w-[650px] text-[16px] font-semibold leading-7 text-brand-muted max-sm:text-sm max-sm:leading-6">
              Thư viện báo cáo giúp đội kỹ thuật và lãnh đạo đọc nhanh kết quả sizing, tài chính và vận hành trên cùng một định dạng chuyên nghiệp.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className={buttonVariants({ className: "h-11 rounded-xl px-5 text-sm" })} href="#report-gallery">
                <ArrowDown size={16} />
                Xem Report Gallery
              </a>
              <a className={buttonVariants({ variant: "secondary", className: "h-11 rounded-xl px-5 text-sm" })} href="/quick-sizing">
                <Zap size={16} />
                Dùng thử Quick Sizing
              </a>
            </div>
            <div className="mt-5 flex max-w-[680px] flex-wrap gap-2">
              {heroFeatureChips.map((chip) => (
                <span className="rounded-full border border-brand-line bg-white px-3 py-1.5 text-xs font-bold text-brand-muted shadow-sm" key={chip}>
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              {heroMetrics.map((metric, index) => (
                <span className="contents" key={metric.label}>
                  {index > 0 ? <span className="h-9 w-px bg-brand-line max-sm:hidden" /> : null}
                  <span className="inline-flex items-baseline gap-2">
                    <strong className="text-[26px] font-extrabold leading-none text-brand-navy">{metric.value}</strong>
                    <small className="text-xs font-bold uppercase tracking-[0.08em] text-brand-muted">{metric.label}</small>
                  </span>
                </span>
              ))}
            </div>
          </div>
          <ReportHeroIllustration />
        </section>

        <ReportShowcase />

        <section className="site-container mt-2.5">
          <Card className="rounded-xl bg-white p-3.5 shadow-none">
            <h2 className="text-[15px] font-bold text-brand-navy">Báo cáo của chúng tôi bao gồm những gì?</h2>
            <div className="mt-3 grid grid-cols-7 divide-x divide-brand-line max-xl:grid-cols-3 max-xl:divide-x-0 max-xl:gap-3 max-sm:grid-cols-1">
              {includedItems.map((item) => (
                <InfoItem key={item.title} {...item} />
              ))}
            </div>
          </Card>
        </section>

        <section className="site-container mt-2.5">
          <div className="grid grid-cols-[220px_1fr_auto] items-center gap-5 overflow-hidden rounded-lg border border-brand-line bg-gradient-to-r from-blue-50/80 via-white to-green-50/50 px-4 py-2.5 max-lg:grid-cols-1">
            <div className="relative h-[58px] overflow-hidden rounded-md">
              <img className="h-full w-full object-cover object-[center_58%]" src="/bess-hero.png" alt="Nhà máy và hệ thống lưu trữ năng lượng BESS" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-white/10" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-brand-navy">Sẵn sàng bắt đầu đánh giá đầu tư BESS cho doanh nghiệp của bạn?</h2>
              <p className="mt-0.5 text-[11px] font-semibold leading-4 text-brand-muted">
                Sử dụng Quick Sizing để ước tính nhanh hoặc đăng nhập BESS Planner để phân tích chuyên sâu và xuất báo cáo chi tiết.
              </p>
            </div>
            <div className="flex gap-3 max-sm:flex-col">
              <a className={buttonVariants({ variant: "secondary", className: "h-9 min-w-[185px] text-xs" })} href="/quick-sizing">
                <Zap size={16} />
                Dùng Quick Sizing
              </a>
              <a className={buttonVariants({ variant: "green", className: "h-9 min-w-[220px] text-xs" })} href="/customer-portal/du-an-cua-toi">
                <Lock size={15} />
                Đăng nhập BESS Planner
              </a>
            </div>
          </div>
        </section>

        <LogoStrip />
      </main>
      <PublicFooter />
    </>
  );
}

function ReportHeroIllustration() {
  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[360px] max-lg:h-[190px] max-lg:max-w-[320px] max-sm:hidden">
      <div className="absolute inset-x-8 bottom-0 h-12 rounded-[50%] bg-blue-100/60 blur-2xl" />
      <div className="absolute left-8 top-10 h-[150px] w-[210px] rotate-[-8deg] rounded-[18px] border border-[#E8EEF7] bg-white shadow-[0_18px_48px_rgba(15,43,91,0.10)]" />
      <div className="absolute right-6 top-7 h-[158px] w-[220px] rotate-[7deg] rounded-[18px] border border-[#E8EEF7] bg-white shadow-[0_18px_48px_rgba(15,43,91,0.10)]" />
      <div className="absolute left-1/2 top-1 h-[180px] w-[242px] -translate-x-1/2 rounded-[22px] border border-blue-100 bg-white p-5 shadow-[0_24px_70px_rgba(15,43,91,0.14)]">
        <div className="flex items-center justify-between">
          <span className="rounded-md border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-extrabold text-red-500">PDF</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">EnergyInsight</span>
        </div>
        <div className="mt-5 h-3 w-28 rounded-full bg-brand-navy/85" />
        <div className="mt-3 h-2 w-40 rounded-full bg-slate-200" />
        <div className="mt-2 h-2 w-32 rounded-full bg-slate-200" />
        <div className="mt-7 grid grid-cols-3 gap-2">
          <div className="h-10 rounded-xl bg-blue-50" />
          <div className="h-10 rounded-xl bg-green-50" />
          <div className="h-10 rounded-xl bg-violet-50" />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, text, title, tone }: (typeof includedItems)[number]) {
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <Icon className={cn("mb-2", tone === "green" ? "text-brand-green" : tone === "orange" ? "text-orange-500" : tone === "purple" ? "text-violet-600" : "text-brand-blue")} size={27} />
      <strong className="block text-[10px] leading-4 text-brand-navy">{title}</strong>
      <p className="mt-0.5 text-[9px] font-semibold leading-[1.45] text-brand-muted">{text}</p>
    </div>
  );
}
