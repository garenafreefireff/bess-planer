import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { heroMetrics, heroPrimaryIcon, heroSecondaryIcon, trustBadges } from "../data/landing-content";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const PrimaryIcon = heroPrimaryIcon;
  const SecondaryIcon = heroSecondaryIcon;

  return (
    <section className="site-container grid min-h-[560px] grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center gap-10 py-12 max-xl:min-h-0 max-xl:gap-7 max-lg:grid-cols-1 max-lg:py-9">
      <div className="max-w-[700px]">
        <div className="mb-5 w-fit rounded-full border border-green-100 bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.04em] text-green-700">
          Nền tảng phân tích & lập kế hoạch BESS toàn diện
        </div>
        <h1 className="max-w-[720px] text-[clamp(42px,4.2vw,64px)] font-bold leading-[1.02] tracking-[-0.025em] text-brand-navy">
          Giải pháp toàn diện
          <span className="mt-2 block font-semibold text-brand-green">phân tích & lập kế hoạch BESS cho doanh nghiệp</span>
        </h1>
        <p className="mt-5 max-w-[650px] text-[15px] font-medium leading-7 text-brand-muted max-sm:text-sm">
          EnergyInsight giúp doanh nghiệp đánh giá tiềm năng, lựa chọn quy mô và xây dựng phương án đầu tư BESS dựa trên dữ liệu phụ tải, biểu giá điện và các kịch bản vận hành thực tế.
        </p>
        <div className="mt-7 grid max-w-[640px] grid-cols-2 gap-4 max-sm:grid-cols-1">
          <a className={buttonVariants({ size: "lg", className: "h-14 justify-start rounded-lg bg-brand-blue px-5 text-white shadow-[0_12px_30px_rgba(7,91,234,0.22)] hover:bg-brand-blue/90" })} href="/quick-sizing">
            <PrimaryIcon size={20} />
            <span className="grid gap-0.5 text-left">
              Dùng Quick Sizing
              <small className="text-xs font-semibold opacity-90">Ước tính nhanh, kết quả tức thì</small>
            </span>
          </a>
          <a className={buttonVariants({ variant: "secondary", size: "lg", className: "h-14 justify-start rounded-lg border-brand-blue/30 bg-white px-5 shadow-sm" })} href="/bess-planner">
            <SecondaryIcon size={20} />
            <span className="grid gap-0.5 text-left">
              Mở BESS Planner
              <small className="text-xs font-semibold opacity-90">Phân tích chuyên sâu, lập kế hoạch đầu tư</small>
            </span>
          </a>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-7 gap-y-4 border-t border-brand-line pt-6 max-sm:grid-cols-1">
          {trustBadges.map(({ detail, icon: Icon, title }) => (
            <div className="flex min-w-0 items-center gap-3" key={title}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-green-50 text-brand-green">
                <Icon size={18} />
              </span>
              <span className="grid gap-0.5">
                <strong className="text-[13px] text-brand-navy">{title}</strong>
                <small className="text-xs leading-snug text-brand-muted">{detail}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-h-[500px] overflow-hidden rounded-[28px] border border-white/80 bg-slate-100 shadow-[0_24px_70px_rgba(12,43,91,0.14)] max-xl:min-h-[450px] max-lg:min-h-[420px] max-sm:min-h-[360px]">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/35 via-transparent to-brand-navy/5" />
        <Image className="object-cover object-center saturate-[1.04]" src="/bess-hero.png" alt="Nhà máy tích hợp điện mặt trời và hệ thống lưu trữ năng lượng BESS" fill priority sizes="(max-width: 1024px) 100vw, 55vw" />
        <div className="absolute right-6 top-1/2 z-[2] grid -translate-y-1/2 gap-3 max-sm:right-3 max-sm:scale-[0.84] max-sm:origin-right">
          {heroMetrics.map(({ icon: Icon, title, value, tone }) => (
            <div
              className="grid min-h-[88px] w-[238px] grid-cols-[50px_1fr] items-center gap-x-3 rounded-xl border border-white/90 bg-white/95 px-4 py-3.5 shadow-[0_12px_34px_rgba(13,45,89,0.14)] backdrop-blur"
              key={title}
            >
              <span className={cn("row-span-2 grid size-11 place-items-center rounded-xl", tone === "blue" ? "bg-blue-50 text-brand-blue" : "bg-green-50 text-brand-green")}>
                <Icon size={26} />
              </span>
              <span className="text-xs font-bold text-brand-muted">{title}</span>
              <strong className={cn("leading-tight", tone === "blue" ? "text-[15px] text-brand-navy" : "text-[18px] text-brand-green")}>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
