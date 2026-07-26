import { Card } from "@/components/ui/card";
import { benefits } from "../data/landing-content";

export function WhyChoose() {
  return (
    <section id="gioi-thieu" className="rounded-xl border border-brand-line bg-white p-4 shadow-none max-sm:p-4">
      <h2 className="text-base font-bold text-brand-navy">Vì sao doanh nghiệp chọn EnergyInsight?</h2>
      <div className="mt-3 grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {benefits.map(({ icon: Icon, title, text }) => (
          <Card className="min-h-[136px] border-slate-200 bg-white p-3 shadow-none transition hover:border-blue-200 hover:bg-blue-50/20" key={title}>
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-brand-blue">
              <Icon size={21} />
            </span>
            <h3 className="mt-3 text-xs font-bold leading-5 text-brand-navy">{title}</h3>
            <p className="mt-1.5 text-[10px] leading-4 text-brand-muted">{text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
