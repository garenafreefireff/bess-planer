import { ArrowRight, Check, Gauge, LockKeyhole, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { plannerToolItems, quickToolItems } from "../data/landing-content";

export function ToolComparison() {
  return (
    <section id="so-sanh-cong-cu" className="rounded-2xl border border-brand-line bg-white p-7 shadow-panel max-sm:p-5">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-green">Lựa chọn theo nhu cầu</span>
      <h2 className="mt-2 text-[24px] font-bold leading-tight text-brand-navy">Hai công cụ, một mục tiêu đầu tư hiệu quả</h2>
      <p className="mt-3 text-sm leading-6 text-brand-muted">Bắt đầu bằng ước tính nhanh, sau đó chuyển sang mô phỏng chuyên sâu khi đã có dữ liệu vận hành.</p>
      <div className="mt-6 grid grid-cols-[1fr_48px_1fr] items-stretch gap-4 max-md:grid-cols-1">
        <ToolCard
          icon={<Zap size={30} />}
          title="Quick Sizing"
          badge="Ước tính nhanh"
          description="Công cụ ước tính nhanh quy mô BESS và hiệu quả kinh tế dự kiến dựa trên dữ liệu đầu vào cơ bản."
          items={quickToolItems}
          cta="Dùng Quick Sizing"
          tone="blue"
        />
        <div className="grid size-10 place-items-center self-center justify-self-center rounded-full border border-brand-line bg-slate-50 text-xs font-bold text-brand-muted max-md:hidden">VS</div>
        <ToolCard
          icon={<Gauge size={30} />}
          title="BESS Planner"
          badge="Phân tích chuyên sâu"
          description="Nền tảng phân tích chi tiết và lập kế hoạch đầu tư BESS với mô phỏng đa kịch bản và báo cáo chuyên nghiệp."
          items={plannerToolItems}
          cta="Mở BESS Planner"
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
    <Card className={isGreen ? "flex min-h-[310px] flex-col overflow-hidden border-green-100 bg-gradient-to-br from-green-50/80 to-white p-5 shadow-none" : "flex min-h-[310px] flex-col overflow-hidden border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-5 shadow-none"}>
      <div className="flex items-center gap-2.5 border-b border-dashed border-slate-300 pb-4">
        <span className={isGreen ? "text-brand-green" : "text-brand-blue"}>{icon}</span>
        <h3 className={isGreen ? "text-[21px] font-bold text-brand-green" : "text-[21px] font-bold text-brand-blue"}>{title}</h3>
        <Badge className="ml-auto" variant={isGreen ? "green" : "blue"}>
          {badge}
        </Badge>
      </div>
      <p className="mt-4 text-[13px] font-medium leading-5 text-brand-muted">{description}</p>
      <ul className="mt-4 grid gap-2.5 text-[13px] text-brand-navy">
        {items.map((item) => (
          <li className="flex items-start gap-2.5" key={item}>
            <Check className={isGreen ? "mt-0.5 shrink-0 text-brand-green" : "mt-0.5 shrink-0 text-brand-blue"} size={16} />
            {item}
          </li>
        ))}
      </ul>
      <a className={buttonVariants({ variant: isGreen ? "green" : "default", className: "mt-auto h-10 w-full text-sm" })} href={href}>
        {isGreen ? <LockKeyhole size={16} /> : null}
        {cta}
        <ArrowRight size={18} />
      </a>
    </Card>
  );
}
