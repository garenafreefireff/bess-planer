import Image from "next/image";

export function ComparisonHero() {
  return (
    <section className="site-container relative min-h-[154px] overflow-hidden py-6">
      <div className="relative z-[1] max-w-[980px]">
        <h1 className="whitespace-nowrap text-[40px] font-bold leading-tight text-brand-navy max-xl:whitespace-normal max-sm:text-3xl">
          Chọn công cụ phù hợp cho nhu cầu của bạn
        </h1>
        <p className="mt-2 max-w-[760px] text-[14px] font-semibold leading-6 text-brand-muted">
          EnergyInsight cung cấp hai công cụ mạnh mẽ trong cùng một hệ sinh thái.
          <br />
          Dễ dàng so sánh và chọn công cụ phù hợp nhất với mục tiêu và giai đoạn dự án của bạn.
        </p>
      </div>
      <div className="absolute right-0 top-0 h-[165px] w-[840px] opacity-90 max-lg:hidden">
        <Image className="object-cover object-center" src="/compare-hero.png" alt="" fill priority sizes="820px" />
        <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-white via-white/75 to-transparent" />
      </div>
    </section>
  );
}
