"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const supportCards = [
  {
    icon: Zap,
    title: "Tư vấn Quick Sizing",
    text: "Ước tính nhanh quy mô BESS và hiệu quả tài chính.",
    action: "Đăng ký tư vấn",
    tone: "blue"
  },
  {
    icon: BarChart3,
    title: "Demo BESS Planner",
    text: "Trải nghiệm phân tích chi tiết và lập kế hoạch đầu tư.",
    action: "Yêu cầu demo",
    tone: "green"
  },
  {
    icon: BarChart3,
    title: "Hỗ trợ dữ liệu / phụ tải",
    text: "Hướng dẫn chuẩn bị dữ liệu, phụ tải và kết nối hệ thống.",
    action: "Nhận hỗ trợ",
    tone: "purple"
  },
  {
    icon: Handshake,
    title: "Hợp tác dự án",
    text: "Hợp tác triển khai và tư vấn giải pháp BESS toàn diện.",
    action: "Liên hệ hợp tác",
    tone: "orange"
  }
];

const trustItems = [
  { icon: ShieldCheck, title: "Bảo mật tuyệt đối", text: "Cam kết bảo mật thông tin theo tiêu chuẩn quốc tế." },
  { icon: Zap, title: "Phản hồi nhanh chóng", text: "Tiếp nhận và phản hồi trong vòng 24 giờ làm việc." },
  { icon: CheckCircle2, title: "Giải pháp chuyên sâu", text: "Phân tích chính xác, dễ hiểu, định hướng hành động rõ ràng." },
  { icon: Users, title: "Đồng hành dài hạn", text: "Hỗ trợ liên tục trong suốt quá trình triển khai và vận hành." },
  { icon: Trophy, title: "Kinh nghiệm thực tiễn", text: "Đội ngũ chuyên gia giàu kinh nghiệm trong nhiều dự án BESS." }
];

export function ContactPage() {
  return (
    <>
      <PublicHeader activeItem="Liên hệ" />
      <main className="site-container pb-0 pt-5">
        <section>
          <h1 className="text-[42px] font-bold leading-tight text-brand-navy">
            Liên hệ với đội ngũ <span className="text-brand-green">Energy</span><span className="text-brand-blue">Insight</span>
          </h1>
          <p className="mt-3 max-w-[720px] text-base font-semibold leading-7 text-brand-muted">
            Chúng tôi sẵn sàng đồng hành cùng doanh nghiệp trong hành trình phân tích, lập kế hoạch và triển khai hệ thống BESS hiệu quả, bền vững.
          </p>
        </section>

        <section className="mt-4 grid grid-cols-[1fr_0.98fr] gap-7 max-xl:grid-cols-1">
          <ContactForm />
          <ContactInfo />
        </section>

        <section className="mt-4 grid grid-cols-[0.72fr_repeat(4,1fr)] gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-brand-navy">Bạn cần hỗ trợ gì?</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-brand-muted">
              Chọn nhu cầu của bạn để chúng tôi kết nối với chuyên gia phù hợp nhất.
            </p>
          </div>
          {supportCards.map((item) => (
            <SupportCard key={item.title} {...item} />
          ))}
        </section>

        <ProcessSection />
        <TrustSection />
      </main>
      <PublicFooter />
    </>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", interest: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="grid min-h-[420px] place-items-center bg-white p-5 text-center shadow-none">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-green-50 text-brand-green"><CheckCircle2 size={30} /></span>
          <h2 className="mt-4 text-2xl font-bold text-brand-navy">Đã ghi nhận yêu cầu liên hệ</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-brand-muted">Thông tin của {form.name} tại {form.company} đã được lưu trên giao diện demo với email <strong className="text-brand-navy">{form.email}</strong>.</p>
          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs font-medium leading-5 text-brand-muted">Frontend hiện chưa gửi dữ liệu ra ngoài. Khi tích hợp dịch vụ liên hệ, trạng thái này sẽ được thay bằng kết quả gửi thực tế.</p>
          <button className={buttonVariants({ variant: "secondary", className: "mt-5 h-10" })} onClick={() => setSubmitted(false)} type="button">Chỉnh sửa nội dung</button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-5 shadow-none">
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <InputBox icon={Users} label="Họ tên" placeholder="Nhập họ và tên của bạn" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <InputBox icon={BriefcaseBusiness} label="Công ty" placeholder="Nhập tên công ty" value={form.company} onChange={(company) => setForm({ ...form, company })} />
          <InputBox icon={Mail} label="Email công việc" placeholder="Nhập email công việc" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <InputBox icon={Phone} label="Số điện thoại" placeholder="Nhập số điện thoại" type="tel" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        </div>
        <label className="grid gap-2 text-sm font-bold text-brand-navy">
          <span>Nhu cầu quan tâm <span className="text-red-500">*</span></span>
          <span className="relative">
            <select className="h-11 w-full appearance-none rounded-md border border-brand-line bg-white px-4 text-sm font-semibold text-brand-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" onChange={(event) => setForm({ ...form, interest: event.target.value })} required value={form.interest}>
              <option value="" disabled>Chọn nhu cầu quan tâm</option>
              <option>Tư vấn Quick Sizing</option>
              <option>Demo BESS Planner</option>
              <option>Hỗ trợ dữ liệu / phụ tải</option>
              <option>Hợp tác dự án</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-brand-navy">
          <span>Nội dung liên hệ <span className="text-red-500">*</span></span>
          <textarea className="min-h-[92px] resize-none rounded-md border border-brand-line bg-white px-4 py-3 text-sm font-semibold outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Vui lòng mô tả chi tiết nhu cầu hoặc câu hỏi của bạn" required value={form.message} />
        </label>
        <button className={buttonVariants({ variant: "green", className: "h-10" })} type="submit">
          <Mail size={17} />
          Gửi yêu cầu
        </button>
        <p className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-muted">
          <ShieldCheck className="text-brand-green" size={15} />
          Dữ liệu đang được xử lý trong chế độ frontend demo và chưa gửi ra ngoài.
        </p>
      </form>
    </Card>
  );
}

function InputBox({ icon: Icon, label, placeholder, value, onChange, type = "text" }: { icon: LucideIcon; label: string; placeholder: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-brand-navy">
      <span>{label} <span className="text-red-500">*</span></span>
      <span className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={17} />
        <input className="h-11 w-full rounded-md border border-brand-line bg-white pl-11 pr-4 text-sm font-semibold outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required type={type} value={value} />
      </span>
    </label>
  );
}

function ContactInfo() {
  return (
    <Card className="bg-white p-5 shadow-none">
      <h2 className="text-xl font-bold text-brand-navy">Thông tin liên hệ</h2>
      <div className="mt-4 grid grid-cols-[280px_1fr] gap-6 max-md:grid-cols-1">
        <div className="grid gap-3">
          <ContactInfoCard icon={Mail} title="Email" lines={["energyinsight@datainsight.vn", "Hỗ trợ trong vòng 24h làm việc"]} />
          <ContactInfoCard icon={Phone} title="Hotline" lines={["(+84) 24 6685 7906", "Thứ 2 - Thứ 6: 08:30 – 17:30"]} />
          <ContactInfoCard icon={MapPin} title="Văn phòng" lines={["Tòa nhà 3D, Duy Tân, Cầu Giấy,", "Hà Nội, Việt Nam", "Xem chỉ đường ↗"]} />
          <ContactInfoCard icon={Clock3} title="Giờ làm việc" lines={["Thứ 2 – Thứ 6: 08:30 – 17:30", "Nghỉ thứ 7, chủ nhật và ngày lễ"]} />
        </div>
        <MapPreview />
      </div>
    </Card>
  );
}

function ContactInfoCard({ icon: Icon, lines, title }: { icon: LucideIcon; lines: string[]; title: string }) {
  return (
    <div className="grid min-h-[68px] grid-cols-[44px_1fr] items-center gap-3 rounded-lg border border-brand-line bg-white p-3">
      <span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-brand-blue">
        <Icon size={22} />
      </span>
      <span>
        <strong className="block text-sm text-brand-navy">{title}</strong>
        {lines.map((line, index) => (
          <small className={cn("block text-xs font-semibold leading-5", index === 0 ? "text-brand-navy" : "text-brand-muted")} key={line}>
            {line}
          </small>
        ))}
      </span>
    </div>
  );
}

function MapPreview() {
  return (
    <div className="relative min-h-[290px] overflow-hidden rounded-lg border border-brand-line bg-[#eef5ef]">
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(35deg,transparent_0_42%,#d7e8d9_42%_47%,transparent_47%_100%),linear-gradient(115deg,transparent_0_48%,#d8e5f1_48%_53%,transparent_53%_100%),linear-gradient(0deg,transparent_0_49%,#e8d9d0_49%_51%,transparent_51%_100%)] [background-size:210px_120px,260px_160px,170px_110px]" />
      <span className="absolute left-10 top-7 rounded bg-white/85 px-3 py-1 text-xs font-semibold text-brand-muted">Bảo tàng Dân tộc<br />Học Việt Nam</span>
      <span className="absolute bottom-16 left-8 rounded bg-white/85 px-3 py-1 text-xs font-semibold text-brand-muted">Keangnam Hanoi<br />Landmark Tower</span>
      <span className="absolute left-[45%] top-24 rotate-6 text-sm font-bold text-brand-blue">Duy Tân</span>
      <span className="absolute left-[40%] top-10 rotate-[-82deg] text-xs font-bold text-brand-muted">Tôn Thất Thuyết</span>
      <span className="absolute right-10 bottom-20 rounded bg-green-100 px-3 py-2 text-xs font-semibold text-brand-green">Công viên<br />Cầu Giấy</span>
      <MapPin className="absolute left-[55%] top-[40%] -translate-x-1/2 -translate-y-1/2 fill-brand-blue text-brand-blue" size={42} />
      <div className="absolute right-20 top-[33%] rounded-lg bg-white px-5 py-4 shadow-panel">
        <strong className="block text-sm text-brand-navy">DataInsight JSC</strong>
        <small className="mt-1 block text-xs font-semibold leading-5 text-brand-muted">Tòa nhà 3D, Duy Tân, Cầu Giấy,<br />Hà Nội, Việt Nam</small>
      </div>
    </div>
  );
}

function SupportCard({ action, icon: Icon, text, title, tone }: (typeof supportCards)[number]) {
  return (
    <Card className="grid min-h-[112px] grid-cols-[54px_1fr] items-center gap-4 bg-white p-4 shadow-none">
      <span className={cn("grid size-12 place-items-center rounded-lg", tone === "green" ? "bg-green-50 text-brand-green" : tone === "orange" ? "bg-orange-50 text-orange-500" : tone === "purple" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-brand-blue")}>
        <Icon size={28} />
      </span>
      <span>
        <strong className="block text-sm text-brand-navy">{title}</strong>
        <small className="mt-1 block text-xs font-semibold leading-5 text-brand-muted">{text}</small>
        <a className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-brand-blue" href="mailto:energyinsight@datainsight.vn">
          {action}
          <Send size={13} />
        </a>
      </span>
    </Card>
  );
}

function ProcessSection() {
  const steps = [
    ["1", "Gửi yêu cầu", "Bạn điền thông tin hoặc liên hệ trực tiếp. Chúng tôi tiếp nhận và phản hồi nhanh chóng."],
    ["2", "Trao đổi cùng chuyên gia", "Chuyên gia phân tích nhu cầu, mục tiêu và đề xuất hướng giải pháp phù hợp."],
    ["3", "Nhận đề xuất phù hợp", "Bạn nhận báo cáo, tư vấn và lộ trình triển khai tối ưu cho doanh nghiệp."]
  ];

  return (
    <Card className="mt-4 bg-white p-5 shadow-none">
      <div className="grid grid-cols-[330px_1fr] gap-8 max-lg:grid-cols-1">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Quy trình làm việc với EnergyInsight</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-brand-muted">Chúng tôi đảm bảo quy trình rõ ràng, nhanh chóng và hiệu quả.</p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-6 max-lg:grid-cols-1">
          {steps.map(([number, title, text], index) => (
            <div className="contents max-lg:block" key={number}>
              <div className="grid grid-cols-[42px_1fr] gap-4">
                <span className="grid size-9 place-items-center rounded-full bg-brand-blue text-base font-bold text-white">{number}</span>
                <span>
                  <strong className="block text-sm text-brand-navy">{title}</strong>
                  <small className="mt-1 block text-xs font-semibold leading-5 text-brand-muted">{text}</small>
                </span>
              </div>
              {index < steps.length - 1 ? <span className="h-px w-16 border-t-2 border-dashed border-blue-200 max-lg:hidden" /> : null}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function TrustSection() {
  return (
    <section className="mt-4 grid grid-cols-[300px_1fr] items-center gap-6 max-lg:grid-cols-1">
      <h2 className="text-2xl font-bold leading-tight text-brand-navy">
        Vì sao doanh nghiệp tin tưởng
        <br />
        lựa chọn <span className="text-brand-green">Energy</span><span className="text-brand-blue">Insight?</span>
      </h2>
      <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-3 max-md:grid-cols-1">
        {trustItems.map(({ icon: Icon, text, title }) => (
          <div className="grid grid-cols-[44px_1fr] items-center gap-3" key={title}>
            <span className="grid size-11 place-items-center rounded-lg border border-brand-line bg-white text-brand-blue">
              <Icon size={24} />
            </span>
            <span>
              <strong className="block text-sm text-brand-navy">{title}</strong>
              <small className="mt-1 block text-xs font-semibold leading-5 text-brand-muted">{text}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
