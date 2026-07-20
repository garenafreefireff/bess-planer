import { ArrowRight, Check, Gauge, LockKeyhole, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { plannerToolItems, quickToolItems } from "../data/landing-content";

export function ToolComparison() {
  return (
    <section className="site-container">
      <h2 className="text-[26px] font-bold text-brand-navy">Hai công cụ - Một mục tiêu</h2>
      <div className="mt-6 grid grid-cols-[1fr_64px_1fr] items-stretch gap-6 max-sm:grid-cols-1">
        <ToolCard
          icon={<Zap size={30} />}
          title="Quick Sizing"
          badge="Ước tính nhanh"
          description="Công cụ ước tính nhanh quy mô BESS và hiệu quả kinh tế dự kiến dựa trên dữ liệu đầu vào cơ bản."
          items={quickToolItems}
          cta="Dùng Quick Sizing"
          tone="blue"
        />
        <div className="grid size-10 place-items-center self-center justify-self-center rounded-full border border-brand-line bg-white text-sm font-black text-brand-navy shadow-panel">VS</div>
        <ToolCard
          icon={<Gauge size={30} />}
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

  return (
    <Card className={cn("flex min-h-[310px] flex-col overflow-hidden rounded-xl p-[26px] shadow-panel transition hover:-translate-y-0.5 hover:shadow-soft", isGreen ? "bg-[#F4FCF7]" : "bg-[#F5F8FF]")}>
      <div className="flex items-center gap-3 border-b border-dashed border-slate-300 pb-4">
        <span className={isGreen ? "text-brand-green" : "text-brand-blue"}>{icon}</span>
        <h3 className={isGreen ? "text-[22px] font-bold text-brand-green" : "text-[22px] font-bold text-brand-blue"}>{title}</h3>
        <Badge className="ml-auto" variant={isGreen ? "green" : "blue"}>
          {badge}
        </Badge>
      </div>
      <p className="mt-5 max-w-[560px] text-sm font-medium leading-[1.5] text-[#5D6D86]">{description}</p>
      <ul className="mt-5 grid gap-3 text-sm font-semibold text-brand-navy">
        {items.map((item) => (
          <li className="flex items-center gap-2" key={item}>
            <Check className={isGreen ? "text-brand-green" : "text-brand-blue"} size={17} />
            {item}
          </li>
        ))}
      </ul>
      <a className={buttonVariants({ variant: isGreen ? "green" : "default", className: "mt-auto h-[46px] w-full rounded-lg text-sm" })} href={isGreen ? "/customer-portal" : "/quick-sizing"}>
        {isGreen ? <LockKeyhole size={16} /> : null}
        {cta}
        <ArrowRight size={18} />
      </a>
    </Card>
  );
}
