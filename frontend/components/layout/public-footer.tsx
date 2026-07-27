"use client";

import { Facebook, Linkedin, Mail, MapPin, Send, Youtube } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { EnergyInsightLogo } from "./brand-logo";

export function PublicFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const submitNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterSubmitted(true);
  };

  return (
    <footer className="border-t border-brand-line bg-white/95">
      <div className="site-container grid grid-cols-[1.8fr_0.72fr_0.78fr_0.78fr_1.18fr_1.45fr] gap-8 py-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div className="min-w-0">
          <EnergyInsightLogo />
          <p className="mt-4 max-w-[300px] text-xs leading-5 text-brand-muted">
            Nền tảng phân tích & lập kế hoạch BESS toàn diện cho doanh nghiệp tại Việt Nam.
          </p>
          <div className="mt-3 flex gap-3 text-brand-blue">
            <Linkedin size={18} />
            <Youtube size={18} />
            <Facebook size={18} />
          </div>
        </div>
        <FooterLinks title="Sản phẩm" items={["Quick Sizing", "BESS Planner"]} />
        <FooterLinks title="Tài nguyên" items={["Hướng dẫn sử dụng", "Câu hỏi thường gặp"]} />
        <FooterLinks title="Công ty" items={["Giới thiệu DataInsight", "Tin tức"]} />
        <div className="min-w-0">
          <h3 className="mb-3 text-sm font-bold text-brand-navy">Liên hệ</h3>
          <a className="mb-2 flex gap-2 text-xs leading-6 text-brand-muted" href="mailto:energyinsight@datainsight.vn">
            <Mail size={16} /> energyinsight@datainsight.vn
          </a>
          <a className="mb-2 flex gap-2 text-xs leading-6 text-brand-muted" href="tel:0916848638">
            0916848638
          </a>
          <a className="flex gap-2 text-xs leading-6 text-brand-muted" href="/lien-he">
            <MapPin size={16} />
            <span>Số 02 Louis IX -LK 29, Khu đô thị mới Hoàng Văn Thụ, Phường Hoàng Mai, TP Hà Nội, Việt Nam</span>
          </a>
        </div>
        <form className="min-w-0 rounded-lg border border-brand-line bg-slate-50/70 p-4" onSubmit={submitNewsletter}>
          <h3 className="mb-2 text-sm font-bold text-brand-navy">Nhận bản tin EnergyInsight</h3>
          <p className="mb-3 text-xs leading-5 text-brand-muted">Cập nhật xu hướng & kiến thức mới nhất</p>
          {newsletterSubmitted ? (
            <div className="rounded-md border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-green">
              Đã ghi nhận email {newsletterEmail} trên giao diện demo.
            </div>
          ) : (
            <label className="grid h-10 grid-cols-[1fr_50px] overflow-hidden rounded-md border border-slate-300 bg-white">
              <span className="sr-only">Email</span>
              <Input className="h-full rounded-none border-0 focus-visible:ring-0" onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Nhập email của bạn" required type="email" value={newsletterEmail} />
              <button className="grid place-items-center bg-brand-blue text-white" type="submit" aria-label="Gửi email">
                <Send size={19} />
              </button>
            </label>
          )}
        </form>
      </div>
      <div className="site-container flex justify-between gap-5 border-t border-brand-line py-2.5 text-xs text-brand-muted max-sm:flex-col">
        <span>© 2026 DataInsight. All rights reserved.</span>
        <nav className="flex gap-16 max-sm:flex-wrap max-sm:gap-5">
          <a href="/lien-he">Chính sách bảo mật</a>
          <a href="/lien-he">Điều khoản sử dụng</a>
          <a href="/lien-he">Cookie Settings</a>
        </nav>
      </div>
    </footer>
  );
}

function FooterLinks({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-brand-navy">{title}</h3>
      {items.map((item) => {
        const href = item === "Quick Sizing" ? "/quick-sizing" : item === "BESS Planner" ? "/customer-portal/du-an-cua-toi" : "/lien-he";

        return (
          <a className="mb-2 block text-xs leading-6 text-brand-muted" href={href} key={item}>
            {item}
          </a>
        );
      })}
    </div>
  );
}
