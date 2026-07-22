import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  comparisonRows,
  plannerIcon,
  quickIcon
} from "../data/tool-comparison-content";
import { cn } from "@/lib/utils";

export function ComparisonMatrix() {
  const QuickIcon = quickIcon;
  const PlannerIcon = plannerIcon;

  return (
    <section className="site-container grid grid-cols-[380px_1fr_1.22fr] gap-8 max-xl:grid-cols-1">
      <Card className="overflow-hidden bg-white shadow-none">
        <h2 className="border-b border-brand-line px-8 py-4 text-center text-base font-bold text-brand-navy">Tiêu chí so sánh</h2>
        <div className="divide-y divide-brand-line">
          {comparisonRows.map(({ criterion, icon: Icon }) => (
            <div className="grid h-[36px] grid-cols-[46px_1fr] items-center px-8 text-[13px] font-semibold text-brand-navy" key={criterion}>
              <Icon className="text-brand-blue" size={22} />
              <span>{criterion}</span>
            </div>
          ))}
        </div>
      </Card>

      <ToolColumn
        title="Quick Sizing"
        badge="Công cụ công khai"
        icon={<QuickIcon size={42} />}
        rows={comparisonRows.map((row) => row.quick)}
        tone="blue"
        cta="Dùng Quick Sizing"
      />

      <ToolColumn
        title="BESS Planner"
        badge="Công cụ chuyên sâu"
        icon={<PlannerIcon size={36} />}
        rows={comparisonRows.map((row) => row.planner)}
        tone="green"
        cta="Mở BESS Planner"
      />
    </section>
  );
}

function ToolColumn({
  badge,
  cta,
  icon,
  rows,
  title,
  tone
}: {
  badge: string;
  cta: string;
  icon: ReactNode;
  rows: string[];
  title: string;
  tone: "blue" | "green";
}) {
  const isGreen = tone === "green";
  const href = isGreen ? "/customer-portal/du-an-cua-toi" : "/quick-sizing";

  return (
    <Card className="overflow-hidden bg-white px-6 pb-3.5 pt-4 shadow-none">
      <div className="flex items-center justify-center gap-4 border-b border-dashed border-slate-300 pb-3">
        <span className={isGreen ? "text-brand-green" : "text-brand-blue"}>{icon}</span>
        <h2 className={cn("text-[26px] font-bold", isGreen ? "text-brand-green" : "text-brand-navy")}>{title}</h2>
        <span className={cn("ml-auto rounded-full px-3 py-1 text-xs font-bold", isGreen ? "bg-green-50 text-brand-green" : "bg-blue-50 text-brand-blue")}>
          {badge}
        </span>
      </div>
      <div className="divide-y divide-brand-line">
        {rows.map((row, index) => {
          const RowIcon = comparisonRows[index].icon;

          return (
            <div className="grid h-[36px] grid-cols-[34px_1fr] items-center text-[13px] font-semibold text-brand-navy" key={`${row}-${index}`}>
              <RowIcon className={isGreen ? "text-brand-green" : "text-brand-blue"} size={18} />
              <span>{row}</span>
            </div>
          );
        })}
      </div>
      <a className={buttonVariants({ variant: isGreen ? "green" : "default", className: "mt-3.5 h-11 w-full text-base" })} href={href}>
        {cta}
        <ArrowRight size={22} />
      </a>
    </Card>
  );
}
