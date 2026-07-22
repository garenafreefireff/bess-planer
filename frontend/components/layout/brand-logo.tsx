import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-7 shrink-0 rotate-[30deg] rounded-lg border-[5px] border-brand-blue bg-sky-50 shadow-[inset_0_0_0_4px_rgba(12,163,75,0.95)]",
        "after:absolute after:inset-[6px] after:rounded after:bg-gradient-to-br after:from-brand-green after:to-brand-blue after:content-['']",
        className
      )}
    />
  );
}

export function DataInsightLogo() {
  return (
    <span className="inline-flex items-center max-sm:hidden" aria-label="DataInsight">
      <Image
        src="/blue-logo.png"
        alt="DataInsight"
        width={600}
        height={131}
        priority
        className="h-10 w-auto object-contain"
      />
    </span>
  );
}

export function EnergyInsightLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="relative inline-flex items-center gap-2 whitespace-nowrap text-2xl font-bold text-brand-green max-sm:text-lg">
      <BrandMark className="max-sm:size-6" />
      <span>
        Energy<span className="text-brand-blue">Insight</span>
      </span>
      {!compact ? <small className="absolute left-11 top-7 text-xs font-bold text-brand-navy/80 max-sm:hidden">by DataInsight</small> : null}
    </span>
  );
}

export function BrandPair() {
  return (
    <Link className="flex min-w-[424px] items-center gap-4 font-bold text-brand-navy max-xl:min-w-0 max-sm:min-w-0" href="/">
      <DataInsightLogo />
      <span className="h-8 w-px bg-slate-300 max-sm:hidden" />
      <EnergyInsightLogo />
    </Link>
  );
}
