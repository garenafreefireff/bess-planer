import { industrySegments } from "../data/landing-content";

export function LogoStrip() {
  return (
    <section className="border-t border-brand-line bg-white/70 py-8">
      <div className="site-container grid grid-cols-[minmax(260px,0.7fr)_1.3fr] items-center gap-10 max-lg:grid-cols-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-green">Phạm vi ứng dụng</span>
          <strong className="mt-2 block text-lg font-bold text-brand-navy">Phù hợp với nhiều mô hình doanh nghiệp</strong>
        </div>
        <div className="grid grid-cols-5 items-center gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2">
          {industrySegments.map((segment, index) => (
            <span
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-brand-line bg-slate-50/70 px-3 text-center text-xs font-bold leading-tight text-brand-navy data-[tone=blue]:text-blue-700 data-[tone=green]:text-brand-green"
              data-tone={index % 3 === 0 ? "blue" : index % 2 === 0 ? "green" : "navy"}
              key={segment}
            >
              {segment}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
