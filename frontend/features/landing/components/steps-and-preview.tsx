import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { workflowSteps } from "../data/landing-content";

export function StepsAndPreview() {
  return (
    <section className="site-container py-16 max-sm:py-11">
      <div className="grid grid-cols-[0.9fr_1.1fr] gap-6 max-xl:grid-cols-1">
        <div className="rounded-2xl border border-brand-line bg-white p-7 shadow-panel max-sm:p-5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-green">Quy trình rõ ràng</span>
          <h2 className="mt-2 text-[24px] font-bold leading-tight text-brand-navy">3 bước để đánh giá giải pháp BESS</h2>
          <p className="mt-3 text-sm leading-6 text-brand-muted">Từ dữ liệu đầu vào đến báo cáo đầu tư trong một luồng làm việc thống nhất.</p>
          <div className="mt-6 grid gap-4">
            {workflowSteps.map(({ icon: Icon, number, text, title }, index) => (
              <Card className="relative grid min-h-[108px] grid-cols-[48px_1fr] gap-x-4 border-slate-200 bg-slate-50/55 p-4 shadow-none" key={title}>
                <span className="grid size-12 place-items-center rounded-xl bg-white text-brand-blue shadow-sm">
                  <Icon size={23} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-brand-green text-xs font-bold text-white">{number}</span>
                    <h3 className="text-sm font-bold text-brand-navy">{title}</h3>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-brand-muted">{text}</p>
                </div>
                {index < workflowSteps.length - 1 ? <span className="absolute -bottom-4 left-[39px] h-4 border-l-2 border-dashed border-slate-300" /> : null}
              </Card>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-brand-line bg-white p-7 shadow-panel max-sm:p-5">
          <div className="flex items-center justify-between gap-5 max-sm:flex-col max-sm:items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-blue">Đầu ra trực quan</span>
              <h2 className="mt-2 text-[24px] font-bold leading-tight text-brand-navy">Xem trước báo cáo & dashboard</h2>
            </div>
            <a className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand-blue" href="/bao-cao-mau">
              Xem báo cáo mẫu <ArrowRight size={16} />
            </a>
          </div>
          <p className="mt-3 text-sm leading-6 text-brand-muted">Theo dõi hiệu quả tài chính, công suất và dòng tiền trên cùng một dashboard.</p>
          <div className="mt-6 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <MiniLineChart />
            <MiniBarsChart />
            <MiniPowerChart />
            <MiniDonutChart />
            <div className="col-span-2 max-sm:col-span-1">
              <MiniReport />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniFrame({ children }: { children: ReactNode }) {
  return <div className="relative min-h-[128px] overflow-hidden rounded-xl border border-brand-line bg-slate-50/45 p-4">{children}</div>;
}

function MiniLineChart() {
  return (
    <MiniFrame>
      <span className="block text-xs font-bold text-brand-muted">Tổng quan hiệu quả</span>
      <strong className="mt-2 block text-[18px] text-brand-navy">2,45 tỷ VND</strong>
      <div className="absolute inset-x-4 bottom-4 h-12 bg-[linear-gradient(150deg,transparent_44%,rgba(0,86,231,0.18)_45%),linear-gradient(150deg,transparent_49%,#075BEA_50%,transparent_52%)]" />
    </MiniFrame>
  );
}

function MiniBarsChart() {
  return (
    <MiniFrame>
      <span className="block text-xs font-bold text-brand-muted">Dòng tiền dự án</span>
      <div className="absolute inset-x-4 bottom-4 h-12 bg-[repeating-linear-gradient(90deg,#16AE5A_0_10px,transparent_10px_20px)] [clip-path:polygon(0_75%,8%_60%,16%_66%,24%_40%,32%_52%,40%_24%,48%_42%,56%_20%,64%_34%,72%_8%,80%_24%,88%_4%,100%_18%,100%_100%,0_100%)]" />
    </MiniFrame>
  );
}

function MiniPowerChart() {
  return (
    <MiniFrame>
      <span className="block text-xs font-bold text-brand-muted">Phân tích công suất</span>
      <div className="absolute inset-x-4 bottom-4 h-12 bg-[radial-gradient(circle_at_78%_18%,#061B52_0_4px,transparent_5px),repeating-linear-gradient(90deg,rgba(22,174,90,0.48)_0_8px,transparent_8px_15px),linear-gradient(160deg,transparent_44%,#075BEA_45%_48%,transparent_49%)]" />
    </MiniFrame>
  );
}

function MiniDonutChart() {
  return (
    <MiniFrame>
      <span className="block text-xs font-bold text-brand-muted">Cơ cấu vốn & lợi nhuận</span>
      <strong className="mt-2 block text-[18px] text-brand-navy">120,00</strong>
      <div className="absolute bottom-4 right-5 size-16 rounded-full bg-[conic-gradient(#075BEA_0_62%,#0CA34B_62%_100%)] [mask:radial-gradient(circle,transparent_42%,#000_43%)]" />
    </MiniFrame>
  );
}

function MiniReport() {
  return (
    <div className="relative min-h-[106px] overflow-hidden rounded-xl border border-brand-line bg-[linear-gradient(135deg,rgba(7,91,234,0.08),#fff),repeating-linear-gradient(0deg,transparent_0_12px,rgba(7,91,234,0.05)_12px_13px)] p-4">
      <span className="block text-xs font-bold text-brand-muted">Báo cáo mẫu</span>
      <strong className="mt-2 block text-sm uppercase text-brand-blue">Báo cáo phân tích dự án BESS</strong>
      <span className="mt-2 block text-xs text-brand-muted">Tóm tắt kỹ thuật, tài chính và khuyến nghị cấu hình.</span>
    </div>
  );
}
