const trustedBrands = [
  "SOLARIS ENERGY",
  "GREEN POWER VIETNAM",
  "VIETTECH INDUSTRIES",
  "NEXUS ENERGY",
  "HORIZON INDUSTRIAL",
  "MEKONG SOLAR",
  "SUNTECH ENERGY",
  "DELTA INDUSTRIES",
  "PEAK ENERGY",
  "VICTORY INDUSTRY"
];

export function LogoStrip() {
  return (
    <section className="border-t border-brand-line bg-white py-4">
      <div className="site-container flex items-center gap-7 overflow-hidden max-lg:flex-col max-lg:items-start max-lg:gap-3">
        <strong className="shrink-0 text-sm font-bold text-brand-navy">Được tin tưởng bởi các doanh nghiệp hàng đầu</strong>
        <div className="grid flex-1 grid-cols-10 items-center gap-4 max-xl:min-w-[1120px] max-lg:w-full max-lg:overflow-x-auto">
          {trustedBrands.map((brand, index) => (
            <span className="flex min-h-9 items-center justify-center gap-1.5 text-center text-[10px] font-bold leading-tight text-brand-muted" key={brand}>
              <span className={index % 3 === 0 ? "size-3 rotate-45 rounded-sm bg-brand-blue" : index % 2 === 0 ? "size-3 rounded-full border-2 border-brand-green" : "size-3 rounded-sm bg-brand-green"} />
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
