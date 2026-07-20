import { logos } from "../data/landing-content";

export function LogoStrip() {
  return (
    <section className="border-y border-brand-line bg-white/80 py-8">
      <div className="site-container grid grid-cols-[auto_1fr] items-center gap-10 max-lg:grid-cols-1">
      <strong className="text-sm font-bold text-brand-navy">Được tin tưởng bởi các doanh nghiệp hàng đầu</strong>
      <div className="grid grid-cols-10 items-center gap-5 max-lg:grid-cols-3 max-sm:grid-cols-2">
        {logos.map((logo, index) => (
          <span
            className="inline-flex min-h-9 items-center justify-center text-center text-xs font-black leading-tight text-brand-navy opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 data-[tone=blue]:text-blue-700 data-[tone=green]:text-brand-green"
            data-tone={index % 3 === 0 ? "blue" : index % 2 === 0 ? "green" : "navy"}
            key={logo}
          >
            {logo}
          </span>
        ))}
      </div>
      </div>
    </section>
  );
}
