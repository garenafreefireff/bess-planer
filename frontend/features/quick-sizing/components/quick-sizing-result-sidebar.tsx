"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail, Phone, Send, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const leadFields = [
  { label: "Họ và tên", icon: UserRound },
  { label: "Email công việc", icon: Mail, type: "email" },
  { label: "Số điện thoại", icon: Phone, type: "tel" }
];

export function ReportLeadPanel() {
  const [sent, setSent] = useState(false);

  return (
    <aside className="sticky top-24 grid h-fit content-start gap-4">
      <Card className="rounded-xl bg-white p-5 shadow-panel">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-green-50 text-brand-green">
              <CheckCircle2 size={30} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-brand-navy">Báo cáo đã được gửi thành công</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-brand-muted">Email: nguyenvana@company.vn</p>
            <p className="text-sm font-medium leading-6 text-brand-muted">Mã kết quả: QS-2026-00125</p>
            <div className="mt-5 grid gap-3">
              <button className={buttonVariants({ variant: "secondary", className: "h-11" })} type="button">Kiểm tra email</button>
              <a className={buttonVariants({ variant: "green", className: "h-11" })} href="/customer-portal">Chuyển sang BESS Planner</a>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-brand-navy">Nhận báo cáo chi tiết</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
              Nhận file PDF chứa cấu hình đề xuất, biểu đồ và phân tích hiệu quả đầu tư.
            </p>
            <form
              className="mt-4 grid gap-2.5"
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
              }}
            >
              {leadFields.map(({ icon: Icon, label, type }) => (
                <label className="relative grid gap-1.5" key={label}>
                  <span className="text-sm font-semibold text-brand-navy">{label} <span className="text-red-600">*</span></span>
                  <Icon className="absolute left-4 top-[38px] text-brand-muted" size={17} />
                  <input
                    className="h-10 w-full rounded-lg border border-brand-line bg-white pl-11 pr-4 text-sm font-medium text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
                    placeholder={label}
                    required
                    type={type ?? "text"}
                  />
                </label>
              ))}
              <label className="mt-1 flex items-start gap-3 text-sm font-medium leading-6 text-brand-navy">
                <input className="mt-1 size-4 accent-brand-blue" required type="checkbox" />
                <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</span>
              </label>
              <label className="flex items-start gap-3 text-sm font-medium leading-6 text-brand-muted">
                <input className="mt-1 size-4 accent-brand-blue" type="checkbox" />
                <span>Tôi đồng ý nhận thông tin tư vấn từ DataInsight.</span>
              </label>
              <button className={buttonVariants({ variant: "green", className: "mt-1 h-11 w-full" })} type="submit">
                <Send size={18} />
                Nhận báo cáo qua email
              </button>
              <p className="text-center text-xs font-medium text-brand-muted">Báo cáo sẽ được gửi trong vài phút.</p>
            </form>
          </>
        )}
      </Card>

      <Card className="rounded-xl bg-blue-50/80 p-5 shadow-panel">
        <h3 className="text-lg font-bold text-brand-navy">Phân tích bằng dữ liệu thực tế</h3>
        <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
          Thông tin nhà máy, biểu giá và sizing hiện tại sẽ được tự động kế thừa.
        </p>
        <a className={buttonVariants({ variant: "secondary", className: "mt-4 h-11 w-full justify-between bg-white" })} href="/customer-portal">
          Chuyển sang BESS Planner
          <ArrowRight size={18} />
        </a>
        <p className="mt-3 text-xs font-medium text-brand-muted">Không cần nhập lại thông tin.</p>
      </Card>
    </aside>
  );
}
