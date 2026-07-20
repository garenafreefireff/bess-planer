"use client";

import { ArrowRight, BarChart3, Expand, LineChart, PieChart, X } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { workflowSteps } from "../data/landing-content";

const previewTabs = [
  {
    key: "overview",
    title: "Tổng quan hiệu quả",
    icon: LineChart,
    metric: "2,45 tỷ VND",
    label: "Tổng tiết kiệm dự kiến"
  },
  {
    key: "cashflow",
    title: "Dòng tiền dự án",
    icon: BarChart3,
    metric: "18,7 tỷ VND",
    label: "NPV trong 15 năm"
  },
  {
    key: "power",
    title: "Phân tích công suất",
    icon: PieChart,
    metric: "500 kW",
    label: "Công suất BESS đề xuất"
  }
];

export function StepsAndPreview() {
  const [activeTab, setActiveTab] = useState(previewTabs[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <section className="site-container grid gap-16">
      <div>
        <h2 className="text-[26px] font-bold text-brand-navy">3 bước đơn giản để đánh giá giải pháp BESS</h2>
        <div className="relative mt-6 grid grid-cols-3 gap-8 max-sm:grid-cols-1">
          <span className="pointer-events-none absolute left-[17%] right-[17%] top-[19px] border-t-2 border-dashed border-blue-200 max-sm:hidden" />
          {workflowSteps.map(({ icon: Icon, number, text, title }) => (
            <Card className="relative min-h-[165px] rounded-xl bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:shadow-soft" key={title}>
              <div className="flex items-center gap-4">
                <span className="grid size-[38px] place-items-center rounded-full bg-brand-green text-base font-black text-white">{number}</span>
                <Icon className="text-brand-blue" size={26} />
              </div>
              <h3 className="mt-5 text-base font-semibold text-brand-navy">{title}</h3>
              <p className="mt-3 text-sm leading-[1.5] text-[#687A96]">{text}</p>
            </Card>
          ))}
        </div>
        <div className="mt-7 flex justify-center">
          <a className={buttonVariants({ className: "h-[46px] rounded-lg bg-brand-blue px-8 text-[15px] text-white hover:bg-brand-blue/90" })} href="/quick-sizing">
            Bắt đầu đánh giá
            <ArrowRight size={18} />
          </a>
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-[26px] font-bold text-brand-navy">Xem trước báo cáo & Dashboard</h2>
          <a className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-blue hover:text-brand-navy" href="/bao-cao-mau">
            Xem báo cáo mẫu <ArrowRight size={16} />
          </a>
        </div>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_360px] gap-6 max-xl:grid-cols-1">
          <DashboardPreview activeKey={activeTab.key} onOpen={() => setIsPreviewOpen(true)} />
          <div className="grid content-start gap-4">
            {previewTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.key === activeTab.key;

              return (
                <button
                  className={cn(
                    "rounded-xl border bg-white p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-soft",
                    isActive ? "border-brand-blue ring-2 ring-brand-blue/10" : "border-brand-line"
                  )}
                  key={tab.key}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  <span className={cn("flex items-center gap-3 text-base font-bold", isActive ? "text-brand-blue" : "text-brand-navy")}>
                    <Icon size={22} />
                    {tab.title}
                  </span>
                  <strong className="mt-4 block text-2xl text-brand-navy">{tab.metric}</strong>
                  <span className="mt-1 block text-sm font-medium text-brand-muted">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-navy/55 p-8" role="dialog" aria-modal="true">
          <div className="relative w-[min(1120px,100%)] rounded-2xl bg-white p-6 shadow-soft">
            <button
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-slate-100 text-brand-navy hover:bg-blue-50 hover:text-brand-blue"
              onClick={() => setIsPreviewOpen(false)}
              type="button"
              aria-label="Đóng preview"
            >
              <X size={20} />
            </button>
            <h3 className="mb-5 text-xl font-bold text-brand-navy">{activeTab.title}</h3>
            <DashboardPreview activeKey={activeTab.key} large />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DashboardPreview({ activeKey, large, onOpen }: { activeKey: string; large?: boolean; onOpen?: () => void }) {
  return (
    <Card className={cn("relative overflow-hidden rounded-xl bg-white p-6 shadow-panel", large ? "min-h-[560px]" : "min-h-[430px]")}>
      <div className="flex items-center justify-between gap-6">
        <div>
          <span className="text-sm font-bold text-brand-blue">EnergyInsight Dashboard</span>
          <h3 className="mt-2 text-xl font-bold text-brand-navy">
            {activeKey === "overview" ? "Tổng quan hiệu quả" : activeKey === "cashflow" ? "Dòng tiền dự án" : "Phân tích công suất"}
          </h3>
        </div>
        {onOpen ? (
          <button className={buttonVariants({ variant: "secondary", className: "h-10 rounded-lg" })} onClick={onOpen} type="button">
            <Expand size={16} />
            Xem phóng to
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {["NPV", "IRR", "Payback"].map((item, index) => (
          <div className="rounded-lg border border-brand-line bg-[#F7FAFF] p-4" key={item}>
            <span className="text-xs font-bold uppercase text-brand-muted" title={item === "NPV" ? "Giá trị hiện tại ròng" : item === "IRR" ? "Tỷ suất hoàn vốn nội bộ" : "Thời gian hoàn vốn"}>
              {item}
            </span>
            <strong className="mt-2 block text-xl text-brand-navy">{index === 0 ? "18,7 tỷ" : index === 1 ? "18,6%" : "5,1 năm"}</strong>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[1fr_260px] gap-5 max-lg:grid-cols-1">
        <div className="relative h-[220px] overflow-hidden rounded-xl border border-brand-line bg-[linear-gradient(180deg,#fff,#f7fbff)] p-5">
          <div className="absolute inset-x-8 bottom-10 top-8 bg-[repeating-linear-gradient(0deg,transparent_0_47px,#e5edf8_48px),repeating-linear-gradient(90deg,transparent_0_84px,#edf3fb_85px)]" />
          <div
            className={cn(
              "absolute inset-x-10 bottom-12 h-36",
              activeKey === "cashflow"
                ? "bg-[repeating-linear-gradient(90deg,#16AE5A_0_18px,transparent_18px_38px)] [clip-path:polygon(0_80%,9%_55%,18%_66%,27%_42%,36%_56%,45%_28%,54%_45%,63%_22%,72%_34%,81%_10%,90%_25%,100%_8%,100%_100%,0_100%)]"
                : activeKey === "power"
                  ? "bg-[radial-gradient(circle_at_77%_10%,#09275C_0_6px,transparent_7px),repeating-linear-gradient(90deg,rgba(8,166,74,0.45)_0_16px,transparent_16px_30px),linear-gradient(155deg,transparent_43%,#075DEB_44%_47%,transparent_48%)]"
                  : "bg-[linear-gradient(150deg,transparent_40%,rgba(7,93,235,0.18)_41%),linear-gradient(150deg,transparent_48%,#075DEB_49%,transparent_51%)]"
            )}
          />
          <span className="absolute bottom-4 left-8 text-xs font-bold text-brand-muted">Năm 0</span>
          <span className="absolute bottom-4 right-8 text-xs font-bold text-brand-muted">Năm 15</span>
        </div>
        <div className="rounded-xl border border-brand-line bg-[#F3F7FF] p-5">
          <span className="text-sm font-bold text-brand-muted">Cơ cấu vốn & lợi nhuận</span>
          <div className="mx-auto mt-6 grid size-36 place-items-center rounded-full bg-[conic-gradient(#075DEB_0_62%,#08A64A_62%_100%)]">
            <div className="grid size-20 place-items-center rounded-full bg-white text-center text-sm font-bold text-brand-navy">120,00<br />tỷ</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
