import { ArrowRight, BookOpen, FileBarChart, FileText, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReportTypeCardData } from "../data/report.types";

const cardIcons: Record<ReportTypeCardData["id"], LucideIcon> = {
  "quick-sizing": Zap,
  "bess-planner": FileBarChart,
  "sample-library": BookOpen
};

const cardToneClasses: Record<ReportTypeCardData["tone"], { card: string; icon: string; button: string; chip: string }> = {
  blue: {
    card: "border-blue-100 bg-blue-50/30",
    icon: "bg-white text-brand-blue ring-blue-100",
    button: "border-blue-100 bg-white text-brand-blue hover:bg-blue-50",
    chip: "bg-white text-brand-blue ring-blue-100"
  },
  green: {
    card: "border-green-100 bg-green-50/35",
    icon: "bg-white text-brand-green ring-green-100",
    button: "border-green-100 bg-white text-brand-green hover:bg-green-50",
    chip: "bg-white text-brand-green ring-green-100"
  },
  violet: {
    card: "border-violet-100 bg-violet-50/45",
    icon: "bg-white text-violet-700 ring-violet-100",
    button: "border-violet-100 bg-white text-violet-700 hover:bg-violet-50",
    chip: "bg-white text-violet-700 ring-violet-100"
  }
};

export function ReportTypeCard({ item }: { item: ReportTypeCardData }) {
  const Icon = cardIcons[item.id];
  const tone = cardToneClasses[item.tone];

  return (
    <Card className={cn("relative rounded-xl p-5 shadow-panel transition hover:-translate-y-0.5 hover:shadow-lg", tone.card)}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-11 place-items-center rounded-xl ring-1", tone.icon)}>
          <Icon size={22} />
        </span>
        {item.badge ? <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-100">{item.badge}</span> : null}
      </div>

      <h3 className="mt-4 text-lg font-bold text-brand-navy">{item.title}</h3>
      <p className="mt-2 min-h-[72px] text-sm font-medium leading-6 text-brand-muted">{item.description}</p>

      {item.id === "sample-library" ? <DocumentPreview /> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {item.chips.map((chip) => (
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", tone.chip)} key={chip}>
            {chip}
          </span>
        ))}
      </div>

      <Link className={buttonVariants({ variant: "secondary", size: "sm", className: cn("mt-5 w-full rounded-lg", tone.button) })} href={item.href}>
        {item.ctaLabel}
        <ArrowRight size={16} />
      </Link>
    </Card>
  );
}

function DocumentPreview() {
  return (
    <div aria-hidden="true" className="mt-4 flex h-16 items-end gap-2">
      {[0, 1, 2].map((item) => (
        <span className="relative block h-14 w-10 rounded-md border border-violet-100 bg-white shadow-sm" key={item} style={{ transform: `translateY(${item * 4}px)` }}>
          <FileText className="absolute left-2 top-2 text-violet-300" size={16} />
          <span className="absolute bottom-3 left-2 right-2 h-1 rounded-full bg-violet-100" />
          <span className="absolute bottom-1.5 left-2 h-1 w-4 rounded-full bg-violet-100" />
        </span>
      ))}
    </div>
  );
}
