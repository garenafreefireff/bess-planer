import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { heroMetrics, heroPrimaryIcon, heroSecondaryIcon, trustBadges } from "../data/landing-content";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const PrimaryIcon = heroPrimaryIcon;
  const SecondaryIcon = heroSecondaryIcon;

  return (
    <section className="site-container grid min-h-[520px] grid-cols-[42%_58%] items-center gap-8 py-10 max-xl:grid-cols-[44%_56%] max-lg:grid-cols-1 max-lg:pt-8">
      <div className="min-w-0">
        <div className="mb-5 w-fit rounded-full bg-green-50 px-4 py-1.5 text-xs font-black uppercase text-green-700">
          Nền tảng phân tích & lập kế hoạch BESS toàn diện
        </div>
        <h1 className="max-w-[620px] text-[52px] font-bold leading-[1.08] tracking-normal text-brand-navy max-xl:text-[48px] max-sm:text-[36px]">
          Giải pháp toàn diện
          <span className="mt-1 block font-bold text-brand-green">phân tích & lập kế hoạch BESS cho doanh nghiệp</span>
        </h1>
        <p className="mt-5 max-w-[540px] text-base font-medium leading-[1.55] text-[#5D6D86]">
          EnergyInsight giúp doanh nghiệp đánh giá nhanh tiềm năng, tính toán chính xác và lập kế hoạch đầu tư BESS tối ưu - dữ liệu tin cậy,
          quyết định vững chắc.
        </p>
        <div className="mt-6 grid max-w-[590px] grid-cols-[minmax(220px,275px)_minmax(260px,300px)] gap-4 max-sm:grid-cols-1">
          <a className={buttonVariants({ className: "h-[50px] justify-start rounded-lg bg-brand-blue px-6 text-[15px] text-white hover:bg-brand-blue/90" })} href="/quick-sizing">
            <PrimaryIcon size={20} />
            <span className="grid gap-0.5 text-left">
              Dùng Quick Sizing
              <small className="text-xs font-semibold opacity-90">Ước tính nhanh, kết quả tức thì</small>
            </span>
          </a>
          <a className={buttonVariants({ variant: "secondary", className: "h-[50px] justify-start rounded-lg px-6 text-[15px]" })} href="/customer-portal">
            <SecondaryIcon size={20} />
            <span className="grid gap-0.5 text-left">
              Phân tích chuyên sâu
              <small className="text-xs font-semibold opacity-90">Yêu cầu đăng nhập BESS Planner</small>
            </span>
          </a>
        </div>
        <div className="mt-7 grid max-w-[620px] grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
          {trustBadges.map(({ detail, icon: Icon, title }) => (
            <div className="flex min-w-0 items-center gap-3" key={title}>
              <Icon className="shrink-0 text-brand-green" size={20} />
              <span className="grid gap-0.5">
                <strong className="text-[13px] text-brand-navy">{title}</strong>
                <small className="text-xs leading-snug text-brand-muted">{detail}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-h-[500px] overflow-hidden rounded-bl-[70px] max-lg:rounded-xl">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/75 via-white/10 to-white/0" />
        <Image className="object-cover object-center saturate-[1.04]" src="/bess-hero.png" alt="" fill priority sizes="(max-width: 1024px) 100vw, 58vw" />
        <div className="absolute right-8 top-14 z-[2] grid gap-3 max-sm:right-3 max-sm:scale-[0.86] max-sm:origin-right">
          {heroMetrics.map(({ icon: Icon, title, value, tone }) => (
            <div
              className="grid min-h-[82px] w-[245px] grid-cols-[54px_1fr] items-center gap-x-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-soft"
              key={title}
            >
              <Icon className={cn("row-span-2", tone === "blue" ? "text-brand-blue" : "text-brand-green")} size={42} />
              <span className="text-xs font-extrabold text-brand-navy">{title}</span>
              <strong className={cn("leading-tight", tone === "blue" ? "text-base text-brand-navy" : "text-[22px] text-brand-green")}>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
