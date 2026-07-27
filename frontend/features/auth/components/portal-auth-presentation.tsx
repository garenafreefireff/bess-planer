"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Gauge,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Zap
} from "lucide-react";
import { type FormEvent, type InputHTMLAttributes, useId, useState } from "react";

import { EnergyInsightLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PortalAuthMode = "login" | "register";

export interface PortalAuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName: string;
  phone: string;
  industry: string;
}

interface PortalAuthPageProps {
  error: string | null;
  form: PortalAuthFormState;
  mode: PortalAuthMode;
  submitting: boolean;
  onFieldChange: (field: keyof PortalAuthFormState, value: string) => void;
  onModeChange: (mode: PortalAuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const compactBenefits = [
  "Quản lý dự án và kịch bản phân tích",
  "Phân tích dữ liệu phụ tải và biểu giá",
  "Theo dõi CAPEX, tiết kiệm, NPV và hoàn vốn"
];

export function PortalAuthPage({
  error,
  form,
  mode,
  submitting,
  onFieldChange,
  onModeChange,
  onSubmit
}: PortalAuthPageProps) {
  return (
    <main className="relative min-h-[100dvh] bg-[#f7faff] text-brand-navy">
      <AuthBackground />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1220px] items-center px-8 py-7 max-lg:block max-lg:px-6 max-lg:py-8 max-sm:px-5">
        <header className="absolute right-8 top-6 z-20 max-sm:right-5 max-sm:top-5">
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 text-sm font-bold text-brand-muted shadow-sm transition hover:border-brand-blue/30 hover:bg-white hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/25"
            href="/"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Quay lại trang chủ
          </Link>
        </header>

        <div className="grid w-full grid-cols-[minmax(0,1.1fr)_minmax(380px,430px)] items-center gap-16 max-xl:gap-14 max-lg:grid-cols-1 max-lg:gap-6 max-lg:pt-16">
          <AuthBrandHero />
          <AuthFormCard
            error={error}
            form={form}
            mode={mode}
            submitting={submitting}
            onFieldChange={onFieldChange}
            onModeChange={onModeChange}
            onSubmit={onSubmit}
          />
          <div className="hidden max-lg:block max-md:hidden">
            <AuthCompactBenefits />
          </div>
        </div>
      </div>
    </main>
  );
}

function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(7,91,234,0.10),transparent_30%),radial-gradient(circle_at_86%_80%,rgba(12,163,75,0.08),transparent_26%),linear-gradient(135deg,#f8fbff_0%,#f1f7ff_54%,#fbfffd_100%)]" />
      <div className="absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(7,91,234,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(7,91,234,0.07)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute left-[8%] top-[18%] h-48 w-48 rounded-full bg-blue-200/25 blur-3xl" />
      <div className="absolute bottom-[12%] right-[11%] h-48 w-48 rounded-full bg-emerald-200/22 blur-3xl" />
      <div className="absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-brand-blue/12 to-transparent" />
    </div>
  );
}

function AuthBrandHero() {
  return (
    <section className="min-w-0 max-lg:max-w-[680px]">
      <Link className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/25" href="/" aria-label="EnergyInsight trang chủ">
        <EnergyInsightLogo />
      </Link>
      <div className="mt-8 max-lg:mt-6 [@media(min-width:1024px)_and_(max-height:799px)]:mt-5">
        <h1 className="max-w-[600px] text-[46px] font-extrabold leading-[1.08] text-brand-navy max-xl:text-[44px] max-md:text-[36px] max-sm:text-[30px]">
          Không gian làm việc thông minh cho <span className="text-brand-blue">dự án BESS.</span>
        </h1>
        <p className="mt-4 max-w-[580px] text-[17px] font-medium leading-7 text-brand-muted max-md:text-base max-md:leading-7">
          Quản lý dữ liệu, so sánh kịch bản kỹ thuật và đánh giá hiệu quả đầu tư trên một nền tảng thống nhất.
        </p>
      </div>

      <div className="mt-6 max-w-[600px] max-lg:hidden [@media(min-width:1024px)_and_(max-height:799px)]:mt-5">
        <AuthCompactBenefits />
      </div>

      <AuthProductPreview />
    </section>
  );
}

function AuthCompactBenefits() {
  return (
    <ul className="grid gap-3 text-[15px] font-semibold leading-6 text-brand-navy max-md:gap-2 max-md:text-sm">
      {compactBenefits.map((benefit) => (
        <li className="flex min-w-0 items-start gap-3" key={benefit}>
          <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-brand-green" size={18} />
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  );
}

function AuthProductPreview() {
  return (
    <div className="mt-6 max-w-[560px] max-lg:hidden [@media(min-width:1024px)_and_(max-height:799px)]:hidden">
      <Card className="h-[220px] rounded-[20px] border-blue-100 bg-white/90 p-5 shadow-[0_20px_58px_rgba(15,43,93,0.13)] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-extrabold text-brand-navy">Phân tích cấu hình BESS</h2>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-brand-green">
            <CheckCircle2 aria-hidden="true" size={15} />
            Phương án phù hợp
          </span>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_132px] items-center gap-5">
          <div className="min-w-0 rounded-2xl bg-gradient-to-b from-blue-50/70 to-white px-3 py-4">
            <svg aria-hidden="true" className="h-[106px] w-full" viewBox="0 0 420 120" preserveAspectRatio="none">
              <line stroke="#D9E5F5" strokeDasharray="6 7" strokeWidth="2" x1="0" x2="420" y1="96" y2="96" />
              <line stroke="#D9E5F5" strokeDasharray="6 7" strokeWidth="2" x1="0" x2="420" y1="52" y2="52" />
              <path d="M0 88 C45 86 54 40 96 48 C135 56 142 92 184 78 C224 64 232 28 274 34 C318 40 324 92 366 84 C390 80 404 62 420 58" fill="none" stroke="#075BEA" strokeLinecap="round" strokeWidth="5" />
              <path d="M0 104 C45 100 58 76 94 78 C132 80 146 102 184 94 C224 86 238 62 274 66 C316 70 330 104 366 98 C392 94 404 80 420 76" fill="none" stroke="#0CA34B" strokeLinecap="round" strokeWidth="4" opacity="0.7" />
            </svg>
          </div>

          <div className="grid gap-3 border-l border-slate-100 pl-5">
            <PreviewKpi label="Công suất" value="2.2 MW" icon={BatteryCharging} />
            <PreviewKpi label="Dung lượng" value="4.5 MWh" icon={Zap} />
            <PreviewKpi label="Thời lượng" value="2.0 giờ" icon={Gauge} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function PreviewKpi({ icon: Icon, label, value }: { icon: typeof BatteryCharging; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[30px_1fr] items-center gap-2">
      <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-brand-blue">
        <Icon aria-hidden="true" size={16} />
      </span>
      <span>
        <small className="block text-[11px] font-bold text-brand-muted">{label}</small>
        <strong className="text-sm text-brand-navy">{value}</strong>
      </span>
    </div>
  );
}

function AuthFormCard({
  error,
  form,
  mode,
  submitting,
  onFieldChange,
  onModeChange,
  onSubmit
}: PortalAuthPageProps) {
  const isLogin = mode === "login";

  return (
    <Card className="mx-auto w-full max-w-[430px] rounded-[22px] border-blue-100 bg-white p-7 shadow-[0_24px_70px_rgba(15,43,93,0.16)] max-sm:p-5">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
          <Sparkles aria-hidden="true" size={14} />
          Customer Portal
        </span>
        <h2 className="mt-4 text-[26px] font-extrabold leading-tight text-brand-navy">
          {isLogin ? "Chào mừng quay lại" : "Tạo workspace của bạn"}
        </h2>
        <p className="mt-1.5 text-sm font-medium leading-6 text-brand-muted">
          {isLogin
            ? "Đăng nhập để tiếp tục với workspace EnergyInsight của bạn."
            : "Bắt đầu quản lý dự án và dữ liệu phân tích trên EnergyInsight."}
        </p>
      </div>

      <AuthModeSwitch mode={mode} onModeChange={onModeChange} />

      <form className="mt-5 grid gap-4" noValidate={false} onSubmit={onSubmit}>
        {mode === "register" ? (
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <AuthField
              autoComplete="name"
              icon={User}
              label="Họ và tên"
              onChange={(value) => onFieldChange("fullName", value)}
              required
              value={form.fullName}
            />
            <AuthField
              autoComplete="tel"
              icon={Phone}
              label="Số điện thoại"
              onChange={(value) => onFieldChange("phone", value)}
              value={form.phone}
            />
          </div>
        ) : null}

        <AuthField
          autoComplete="email"
          icon={Mail}
          label="Email"
          onChange={(value) => onFieldChange("email", value)}
          placeholder="name@company.com"
          required
          type="email"
          value={form.email}
        />

        {mode === "register" ? (
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <AuthField
              autoComplete="organization"
              icon={Building2}
              label="Công ty"
              onChange={(value) => onFieldChange("companyName", value)}
              value={form.companyName}
            />
            <AuthField
              icon={BriefcaseBusiness}
              label="Ngành"
              onChange={(value) => onFieldChange("industry", value)}
              value={form.industry}
            />
          </div>
        ) : null}

        {mode === "register" ? (
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <AuthField
              autoComplete="new-password"
              icon={Lock}
              label="Mật khẩu"
              minLength={8}
              onChange={(value) => onFieldChange("password", value)}
              required
              type="password"
              value={form.password}
            />
            <AuthField
              autoComplete="new-password"
              icon={Lock}
              label="Xác nhận mật khẩu"
              minLength={8}
              onChange={(value) => onFieldChange("confirmPassword", value)}
              required
              type="password"
              value={form.confirmPassword}
            />
          </div>
        ) : (
          <AuthField
            autoComplete="current-password"
            icon={Lock}
            label="Mật khẩu"
            onChange={(value) => onFieldChange("password", value)}
            required
            type="password"
            value={form.password}
          />
        )}

        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700" id="portal-auth-error" role="alert">
            {error}
          </div>
        ) : null}

        <Button
          aria-busy={submitting}
          className="mt-1 h-12 w-full rounded-xl bg-brand-blue text-white shadow-[0_12px_28px_rgba(7,91,234,0.25)] transition hover:-translate-y-0.5 hover:bg-brand-blue/90 active:translate-y-0 disabled:translate-y-0"
          disabled={submitting}
          type="submit"
        >
          {submitting ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : isLogin ? <ArrowRight aria-hidden="true" size={18} /> : <User aria-hidden="true" size={18} />}
          {isLogin ? "Đăng nhập vào workspace" : "Tạo tài khoản"}
          {submitting ? <span className="sr-only">Đang gửi yêu cầu</span> : null}
        </Button>
      </form>

      <div className="mt-4 border-t border-slate-100 pt-4 text-xs font-medium leading-5 text-brand-muted">
        <p className="inline-flex items-center gap-2 font-semibold text-brand-navy">
          <ShieldCheck aria-hidden="true" size={14} />
          Workspace được bảo vệ bằng xác thực phiên và phân quyền truy cập.
        </p>
      </div>
    </Card>
  );
}

function AuthModeSwitch({ mode, onModeChange }: { mode: PortalAuthMode; onModeChange: (mode: PortalAuthMode) => void }) {
  return (
    <div aria-label="Chọn chế độ xác thực" className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1" role="tablist">
      {(["login", "register"] as const).map((item) => {
        const active = mode === item;
        return (
          <button
            aria-selected={active}
            className={cn(
              "h-10 rounded-xl text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/25",
              active ? "bg-white text-brand-blue shadow-sm" : "text-brand-muted hover:text-brand-navy"
            )}
            key={item}
            onClick={() => onModeChange(item)}
            role="tab"
            type="button"
          >
            {item === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        );
      })}
    </div>
  );
}

function AuthField({
  icon: Icon,
  label,
  onChange,
  value,
  type = "text",
  ...inputProps
}: {
  icon: typeof Mail;
  label: string;
  onChange: (value: string) => void;
  value: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  const reactId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputId = inputProps.id ?? `portal-auth-${reactId}`;
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="grid min-w-0 gap-1.5">
      <label className="text-[13px] font-bold text-brand-navy" htmlFor={inputId}>{label}</label>
      <div className="group relative min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 transition focus-within:border-brand-blue focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-blue/15">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-blue" size={18} />
        <Input
          className={cn(
            "h-[46px] min-w-0 rounded-xl border-0 bg-transparent pl-11 text-sm font-semibold text-brand-navy shadow-none outline-none placeholder:text-brand-muted/70 focus-visible:ring-0 focus-visible:ring-offset-0",
            isPassword ? "pr-12" : "pr-4"
          )}
          id={inputId}
          onChange={(event) => onChange(event.target.value)}
          type={inputType}
          value={value}
          {...inputProps}
        />
        {isPassword ? (
          <button
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
            className="absolute right-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-brand-muted transition hover:bg-blue-50 hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/25"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
