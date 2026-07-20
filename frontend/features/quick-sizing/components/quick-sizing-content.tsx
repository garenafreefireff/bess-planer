import { ArrowRight, ChevronDown, Copy, Info, Zap } from "lucide-react";
import { Fragment } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { bessGoals, formFields, infoIcon, stepperItems } from "../data/quick-sizing-content";
import { AssumptionsPanel } from "./quick-sizing-assumptions";
import { cn } from "@/lib/utils";

export function QuickSizingContent() {
  return (
    <section className="site-container pb-0 pt-3">
      <div className="flex items-center gap-3 text-sm font-semibold text-brand-muted">
        <span>Trang chủ</span>
        <ArrowRight size={14} />
        <span className="text-brand-navy">Quick Sizing</span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1.15fr] items-end gap-8 max-xl:grid-cols-1">
        <div>
          <h1 className="text-[34px] font-extrabold leading-tight text-brand-navy">Quick Sizing</h1>
        <p className="mt-2 max-w-[700px] text-[14px] font-semibold leading-6 text-brand-muted">
            Ước tính nhanh quy mô BESS và hiệu quả tài chính dựa trên các giả định lạc quan/mặc định,
            <br />
            không cần dữ liệu tải hoặc PV lịch sử.
          </p>
        </div>
        <Stepper />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_510px] gap-6 max-xl:grid-cols-1">
        <Card className="bg-white p-5 shadow-none">
          <h2 className="text-xl font-extrabold text-brand-navy">Thông tin cơ bản</h2>
          <FormGrid />
          <BessGoalPicker />
          <BudgetField />
        </Card>
        <AssumptionsPanel />
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-6 rounded-md bg-blue-50 px-7 py-2.5 max-lg:grid-cols-1">
        <div className="flex items-center gap-3 text-sm font-semibold text-brand-blue">
          <Info size={20} />
          <span>Kết quả chỉ mang tính tham khảo, không thay thế cho phân tích chi tiết. Không cần đăng ký để sử dụng tính năng này.</span>
        </div>
        <a className={buttonVariants({ className: "h-10 min-w-[176px] bg-brand-blue text-white hover:bg-brand-blue/90" })} href="/quick-sizing/gia-dinh">
          <Zap size={18} />
          Tính nhanh
        </a>
        <a className={buttonVariants({ variant: "secondary", className: "h-10 min-w-[176px]" })} href="#">
          <Copy size={18} />
          Xem ví dụ
        </a>
      </div>
    </section>
  );
}

function Stepper() {
  return (
    <div className="grid h-[90px] grid-cols-[auto_1fr_auto_1fr_auto] items-center rounded-lg border border-brand-line bg-white px-6 shadow-panel">
      {stepperItems.map((step, index) => (
        <Fragment key={step.number}>
          <div className="flex items-center gap-4">
            <span className={cn("grid size-10 place-items-center rounded-full text-lg font-black", step.active ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-navy/70")}>
              {step.number}
            </span>
            <span>
              <strong className={cn("block text-sm", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.title}</strong>
              <small className={cn("block text-sm font-bold", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.description}</small>
            </span>
          </div>
          {index < stepperItems.length - 1 ? <span className="mx-8 border-t-2 border-dashed border-blue-200" /> : null}
        </Fragment>
      ))}
    </div>
  );
}

function FormGrid() {
  const InfoIcon = infoIcon;

  return (
    <div className="mt-4 grid grid-cols-4 gap-x-8 gap-y-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {formFields.map((field, index) => {
        const isWide = index === 4;

        return (
          <label className={cn("grid gap-2", isWide && "col-span-1")} key={field.label}>
        <span className="flex items-center gap-2 text-xs font-bold text-brand-navy">
              {field.label}
              <InfoIcon size={14} className="text-brand-muted" />
            </span>
            {field.type === "select" ? (
              <span className="relative">
                <select className="h-9 w-full appearance-none rounded-md border border-brand-line bg-white px-4 pr-10 text-sm font-semibold text-brand-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" defaultValue="">
                  <option value="" disabled>
                    {field.placeholder}
                  </option>
                  <option value="manufacturing">Sản xuất công nghiệp</option>
                  <option value="cold-storage">Kho lạnh</option>
                  <option value="commercial">Thương mại dịch vụ</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
              </span>
            ) : (
              <span className="relative">
                <input
                  className="h-9 w-full rounded-md border border-brand-line bg-white px-4 pr-14 text-sm font-semibold text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                  placeholder={field.placeholder}
                  type="text"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-navy">{field.suffix}</span>
              </span>
            )}
          </label>
        );
      })}
      <div className="grid gap-2">
            <span className="text-xs font-bold text-brand-navy">Có hệ thống điện mặt trời?</span>
        <div className="flex h-9 items-center gap-8 text-sm font-semibold text-brand-navy">
          <label className="flex cursor-pointer items-center gap-2">
            <input className="size-4 accent-brand-blue" name="hasPv" type="radio" value="yes" />
            Có
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input className="size-4 accent-brand-blue" name="hasPv" type="radio" value="no" defaultChecked />
            Không
          </label>
        </div>
      </div>
    </div>
  );
}

function BessGoalPicker() {
  return (
    <div className="mt-3.5">
      <h3 className="text-[13px] font-extrabold text-brand-navy">Mục tiêu sử dụng BESS</h3>
      <div className="mt-2.5 grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {bessGoals.map(({ description, icon: Icon, selected, title }) => (
          <label className={cn("relative block h-[130px] cursor-pointer rounded-lg border bg-white p-3.5", selected ? "border-brand-blue shadow-[0_0_0_1px_rgba(7,91,234,0.2)]" : "border-brand-line")} key={title}>
            <input className="absolute left-4 top-4 size-4 accent-brand-blue" defaultChecked={selected} name="bessGoal" type="radio" value={title} />
            <div className="mt-3 grid justify-items-center text-center">
              <Icon className="text-brand-blue" size={33} />
              <h4 className="mt-2.5 text-xs font-extrabold text-brand-navy">{title}</h4>
              <p className="mt-1.5 text-[10.5px] font-semibold leading-[1.35] text-brand-muted">{description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function BudgetField() {
  return (
    <label className="mt-3 grid max-w-[650px] gap-1.5">
      <span className="flex items-center gap-2 text-xs font-bold text-brand-navy">
        Ngân sách đầu tư dự kiến
        <Info size={14} className="text-brand-muted" />
      </span>
      <span className="grid grid-cols-[1fr_96px]">
        <input
          className="h-9 rounded-l-md border border-r-0 border-brand-line bg-white px-4 text-sm font-semibold text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
          placeholder="Nhập ngân sách"
          type="text"
        />
        <select className="h-9 appearance-none rounded-r-md border border-brand-line bg-white px-4 text-sm font-bold text-brand-navy outline-none focus:border-brand-blue" defaultValue="VND">
          <option value="VND">VNĐ</option>
          <option value="USD">USD</option>
        </select>
      </span>
    </label>
  );
}
