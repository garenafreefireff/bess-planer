import { Card } from "@/components/ui/card";
import { benefits } from "../data/landing-content";

export function WhyChoose() {
  return (
    <section id="gioi-thieu" className="rounded-2xl border border-brand-line bg-white p-7 shadow-panel max-sm:p-5">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-blue">Năng lực nền tảng</span>
      <h2 className="mt-2 text-[24px] font-bold leading-tight text-brand-navy">Vì sao doanh nghiệp chọn EnergyInsight?</h2>
      <p className="mt-3 max-w-[620px] text-sm leading-6 text-brand-muted">
        Một quy trình thống nhất từ đánh giá sơ bộ đến mô phỏng chuyên sâu, giúp đội ngũ kỹ thuật và tài chính cùng ra quyết định trên một nguồn dữ liệu.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        {benefits.map(({ icon: Icon, title, text }) => (
          <Card className="min-h-[150px] border-slate-200 bg-slate-50/55 p-4 shadow-none transition-transform duration-200 hover:-translate-y-0.5" key={title}>
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-brand-blue">
              <Icon size={22} />
            </span>
            <h3 className="mt-4 text-sm font-bold text-brand-navy">{title}</h3>
            <p className="mt-2 text-[13px] leading-5 text-brand-muted">{text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
