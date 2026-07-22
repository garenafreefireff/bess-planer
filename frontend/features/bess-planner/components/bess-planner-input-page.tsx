"use client";

import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Home,
  Info,
  ShieldCheck
} from "lucide-react";
import { Fragment } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UploadPanel } from "./file-upload-panel";

const plannerSteps = [
  { number: 1, title: "Thông tin dự án", text: "Thiết lập thông tin cơ bản", active: true },
  { number: 2, title: "Upload phụ tải", text: "Tải dữ liệu phụ tải" },
  { number: 3, title: "Upload PV", text: "Tải dữ liệu PV (tùy chọn)" },
  { number: 4, title: "Kiểm tra dữ liệu", text: "Đánh giá chất lượng" },
  { number: 5, title: "Cấu hình mô hình", text: "Thiết lập tham số" },
  { number: 6, title: "Chạy phân tích", text: "Tối ưu & kết quả" }
];

const qualityRows = [
  ["Khoảng thời gian dữ liệu", "01/01/2024 00:00 – 31/12/2024 23:45"],
  ["Số bản ghi", "35.040"],
  ["Tần suất", "15 phút"],
  ["Dữ liệu thiếu", "0 (0,00%)", true],
  ["Ngoại lệ (outlier)", "12 (0,03%)", true],
  ["Trùng lặp", "0 (0,00%)", true]
];

const modelRows = [
  "Phương pháp tối ưu: MILP (Mixed Integer Linear Programming)",
  "Mục tiêu: Tối thiểu tổng chi phí vòng đời (CAPEX + OPEX)",
  "Ràng buộc: Kỹ thuật, vận hành & kinh tế",
  "Kết quả: Cấu hình tối ưu & phân tích hiệu quả tài chính"
];

export function BessPlannerInputPage({ embedded = false }: { embedded?: boolean } = {}) {
  const content = (
      <main className={embedded ? "w-full pb-7 pt-7" : "mx-auto w-[min(1920px,calc(100%_-_88px))] pb-4 pt-5 max-xl:w-[min(1220px,calc(100%_-_42px))]"}>
        <Breadcrumb />

        <section className="mt-4">
          <h1 className="text-[34px] font-bold leading-tight text-brand-navy">Tạo dự án BESS Planner</h1>
          <p className="mt-2 text-base font-semibold text-brand-muted">
            Nhập thông tin dự án và tải lên dữ liệu để bắt đầu phân tích và tối ưu hệ thống BESS
          </p>
        </section>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_500px] gap-6 max-xl:grid-cols-1">
          <section className="grid min-w-0 gap-4">
            <PlannerStepper />
            <PlannerInputCard />
          </section>

          <aside className="grid min-w-0 content-start gap-5">
            <DataQualityCard />
            <ModelSetupCard />
            <SuggestionCard />
          </aside>
        </div>
      </main>
  );

  if (embedded) {
    return content;
  }

  return (
    <>
      <AppHeader activeItem="BESS Planner" variant="planner" />
      {content}
    </>
  );
}

function Breadcrumb() {
  return (
    <div className="flex items-center gap-4 text-sm font-semibold text-brand-muted">
      <Home size={16} />
      <ChevronDown className="-rotate-90" size={14} />
      <span>BESS Planner</span>
      <ChevronDown className="-rotate-90" size={14} />
      <span>Dự án</span>
      <ChevronDown className="-rotate-90" size={14} />
      <span className="text-brand-navy">Tạo dự án mới</span>
    </div>
  );
}

function PlannerStepper() {
  return (
    <Card className="grid h-[78px] min-w-0 grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto] items-center bg-white px-4 shadow-none">
      {plannerSteps.map((step, index) => (
        <Fragment key={step.number}>
          <div className="flex items-center gap-4">
            <span className={cn("grid size-9 place-items-center rounded-full border text-base font-bold", step.active ? "border-brand-blue bg-brand-blue text-white" : "border-blue-200 bg-white text-brand-muted")}>
              {step.number}
            </span>
            <span className="min-w-[106px]">
              <strong className={cn("block text-sm", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.title}</strong>
              <small className="block text-xs font-semibold text-brand-muted">{step.text}</small>
            </span>
          </div>
          {index < plannerSteps.length - 1 ? <span className="mx-3 border-t-2 border-blue-100" /> : null}
        </Fragment>
      ))}
    </Card>
  );
}

function PlannerInputCard() {
  return (
    <Card className="min-w-0 overflow-hidden bg-white shadow-none">
      <div className="p-3.5">
        <ProjectInfoContent />
        <div className="mt-3 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          <UploadPanel
            iconTone="blue"
            title="Dữ liệu phụ tải"
            required
            defaultFile={{
              name: "load_2024_15min.csv",
              meta: "12.4 MB  •  35.040 bản ghi"
            }}
            sampleName="load_sample.csv"
          />
          <UploadPanel
            iconTone="orange"
            title="Dữ liệu PV (tùy chọn)"
            defaultFile={{
              name: "pv_2024_15min.csv",
              meta: "9.1 MB  •  35.040 bản ghi"
            }}
            sampleName="pv_sample.csv"
          />
        </div>
      </div>
      <ActionBar />
    </Card>
  );
}

function ProjectInfoContent() {
  return (
    <div>
      <h2 className="text-lg font-bold text-brand-navy">Thông tin dự án</h2>
      <div className="mt-3 grid grid-cols-3 gap-x-7 gap-y-2.5 max-lg:grid-cols-1">
        <InputField label="Tên dự án" required placeholder="Nhập tên dự án" />
        <InputField label="Địa điểm" required placeholder="Nhập địa điểm dự án" />
        <SelectField label="Ngành sản xuất" required placeholder="Chọn ngành sản xuất" />
        <SelectField label="Cấp điện áp" required placeholder="Chọn cấp điện áp" />
        <SelectField label="Múi giờ" required placeholder="(UTC+07:00) Bangkok, Hanoi, Jakarta" />
      </div>
    </div>
  );
}

function InputField({ label, placeholder, required }: { label: string; placeholder: string; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-brand-muted">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      <input className="h-8 rounded-md border border-brand-line bg-white px-4 text-sm font-semibold outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" placeholder={placeholder} />
    </label>
  );
}

function SelectField({ label, placeholder, required }: { label: string; placeholder: string; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-brand-muted">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      <span className="relative">
        <select className="h-8 w-full appearance-none rounded-md border border-brand-line bg-white px-4 text-sm font-semibold text-brand-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" defaultValue="">
          <option value="" disabled>{placeholder}</option>
          <option>Sản xuất công nghiệp</option>
          <option>Thương mại dịch vụ</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
      </span>
    </label>
  );
}

function ActionBar() {
  return (
    <div className="grid grid-cols-[120px_1fr_180px] items-center border-t border-brand-line bg-white p-4">
      <button className={buttonVariants({ variant: "secondary", className: "h-12 border-brand-line text-brand-navy" })} type="button">Hủy</button>
      <span />
      <Link className={buttonVariants({ className: "h-12 bg-brand-blue text-white hover:bg-brand-blue/90" })} href="/customer-portal/du-an-cua-toi/ket-qua">
        Tiếp tục
        <ChevronDown className="-rotate-90" size={20} />
      </Link>
    </div>
  );
}

function DataQualityCard() {
  return (
    <Card className="min-w-0 bg-white p-3.5 shadow-none">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="flex items-center gap-3 text-lg font-bold text-brand-navy">
          <ShieldCheck className="text-brand-blue" size={24} />
          Kiểm tra chất lượng dữ liệu
        </h2>
        <span className="rounded-md bg-green-50 px-3 py-1 text-sm font-bold text-brand-green">Tốt</span>
      </div>
      <div className="divide-y divide-brand-line">
        {qualityRows.map(([label, value, ok]) => (
          <div className="grid min-h-[30px] grid-cols-[1fr_auto_24px] items-center gap-3 text-sm font-semibold text-brand-muted" key={String(label)}>
            <span>{label}</span>
            <strong className="text-brand-navy">{value}</strong>
            {ok ? <CheckCircle2 className="text-brand-green" size={18} /> : <span />}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-end">
        <span className="rounded-md bg-brand-green px-5 py-1 text-sm font-bold text-white">Hợp lệ</span>
      </div>
    </Card>
  );
}

function ModelSetupCard() {
  return (
    <Card className="min-w-0 bg-white p-4 shadow-none">
      <h2 className="flex items-center gap-3 text-lg font-bold text-brand-navy">
        <span className="grid size-9 place-items-center rounded-md bg-green-50 text-brand-green">
          <FileSpreadsheet size={22} />
        </span>
        Thiết lập mô hình
      </h2>
      <p className="mt-3 text-sm font-semibold leading-5 text-brand-muted">
        BESS Planner sử dụng phương pháp tối ưu hóa khoa học để xác định cấu hình BESS tối ưu về chi phí vòng đời.
      </p>
      <div className="mt-3 grid gap-2">
        {modelRows.map((row) => (
          <div className="flex gap-3 text-sm font-semibold text-brand-muted" key={row}>
            <Check className="shrink-0 text-brand-green" size={18} />
            <span>{row}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SuggestionCard() {
  return (
    <Card className="flex gap-4 bg-blue-50 p-3.5 shadow-none">
      <Info className="shrink-0 text-brand-blue" size={22} />
      <span className="text-sm font-semibold leading-5 text-brand-muted">
        <strong className="block text-base text-brand-blue">Gợi ý</strong>
        Vui lòng đảm bảo dữ liệu có đầy đủ và chất lượng tốt để đạt kết quả phân tích chính xác nhất.
      </span>
    </Card>
  );
}
