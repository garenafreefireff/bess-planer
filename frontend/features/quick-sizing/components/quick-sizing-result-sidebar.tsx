import Image from "next/image";
import { ChevronDown, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { plannerArrowIcon, reportFields } from "../data/quick-sizing-result-content";

export function ReportLeadPanel() {
  const PlannerArrow = plannerArrowIcon;

  return (
    <aside className="grid content-start gap-5">
      <Card className="bg-white p-6 shadow-none">
        <h2 className="text-2xl font-extrabold text-brand-navy">Nhận báo cáo chi tiết & tư vấn miễn phí</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-brand-muted">
          Để nhận báo cáo chi tiết với đầy đủ biểu đồ, phân tích và khuyến nghị, vui lòng để lại thông tin.
        </p>
        <form className="mt-5 grid gap-3">
          {reportFields.map(({ icon: Icon, placeholder, type }) => (
            <label className="relative" key={placeholder}>
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
              {type === "select" ? (
                <>
                  <select className="h-10 w-full appearance-none rounded-md border border-brand-line bg-white pl-11 pr-10 text-sm font-semibold text-brand-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" defaultValue="">
                    <option value="" disabled>{placeholder}</option>
                    <option value="manufacturing">Sản xuất</option>
                    <option value="service">Dịch vụ</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                </>
              ) : (
                <input
                  className="h-10 w-full rounded-md border border-brand-line bg-white pl-11 pr-4 text-sm font-semibold text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                  placeholder={placeholder}
                  type="text"
                />
              )}
            </label>
          ))}
          <button className={buttonVariants({ variant: "green", className: "mt-2 h-11 w-full text-base" })} type="submit">
            <Mail size={18} />
            Nhận báo cáo qua email
          </button>
        </form>
      </Card>

      <Card className="grid grid-cols-[1fr_140px] items-center gap-4 overflow-hidden bg-blue-50/80 p-6 shadow-none">
        <div>
          <h3 className="text-xl font-extrabold text-brand-navy">Phân tích chuyên sâu với dữ liệu thực tế</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-brand-muted">
            Đánh giá chi tiết hiệu quả đầu tư, tối ưu cấu hình và kịch bản vận hành với công cụ BESS Planner.
          </p>
          <a className={buttonVariants({ variant: "secondary", className: "mt-4 h-10 w-full justify-between bg-white text-base" })} href="#">
            Chuyển sang BESS Planner
            <PlannerArrow size={20} />
          </a>
        </div>
        <div className="relative h-[110px] overflow-hidden rounded-md bg-white">
          <Image src="/bess-hero.png" alt="" fill sizes="140px" className="object-cover object-left" />
        </div>
      </Card>
    </aside>
  );
}
