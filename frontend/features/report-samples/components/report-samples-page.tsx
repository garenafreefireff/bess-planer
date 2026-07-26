import {
  BarChart3,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileText,
  Gauge,
  LayoutGrid,
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
        <section className="site-container grid min-h-[286px] grid-cols-[0.76fr_1.24fr] items-center gap-6 py-4 max-lg:grid-cols-1">
          <div className="max-w-[610px]">
            <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">Báo cáo mẫu</span>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.04] tracking-[-0.025em] text-brand-navy max-xl:text-[36px]">
              Báo cáo mẫu <span className="text-brand-green">BESS</span>
              <br />
              cho doanh nghiệp
            </h1>
            <p className="mt-3 max-w-[560px] text-[13px] font-semibold leading-[1.65] text-brand-muted">
              Khám phá các mẫu báo cáo và dashboard chuyên nghiệp được tạo từ Quick Sizing và BESS Planner. Xem trước định dạng, chỉ số và phân tích trước khi bạn bắt đầu tính toán và lập kế hoạch.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-6 max-sm:grid-cols-1">
              <HeroTrust icon={FileText} title="Minh bạch & rõ ràng" text="Báo cáo trực quan, dễ hiểu, phù hợp với mọi đối tượng." tone="blue" />
              <HeroTrust icon={ShieldCheck} title="Đáng tin cậy" text="Phương pháp tính chuẩn, dữ liệu minh bạch và kiểm tra chặt chẽ." tone="green" />
            </div>
          </div>
          <ReportHeroPreview />
        </section>

        <section className="site-container">
          <Card className="rounded-xl bg-white p-3.5 shadow-none">
            <h2 className="text-[15px] font-bold text-brand-navy">Danh mục báo cáo mẫu</h2>
            <div className="mt-3 grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              {reportCards.map((item) => (
                <ReportCard key={item.title} {...item} />
              ))}
            </div>
          </Card>
        </section>

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

function ReportHeroPreview() {
  return (
    <div className="relative min-h-[278px] overflow-hidden max-md:min-h-0">
      <div className="pointer-events-none absolute inset-x-[2%] bottom-1 h-20 rounded-[50%] bg-blue-100/35 blur-3xl max-md:hidden" />

      <div className="absolute right-[-2%] top-[34px] z-0 h-[206px] w-[18%] rotate-[8deg] rounded-xl border border-blue-50 bg-white shadow-[0_10px_26px_rgba(15,43,91,0.07)] max-md:hidden" />
      <div className="absolute right-[2%] top-[24px] z-[1] h-[218px] w-[19%] rotate-[6deg] rounded-xl border border-blue-50 bg-white shadow-[0_10px_28px_rgba(15,43,91,0.08)] max-md:hidden" />

      <img
        className="absolute left-[1%] top-[7px] z-30 block w-[60%] max-w-none drop-shadow-[0_18px_32px_rgba(15,43,91,0.13)] max-md:relative max-md:left-0 max-md:top-0 max-md:w-full"
        src="/hero-card-1.png"
        alt="BESS Project Report executive summary"
      />

      <img
        className="absolute left-[56%] top-0 z-20 block w-[34%] max-w-none -rotate-[3deg] drop-shadow-[0_16px_28px_rgba(15,43,91,0.12)] max-md:hidden"
        src="/hero-card-2.png"
        alt="Kết quả sizing và P max"
      />

      <img
        className="absolute right-[1%] top-[38px] z-10 block w-[25%] max-w-none rotate-[5deg] drop-shadow-[0_14px_24px_rgba(15,43,91,0.10)] max-md:hidden"
        src="/hero-card-3.png"
        alt="Phân tích biểu giá và hệ thống"
      />

      <div className="absolute bottom-[8px] right-[4px] z-40 flex items-center gap-3 rounded-xl border border-brand-line bg-white/95 px-3.5 py-2.5 shadow-[0_10px_24px_rgba(15,43,91,0.11)] backdrop-blur max-md:hidden">
        <span className="grid size-10 place-items-center rounded-md border-2 border-red-500 text-[10px] font-bold text-red-500">PDF</span>
        <strong className="text-[11px] leading-4 text-brand-navy">Báo cáo PDF<br />dễ dàng tải về</strong>
      </div>
    </div>
  );
}

function HeroTrust({ icon: Icon, text, title, tone }: { icon: typeof FileText; text: string; title: string; tone: "blue" | "green" }) {
  return (
    <div className="flex gap-3">
      <Icon className={cn("shrink-0", tone === "green" ? "text-brand-green" : "text-brand-blue")} size={29} />
      <span>
        <strong className="block text-[12px] text-brand-navy">{title}</strong>
        <small className="mt-0.5 block text-[10px] font-semibold leading-4 text-brand-muted">{text}</small>
      </span>
    </div>
  );
}

function ReportCard({ bullets, icon: Icon, image, text, title, tone }: (typeof reportCards)[number]) {
  const accent = tone === "green" ? "text-brand-green" : tone === "orange" ? "text-orange-500" : tone === "purple" ? "text-violet-600" : "text-brand-blue";
  const downloadTone = tone === "green" ? "bg-brand-green hover:bg-brand-green/90" : tone === "orange" ? "bg-orange-500 hover:bg-orange-500/90" : tone === "purple" ? "bg-violet-600 hover:bg-violet-600/90" : "bg-brand-blue hover:bg-brand-blue/90";

  return (
    <article className="grid min-h-[184px] grid-cols-[minmax(0,0.9fr)_164px] gap-3 overflow-hidden rounded-lg border border-brand-line bg-white p-3 max-sm:grid-cols-1">
      <div className="flex min-w-0 flex-col">
        <h3 className="flex items-center gap-2 text-[11px] font-bold leading-4 text-brand-navy">
          <Icon className={accent} size={19} />
          {title}
        </h3>
        <p className="mt-1.5 text-[9px] font-semibold leading-[1.45] text-brand-muted">{text}</p>
        <div className="mt-1.5 grid gap-1">
          {bullets.map((bullet) => (
            <span className="flex items-center gap-1.5 text-[9px] font-semibold leading-[14px] text-brand-navy" key={bullet}>
              <CheckCircle2 className={accent} size={11} />
              {bullet}
            </span>
          ))}
        </div>
        <div className="mt-auto flex gap-1.5 pt-2.5">
          <a className={buttonVariants({ variant: "secondary", size: "sm", className: "h-7 px-3 text-[9px]" })} href={image} target="_blank" rel="noreferrer">
            Xem mẫu
          </a>
          <a className={buttonVariants({ size: "sm", className: cn("h-7 px-2.5 text-[9px] text-white", downloadTone) })} href={image} download>
            <Download size={11} />
            Tải mẫu PDF
          </a>
        </div>
      </div>
      <a className="group flex min-h-[158px] items-center justify-center overflow-hidden rounded-md border border-brand-line bg-slate-50" href={image} target="_blank" rel="noreferrer">
        <img className="h-full w-full scale-[1.08] object-contain object-center transition-transform duration-300 group-hover:scale-[1.12]" src={image} alt={`${title} preview`} loading="lazy" />
      </a>
    </article>
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


