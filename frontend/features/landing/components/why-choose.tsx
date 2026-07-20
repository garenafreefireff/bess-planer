import { Card } from "@/components/ui/card";
import { benefits } from "../data/landing-content";

export function WhyChoose() {
  return (
    <section className="bg-[#FAFCFF] py-16">
      <div className="site-container">
        <h2 className="text-[26px] font-bold text-brand-navy">Vì sao doanh nghiệp chọn EnergyInsight?</h2>
        <div className="mt-6 grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {benefits.map(({ icon: Icon, title, text }) => (
          <Card className="min-h-[170px] bg-white p-6 shadow-[0_4px_16px_rgba(20,60,120,0.05)] transition hover:-translate-y-0.5 hover:shadow-soft" key={title}>
            <Icon className="text-brand-blue" size={40} />
            <h3 className="mt-5 text-base font-semibold text-brand-navy">{title}</h3>
            <p className="mt-3 text-sm leading-[1.5] text-[#687A96]">{text}</p>
          </Card>
        ))}
        </div>
      </div>
    </section>
  );
}
