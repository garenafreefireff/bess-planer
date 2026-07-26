import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { heroMetrics, heroPrimaryIcon, heroSecondaryIcon, trustBadges } from "../data/landing-content";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const PrimaryIcon = heroPrimaryIcon;
  const SecondaryIcon = heroSecondaryIcon;

  return (
    <section className="site-container grid min-h-[430px] grid-cols-[minmax(430px,0.78fr)_minmax(0,1.22fr)] items-stretch gap-5 py-4 max-xl:grid-cols-[minmax(380px,0.82fr)_minmax(0,1.18fr)] max-lg:grid-cols-1 max-lg:py-6">
      <div className="flex flex-col justify-center py-3 max-lg:max-w-[760px]">
        <div className="mb-3 w-fit rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.03em] text-green-700">
          Nền tảng phân tích & lập kế hoạch BESS toàn diện
        </div>
        <h1 className="max-w-[650px] text-[clamp(38px,3.5vw,56px)] font-bold leading-[1.04] tracking-[-0.025em] text-brand-navy">
          Giải pháp toàn diện
          <span className="mt-1 block font-semibold text-brand-green">phân tích & lập kế hoạch BESS cho doanh nghiệp</span>
        </h1>
        <p className="mt-3 max-w-[610px] text-sm font-medium leading-6 text-brand-muted">
          EnergyInsight giúp doanh nghiệp đánh giá nhanh tiềm năng, tính toán chính xác và lập kế hoạch đầu tư BESS tối ưu — dữ liệu tin cậy, quyết định vững chắc.
        </p>
        <div className="mt-4 grid max-w-[610px] grid-cols-2 gap-3 max-sm:grid-cols-1">
          <a className={buttonVariants({ size: "lg", className: "h-12 justify-start rounded-lg bg-brand-blue px-4 text-white shadow-[0_10px_24px_rgba(7,91,234,0.2)] hover:bg-brand-blue/90" })} href="/quick-sizing">
            <PrimaryIcon size={19} />
            <span className="grid gap-0 text-left text-sm">
              Dùng Quick Sizing
              <small className="text-[10px] font-semibold opacity-90">Ước tính nhanh, kết quả tức thì</small>
            </span>
          </a>
          <a className={buttonVariants({ variant: "secondary", size: "lg", className: "h-12 justify-start rounded-lg border-brand-blue/35 bg-white px-4 text-brand-blue shadow-sm" })} href="/bess-planner">
            <SecondaryIcon size={19} />
            <span className="grid gap-0 text-left text-sm">
              Đăng nhập BESS Planner
              <small className="text-[10px] font-semibold text-brand-muted">Phân tích chuyên sâu, lập kế hoạch đầu tư</small>
            </span>
          </a>
        </div>
        <div className="mt-4 grid max-w-[660px] grid-cols-4 gap-2 max-md:grid-cols-2">
          {trustBadges.map(({ detail, icon: Icon, title }) => (
            <div className="flex min-w-0 items-center gap-2" key={title}>
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-green-50 text-brand-green">
                <Icon size={15} />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[10px] text-brand-navy">{title}</strong>
                <small className="block truncate text-[9px] text-brand-muted">{detail}</small>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-[400px] overflow-hidden rounded-2xl bg-slate-50 max-lg:min-h-[390px] max-sm:min-h-[320px]">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/25 via-transparent to-brand-navy/5" />
        <Image className="object-cover object-center saturate-[1.03]" src="/bess-hero.png" alt="Nhà máy tích hợp điện mặt trời và hệ thống lưu trữ năng lượng BESS" fill priority sizes="(max-width: 1024px) 100vw, 60vw" />
        <div className="absolute right-4 top-1/2 z-[2] grid -translate-y-1/2 gap-2.5 max-sm:right-2 max-sm:scale-[0.78] max-sm:origin-right">
          {heroMetrics.map(({ icon: Icon, title, value, tone }) => (
            <div className="grid min-h-[67px] w-[205px] grid-cols-[38px_1fr] items-center gap-x-3 rounded-xl border border-white/95 bg-white/95 px-3 py-2.5 shadow-[0_10px_26px_rgba(13,45,89,0.14)] backdrop-blur" key={title}>
              <span className={cn("row-span-2 grid size-9 place-items-center rounded-lg", tone === "blue" ? "bg-blue-50 text-brand-blue" : "bg-green-50 text-brand-green")}>
                <Icon size={21} />
              </span>
              <span className="text-[10px] font-bold text-brand-muted">{title}</span>
              <strong className={cn("text-sm leading-tight", tone === "blue" ? "text-brand-navy" : "text-brand-green")}>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
