import { ArrowRight, Check, Gauge, LockKeyhole, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { plannerToolItems, quickToolItems } from "../data/landing-content";

export function ToolComparison() {
  return (
    <section id="so-sanh-cong-cu" className="rounded-xl border border-brand-line bg-white p-4 shadow-none max-sm:p-4">
      <h2 className="text-base font-bold text-brand-navy">Hai công cụ — Một mục tiêu</h2>
      <div className="mt-3 grid grid-cols-[1fr_40px_1fr] items-stretch gap-3 max-md:grid-cols-1">
        <ToolCard
          icon={<Zap size={24} />}
          title="Quick Sizing"
          badge="Ước tính nhanh"
          description="Công cụ ước tính nhanh quy mô BESS và hiệu quả kinh tế dự kiến dựa trên dữ liệu đầu vào cơ bản."
          items={quickToolItems}
          cta="Dùng Quick Sizing"
          tone="blue"
        />
        <div className="grid size-9 place-items-center self-center justify-self-center rounded-full border border-brand-line bg-slate-50 text-[10px] font-bold text-brand-muted max-md:hidden">VS</div>
        <ToolCard
          icon={<Gauge size={24} />}
          title="BESS Planner"
          badge="Phân tích chuyên sâu"
          description="Nền tảng phân tích chi tiết và lập kế hoạch đầu tư BESS với mô phỏng đa kịch bản và báo cáo chuyên nghiệp."
          items={plannerToolItems}
          cta="Đăng nhập BESS Planner"
          tone="green"
        />
      </div>
    </section>
  );
}

function ToolCard({
  badge,
  cta,
  description,
  icon,
  items,
  title,
  tone
}: {
  badge: string;
  cta: string;
  description: string;
  icon: ReactNode;
  items: string[];
  title: string;
  tone: "blue" | "green";
}) {
  const isGreen = tone === "green";
  const href = isGreen ? "/bess-planner" : "/quick-sizing";

  return (
    <Card className={isGreen ? "flex min-h-[235px] flex-col overflow-hidden border-green-100 bg-gradient-to-br from-green-50/70 to-white p-3.5 shadow-none" : "flex min-h-[235px] flex-col overflow-hidden border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-3.5 shadow-none"}>
      <div className="flex items-center gap-2 border-b border-dashed border-slate-300 pb-2.5">
        <span className={isGreen ? "text-brand-green" : "text-brand-blue"}>{icon}</span>
        <h3 className={isGreen ? "text-base font-bold text-brand-green" : "text-base font-bold text-brand-blue"}>{title}</h3>
        <Badge className="ml-auto px-2 py-0.5 text-[9px]" variant={isGreen ? "green" : "blue"}>
          {badge}
        </Badge>
      </div>
      <p className="mt-2.5 text-[10px] font-medium leading-4 text-brand-muted">{description}</p>
      <ul className="mt-2.5 grid gap-1.5 text-[10px] text-brand-navy">
        {items.map((item) => (
          <li className="flex items-start gap-2" key={item}>
            <Check className={isGreen ? "mt-0.5 shrink-0 text-brand-green" : "mt-0.5 shrink-0 text-brand-blue"} size={13} />
            {item}
          </li>
        ))}
      </ul>
      <a className={buttonVariants({ variant: isGreen ? "green" : "default", className: "mt-auto h-8 w-full text-[11px]" })} href={href}>
        {isGreen ? <LockKeyhole size={13} /> : null}
        {cta}
        <ArrowRight size={14} />
      </a>
    </Card>
  );
}
