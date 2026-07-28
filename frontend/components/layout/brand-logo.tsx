import Link from "next/link";

export function DataInsightLogo() {
  return null;
}

export function EnergyInsightLogo() {
  return (
    <span className="inline-flex items-center whitespace-nowrap text-2xl font-bold text-brand-green max-sm:text-lg">
      <span>
        Energy<span className="text-brand-blue">Insight</span>
      </span>
    </span>
  );
}

export function BrandPair() {
  return (
    <Link className="flex min-w-[220px] items-center gap-4 font-bold text-brand-navy max-xl:min-w-0 max-sm:min-w-0" href="/">
      <EnergyInsightLogo />
    </Link>
  );
}
