"use client";

import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Building2,
  Check,
  CloudUpload,
  EyeOff,
  Folder,
  Info,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { buttonVariants } from "@/components/ui/button";

const portalBenefits = [
  { label: "Quản lý dự án", icon: Folder },
  { label: "Lưu kịch bản", icon: Bookmark },
  { label: "Tải dữ liệu", icon: CloudUpload },
  { label: "Xem báo cáo", icon: BarChart3 },
  { label: "Cộng tác với đội ngũ DataInsight", icon: Users }
];

export function CustomerPortalPage() {
  return (
    <main className="h-screen overflow-hidden bg-white text-brand-navy">
      <div className="grid h-screen grid-cols-[89.7vh_1fr] max-lg:grid-cols-1">
        <PortalShowcase />
        <AuthPanel />
      </div>
    </main>
  );
}

function PortalShowcase() {
  return (
    <section
      aria-label="EnergyInsight Customer Portal"
      className="relative h-screen overflow-hidden bg-[#eef7ff] bg-left-top bg-no-repeat max-lg:hidden"
      style={{ backgroundImage: "url('/customer-portal-plant.png')", backgroundSize: "auto 100%" }}
    >
      <div className="sr-only">
        <h1>Truy cập Customer Portal</h1>
        <ul>
          {portalBenefits.map(({ label }) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const isRegister = mode === "register";

  return (
    <section className="flex h-screen items-center justify-start bg-white py-11 pl-[clamp(52px,3.8vw,72px)] pr-[clamp(28px,4vw,64px)]">
      <div className="w-full max-w-[690px]">
        <div className="rounded-2xl border border-brand-line bg-white px-9 pb-7 pt-7 shadow-soft">
          <div className="grid grid-cols-2 border-b border-brand-line text-center text-[20px] font-extrabold">
            <button
              className={mode === "login" ? "border-b-2 border-brand-blue pb-5 text-brand-blue" : "pb-5 text-brand-muted"}
              onClick={() => setMode("login")}
              type="button"
            >
              Đăng nhập
            </button>
            <button
              className={isRegister ? "border-b-2 border-brand-green pb-5 text-brand-green" : "pb-5 text-brand-muted"}
              onClick={() => setMode("register")}
              type="button"
            >
              Tạo tài khoản
            </button>
          </div>

          {isRegister ? <RegisterForm /> : <LoginForm />}
        </div>

        <p className="mt-5 flex items-center justify-center gap-3 text-xs font-semibold text-brand-muted">
          <ShieldCheck size={20} />
          DataInsight cam kết bảo mật và không chia sẻ thông tin của bạn với bên thứ ba.
        </p>
      </div>
    </section>
  );
}

function RegisterForm() {
  return (
    <form className="mt-6 grid gap-4">
      <Field icon={User} label="Họ tên" placeholder="Nhập họ và tên" />
      <Field icon={Building2} label="Công ty" placeholder="Nhập tên công ty" />
      <Field icon={Mail} label="Email công việc" placeholder="name@company.com" type="email" />
      <Field icon={Phone} label="Số điện thoại" placeholder="Nhập số điện thoại" />

      <div className="grid grid-cols-2 gap-9 max-md:grid-cols-1">
        <Field icon={Lock} label="Mật khẩu" placeholder="Nhập mật khẩu" type="password" trailingIcon={EyeOff} />
        <Field icon={Lock} label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" type="password" trailingIcon={EyeOff} />
      </div>

      <label className="flex items-center gap-3 text-sm font-semibold text-brand-navy">
        <span className="grid size-5 place-items-center rounded bg-brand-green text-white">
          <Check size={16} />
        </span>
        <span>
          Tôi đồng ý với <a className="font-extrabold text-brand-blue" href="#">Điều khoản sử dụng</a> và{" "}
          <a className="font-extrabold text-brand-blue" href="#">Chính sách bảo mật</a> của DataInsight.
        </span>
      </label>

      <button className={buttonVariants({ variant: "green", className: "h-11 text-base" })} type="button">
        Tạo tài khoản
        <ArrowRight size={20} />
      </button>

      <AuthDivider />

      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <SocialButton provider="google" label="Tiếp tục với Google" />
        <SocialButton provider="microsoft" label="Tiếp tục với Microsoft" />
      </div>

      <PortalNotice />
    </form>
  );
}

function LoginForm() {
  return (
    <form className="mt-8 grid gap-5">
      <Field icon={Mail} label="Email công việc" placeholder="name@company.com" type="email" />
      <Field icon={Lock} label="Mật khẩu" placeholder="Nhập mật khẩu" type="password" trailingIcon={EyeOff} />

      <div className="flex items-center justify-between gap-4 text-sm font-semibold">
        <label className="flex items-center gap-2 text-brand-navy">
          <span className="grid size-5 place-items-center rounded border border-brand-line bg-white">
            <Check size={14} className="text-brand-green" />
          </span>
          Ghi nhớ đăng nhập
        </label>
        <a className="font-extrabold text-brand-blue" href="#">Quên mật khẩu?</a>
      </div>

      <button className={buttonVariants({ className: "h-11 bg-brand-blue text-base text-white hover:bg-brand-blue/90" })} type="button">
        Đăng nhập
        <ArrowRight size={20} />
      </button>

      <AuthDivider />

      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <SocialButton provider="google" label="Đăng nhập với Google" />
        <SocialButton provider="microsoft" label="Đăng nhập với Microsoft" />
      </div>

      <PortalNotice />
    </form>
  );
}

function AuthDivider() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm font-semibold text-brand-muted">
      <span className="h-px bg-brand-line" />
      <span>Hoặc tiếp tục với</span>
      <span className="h-px bg-brand-line" />
    </div>
  );
}

function PortalNotice() {
  return (
    <div className="flex items-center gap-4 rounded-md border border-brand-blue/35 bg-blue-50 px-4 py-3 text-sm font-semibold text-brand-muted">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-blue text-white">
        <Info size={18} />
      </span>
      <span>
        <strong className="block text-brand-navy">BESS Planner yêu cầu đăng nhập.</strong>
        Mọi dữ liệu bạn tải lên và kịch bản tạo ra sẽ được quản lý an toàn trong Portal.
      </span>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  placeholder,
  trailingIcon: TrailingIcon,
  type = "text"
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  placeholder: string;
  trailingIcon?: ComponentType<{ size?: number; className?: string }>;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-brand-navy">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={19} />
        <input
          className="h-11 w-full rounded-md border border-brand-line bg-white px-12 text-sm font-semibold text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
          placeholder={placeholder}
          type={type}
        />
        {TrailingIcon ? <TrailingIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" size={19} /> : null}
      </span>
    </label>
  );
}

function SocialButton({ label, provider }: { label: string; provider: "google" | "microsoft" }) {
  return (
    <button className="flex h-11 items-center justify-center gap-4 rounded-md border border-brand-line bg-white text-sm font-bold text-brand-muted hover:bg-blue-50" type="button">
      {provider === "google" ? (
        <span className="text-2xl font-black text-[#EA4335]">G</span>
      ) : (
        <span className="grid size-6 grid-cols-2 gap-0.5">
          <span className="bg-[#f25022]" />
          <span className="bg-[#7fba00]" />
          <span className="bg-[#00a4ef]" />
          <span className="bg-[#ffb900]" />
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}
