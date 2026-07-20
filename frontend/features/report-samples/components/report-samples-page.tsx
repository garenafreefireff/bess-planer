import {
  BarChart3,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
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
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const reportCards = [
  {
    title: "Quick Sizing Summary",
    text: "Tổng hợp nhanh kết quả sizing và hiệu quả tài chính.",
    icon: Zap,
    tone: "blue",
    bullets: ["KPI tài chính chính", "Sizing & P_max đề xuất", "Dòng tiền 15 năm"]
  },
  {
    title: "BESS Planner Technical Report",
    text: "Báo cáo kỹ thuật chi tiết từ BESS Planner về cấu hình và vận hành hệ thống.",
    icon: BatteryCharging,
    tone: "green",
    bullets: ["Cấu hình hệ thống", "Phân tích vận hành", "Kiểm tra ràng buộc kỹ thuật"]
  },
  {
    title: "BESS Finance Dashboard",
    text: "Dashboard tài chính trực quan cho lãnh đạo và nhà đầu tư.",
    icon: BarChart3,
    tone: "purple",
    bullets: ["NPV, IRR, Payback", "Biểu đồ dòng tiền", "So sánh kịch bản"]
  },
  {
    title: "Monthly Sizing & P_max",
    text: "Sizing & P_max theo tháng phù hợp với biến động phụ tải.",
    icon: CalendarDays,
    tone: "orange",
    bullets: ["P_max theo tháng", "Khuyến nghị sizing", "Tải trọng & peak shaving"]
  }
];

const includedItems = [
  { title: "KPI tài chính", text: "NPV, IRR, Payback, LCOE và các chỉ số đầu tư quan trọng.", icon: CircleDollarSign, tone: "blue" },
  { title: "Sizing khuyến nghị", text: "Công suất BESS, P_max đề xuất và cấu hình tối ưu.", icon: BatteryCharging, tone: "green" },
  { title: "Biểu đồ dòng tiền", text: "Dòng tiền tích lũy 15 năm, nguồn thu & chi và điểm hòa vốn.", icon: BarChart3, tone: "purple" },
  { title: "So sánh kịch bản", text: "Đa kịch bản về giá điện, CAPEX, lãi suất và chính sách hỗ trợ.", icon: Scale, tone: "orange" },
  { title: "Kiểm tra dữ liệu", text: "Kiểm tra phụ tải, dữ liệu PV, ràng buộc & chất lượng dữ liệu.", icon: ShieldCheck, tone: "blue" },
  { title: "Phân tích biểu giá", text: "Phân tích biểu giá điện và tối ưu hóa chi phí theo thời gian.", icon: Gauge, tone: "green" },
  { title: "Trình bày chuyên nghiệp", text: "Bố cục chuẩn, biểu đồ đẹp, dễ đọc và dễ chia sẻ với nội bộ & đối tác.", icon: FileText, tone: "purple" }
];

export function ReportSamplesPage() {
  return (
    <>
      <PublicHeader activeItem="Báo cáo mẫu" />
      <main>
        <section className="site-container grid min-h-[350px] grid-cols-[0.72fr_1fr] items-center gap-10 pt-6 max-lg:grid-cols-1">
          <div>
            <span className="rounded-full bg-green-50 px-4 py-1.5 text-xs font-extrabold uppercase text-brand-green">Báo cáo mẫu</span>
            <h1 className="mt-5 text-[46px] font-extrabold leading-[1.08] text-brand-navy max-xl:text-4xl">
              Báo cáo mẫu <span className="text-brand-green">BESS</span>
              <br />
              cho doanh nghiệp
            </h1>
            <p className="mt-4 max-w-[560px] text-base font-semibold leading-7 text-brand-muted">
              Khám phá các mẫu báo cáo và dashboard chuyên nghiệp được tạo từ Quick Sizing và BESS Planner.
              Xem trước định dạng, chỉ số và phân tích trước khi bạn đầu tư chọn và lập kế hoạch.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-8 max-sm:grid-cols-1">
              <HeroTrust icon={FileText} title="Minh bạch & rõ ràng" text="Báo cáo trực quan, dễ hiểu, phù hợp với mọi đối tượng." />
              <HeroTrust icon={ShieldCheck} title="Đáng tin cậy" text="Phương pháp tính chuẩn, dữ liệu minh bạch và kiểm tra chặt chẽ." />
            </div>
          </div>
          <ReportHeroPreview />
        </section>

        <section className="site-container">
          <Card className="bg-white p-5 shadow-none">
            <h2 className="text-lg font-extrabold text-brand-navy">Danh mục báo cáo mẫu</h2>
            <div className="mt-4 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
              {reportCards.map((item) => (
                <ReportCard key={item.title} {...item} />
              ))}
            </div>
          </Card>
        </section>

        <section className="site-container mt-3">
          <Card className="bg-white p-5 shadow-none">
            <h2 className="text-lg font-extrabold text-brand-navy">Báo cáo của chúng tôi bao gồm những gì?</h2>
            <div className="mt-4 grid grid-cols-7 divide-x divide-brand-line max-xl:grid-cols-3 max-xl:divide-x-0 max-xl:gap-4 max-sm:grid-cols-1">
              {includedItems.map((item) => (
                <InfoItem key={item.title} {...item} />
              ))}
            </div>
          </Card>
        </section>

        <section className="site-container mt-3">
          <div className="grid grid-cols-[260px_1fr_auto] items-center gap-6 rounded-lg border border-brand-line bg-blue-50/70 px-6 py-4 max-lg:grid-cols-1">
            <div className="relative h-16 overflow-hidden rounded-md bg-gradient-to-r from-blue-50 to-green-50">
              <div className="absolute bottom-2 left-6 h-8 w-24 rounded-sm border border-blue-200 bg-white shadow-sm" />
              <div className="absolute bottom-2 left-36 h-10 w-20 rounded-sm border border-blue-200 bg-white shadow-sm" />
              <div className="absolute right-12 top-1 h-16 w-px bg-brand-navy/25" />
              <Zap className="absolute bottom-7 left-32 text-brand-green" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-brand-navy">Sẵn sàng bắt đầu đánh giá đầu tư BESS cho doanh nghiệp của bạn?</h2>
              <p className="mt-1 text-sm font-semibold text-brand-muted">
                Sử dụng Quick Sizing để ước tính nhanh hoặc đăng nhập BESS Planner để phân tích chuyên sâu và xuất báo cáo chi tiết.
              </p>
            </div>
            <div className="flex gap-4 max-sm:flex-col">
              <a className={buttonVariants({ variant: "secondary", className: "min-w-[210px]" })} href="/quick-sizing">
                <Zap size={18} />
                Dùng Quick Sizing
              </a>
              <a className={buttonVariants({ variant: "green", className: "min-w-[250px]" })} href="/customer-portal">
                <Lock size={17} />
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

function ReportHeroPreview() {
  return (
    <div className="relative min-h-[320px]">
      <div className="absolute left-0 top-2 h-[292px] w-[560px] rounded-xl border border-brand-line bg-white p-6 shadow-panel max-xl:w-[500px] max-md:relative max-md:w-full">
        <div className="flex items-center gap-3 text-brand-navy">
          <BarChart3 className="text-brand-green" size={24} />
          <strong className="text-lg">BESS Project Report</strong>
          <span className="ml-auto text-[10px] font-bold text-brand-muted">EnergyInsight</span>
        </div>
        <h3 className="mt-5 text-sm font-extrabold text-brand-navy">Executive Summary</h3>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {["18,7 tỷ VND", "18,6 %", "5,1 năm", "2,18 tỷ VND"].map((value) => (
            <div className="rounded-lg border border-brand-line p-3" key={value}>
              <small className="block text-[10px] font-bold text-brand-muted">KPI dự án</small>
              <strong className="mt-2 block text-lg text-brand-navy">{value}</strong>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <MiniLineChart />
          <MiniDonut />
        </div>
      </div>
      <div className="absolute right-20 top-4 h-[292px] w-[280px] rotate-[-5deg] rounded-lg border border-brand-line bg-white p-4 shadow-panel max-xl:right-4">
        <h3 className="text-sm font-extrabold text-brand-navy">Kết quả sizing & P_max</h3>
        <MiniLineChart small />
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 6 }).map((_, index) => <span className="h-2 rounded bg-blue-100" key={index} />)}
        </div>
      </div>
      <div className="absolute right-0 top-14 h-[250px] w-[245px] rotate-[8deg] rounded-lg border border-brand-line bg-white p-4 shadow-panel">
        <h3 className="text-sm font-extrabold text-brand-navy">Phân tích biểu giá & hệ thống</h3>
        <div className="mt-4 flex h-24 items-end gap-2">
          {[42, 58, 80, 50, 72, 98, 60].map((h) => <span className="w-6 rounded-t bg-blue-500/75" style={{ height: h }} key={h} />)}
        </div>
      </div>
      <div className="absolute bottom-6 right-3 flex items-center gap-4 rounded-xl border border-brand-line bg-white px-5 py-4 shadow-panel">
        <span className="grid size-12 place-items-center rounded-md border-2 border-red-500 text-xs font-black text-red-500">PDF</span>
        <strong className="text-sm leading-5 text-brand-navy">Báo cáo PDF<br />dễ dàng tải về</strong>
      </div>
    </div>
  );
}

function HeroTrust({ icon: Icon, text, title }: { icon: typeof FileText; text: string; title: string }) {
  return (
    <div className="flex gap-4">
      <Icon className="shrink-0 text-brand-blue" size={34} />
      <span>
        <strong className="block text-sm text-brand-navy">{title}</strong>
        <small className="mt-1 block text-sm font-semibold leading-5 text-brand-muted">{text}</small>
      </span>
    </div>
  );
}

function ReportCard({ bullets, icon: Icon, text, title, tone }: (typeof reportCards)[number]) {
  return (
    <div className="grid min-h-[178px] grid-cols-[1fr_150px] gap-4 rounded-lg border border-brand-line p-4">
      <div>
        <h3 className="flex items-center gap-3 text-sm font-extrabold text-brand-navy">
          <Icon className={cn(tone === "green" ? "text-brand-green" : tone === "orange" ? "text-orange-500" : tone === "purple" ? "text-violet-600" : "text-brand-blue")} size={24} />
          {title}
        </h3>
        <p className="mt-3 text-xs font-semibold leading-5 text-brand-muted">{text}</p>
        <div className="mt-3 grid gap-1.5">
          {bullets.map((bullet) => (
            <span className="flex items-center gap-2 text-xs font-semibold text-brand-navy" key={bullet}>
              <CheckCircle2 className="text-brand-blue" size={13} />
              {bullet}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <a className={buttonVariants({ variant: "secondary", size: "sm", className: "h-8 px-4 text-xs" })} href="#">
            Xem mẫu
          </a>
          <a className={buttonVariants({ size: "sm", className: cn("h-8 px-4 text-xs text-white", tone === "green" ? "bg-brand-green" : tone === "orange" ? "bg-orange-500" : tone === "purple" ? "bg-violet-600" : "bg-brand-blue") })} href="#">
            <Download size={14} />
            Tải mẫu PDF
          </a>
        </div>
      </div>
      <ReportThumb tone={tone} />
    </div>
  );
}

function ReportThumb({ tone }: { tone: string }) {
  return (
    <div className="rounded-md border border-brand-line bg-white p-3">
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 4 }).map((_, index) => <span className="h-4 rounded bg-blue-50" key={index} />)}
      </div>
      <MiniLineChart small />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className={cn("h-12 rounded", tone === "green" ? "bg-green-100" : tone === "orange" ? "bg-orange-100" : tone === "purple" ? "bg-violet-100" : "bg-blue-100")} />
        <div className="grid gap-1">
          {Array.from({ length: 4 }).map((_, index) => <span className="h-2 rounded bg-slate-100" key={index} />)}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, text, title, tone }: (typeof includedItems)[number]) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <Icon className={cn("mb-3", tone === "green" ? "text-brand-green" : tone === "orange" ? "text-orange-500" : tone === "purple" ? "text-violet-600" : "text-brand-blue")} size={34} />
      <strong className="block text-sm text-brand-navy">{title}</strong>
      <p className="mt-1 text-xs font-semibold leading-5 text-brand-muted">{text}</p>
    </div>
  );
}

function MiniLineChart({ small = false }: { small?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-brand-line p-3", small ? "mt-3 h-24" : "h-[118px]")}>
      <svg viewBox="0 0 180 80" className="h-full w-full">
        <path d="M8 62 C28 50 36 38 54 42 C72 46 76 20 96 26 C122 34 130 18 164 12" fill="none" stroke="#075BEA" strokeWidth="3" />
        <path d="M8 62 C28 50 36 38 54 42 C72 46 76 20 96 26 C122 34 130 18 164 12 L164 72 L8 72 Z" fill="rgba(7,91,234,0.09)" />
        {[20, 45, 70, 95, 120, 145].map((x, index) => (
          <rect x={x} y={58 - index * 6} width="7" height={20 + index * 5} fill="#0ca34b55" key={x} />
        ))}
      </svg>
    </div>
  );
}

function MiniDonut() {
  return (
    <div className="grid h-[118px] grid-cols-[100px_1fr] items-center rounded-lg border border-brand-line p-3">
      <div className="grid size-20 place-items-center rounded-full bg-[conic-gradient(#075BEA_0_45%,#0ca34b_45%_70%,#69b8ff_70%_88%,#dbe7f8_88%_100%)]">
        <div className="grid size-12 place-items-center rounded-full bg-white text-center text-xs font-black text-brand-navy">11,2 tỷ</div>
      </div>
      <div className="grid gap-2 text-[10px] font-semibold text-brand-muted">
        <span>Pin/BESS 50%</span>
        <span>PCS 18%</span>
        <span>Hệ thống phụ trợ 12%</span>
      </div>
    </div>
  );
}
