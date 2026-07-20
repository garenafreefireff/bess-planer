"use client";

import { Facebook, Linkedin, Mail, MapPin, Send, Youtube } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { EnergyInsightLogo } from "./brand-logo";

export function PublicFooter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submitNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Vui lòng nhập email hợp lệ.");
      return;
    }

    setMessage("Đăng ký nhận bản tin thành công.");
    setEmail("");
  };

  return (
    <footer className="border-t border-brand-line bg-white/95">
      <div className="site-container grid grid-cols-[1.8fr_0.72fr_0.78fr_0.78fr_1.18fr_1.45fr] gap-8 py-12 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div className="min-w-0">
          <EnergyInsightLogo />
          <p className="mt-4 max-w-[300px] text-sm leading-6 text-brand-muted">
            Nền tảng phân tích & lập kế hoạch BESS toàn diện cho doanh nghiệp tại Việt Nam.
          </p>
          <div className="mt-4 flex gap-3 text-brand-blue">
            <a className="grid size-9 place-items-center rounded-full bg-blue-50 hover:bg-brand-blue hover:text-white" href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
            <a className="grid size-9 place-items-center rounded-full bg-blue-50 hover:bg-brand-blue hover:text-white" href="#" aria-label="YouTube"><Youtube size={20} /></a>
            <a className="grid size-9 place-items-center rounded-full bg-blue-50 hover:bg-brand-blue hover:text-white" href="#" aria-label="Facebook"><Facebook size={20} /></a>
          </div>
        </div>
        <FooterLinks title="Sản phẩm" items={["Quick Sizing", "BESS Planner"]} />
        <FooterLinks title="Tài nguyên" items={["Hướng dẫn sử dụng", "Câu hỏi thường gặp"]} />
        <FooterLinks title="Công ty" items={["Giới thiệu DataInsight", "Tin tức"]} />
        <div className="min-w-0">
          <h3 className="mb-3 text-sm font-bold text-brand-navy">Liên hệ</h3>
          <a className="mb-2 flex gap-2 text-sm leading-6 text-brand-muted hover:text-brand-blue" href="mailto:energyinsight@datainsight.vn">
            <Mail size={16} /> energyinsight@datainsight.vn
          </a>
          <a className="mb-2 flex gap-2 text-sm leading-6 text-brand-muted hover:text-brand-blue" href="tel:+842466857906">
            (+84) 24 6685 7906
          </a>
          <a className="flex gap-2 text-sm leading-6 text-brand-muted hover:text-brand-blue" href="https://www.google.com/maps/search/?api=1&query=S%E1%BB%91%206%20Kim%20%C4%90%E1%BB%93ng%2C%20ph%C6%B0%E1%BB%9Dng%20Gi%C3%A1p%20B%C3%A1t%2C%20Qu%E1%BA%ADn%20Ho%C3%A0ng%20Mai%2C%20Th%C3%A0nh%20ph%E1%BB%91%20H%C3%A0%20N%E1%BB%99i" target="_blank" rel="noreferrer">
            <MapPin size={16} /> Số 6 Kim Đồng, phường Giáp Bát, Quận Hoàng Mai, Thành phố Hà Nội, Việt Nam
          </a>
        </div>
        <form className="min-w-0 rounded-lg border border-brand-line bg-slate-50/70 p-4" onSubmit={submitNewsletter}>
          <h3 className="mb-2 text-sm font-bold text-brand-navy">Nhận bản tin EnergyInsight</h3>
          <p className="mb-3 text-sm leading-5 text-brand-muted">Cập nhật xu hướng & kiến thức mới nhất</p>
          <label className="grid h-11 grid-cols-[1fr_50px] overflow-hidden rounded-md border border-slate-300 bg-white">
            <span className="sr-only">Email</span>
            <Input className="h-full rounded-none border-0 focus-visible:ring-0" onChange={(event) => setEmail(event.target.value)} type="email" value={email} placeholder="Nhập email của bạn" />
            <button className="grid place-items-center bg-brand-blue text-white" type="submit" aria-label="Gửi email">
              <Send size={19} />
            </button>
          </label>
          {message ? <p className="mt-2 text-xs font-semibold text-brand-blue">{message}</p> : null}
        </form>
      </div>
      <div className="site-container flex justify-between gap-5 border-t border-brand-line py-4 text-xs text-brand-muted max-sm:flex-col">
        <span>© 2025 DataInsight. All rights reserved.</span>
        <nav className="flex gap-16 max-sm:flex-wrap max-sm:gap-5">
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Điều khoản sử dụng</a>
          <a href="#">Cookie Settings</a>
        </nav>
      </div>
    </footer>
  );
}

function FooterLinks({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-brand-navy">{title}</h3>
      {items.map((item) => (
        <a className="mb-2 block text-sm leading-6 text-brand-muted hover:text-brand-blue" href="#" key={item}>
          {item}
        </a>
      ))}
    </div>
  );
}
