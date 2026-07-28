"use client";

import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Database,
  FileText,
  FolderOpen,
  Grid2X2,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Users,
  Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { authApi } from "@/features/auth/api/auth.api";
import { PortalAuthGate } from "@/features/auth/components/portal-auth-gate";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { BackendResourcesContent } from "@/features/bess-planner/components/backend-resources-page";
import { ReportCenterPage } from "@/features/reports/components";
import { cn } from "@/lib/utils";
import { OrganizationSection } from "./organization-section";
import { PortalOverviewDashboard } from "./portal-overview-dashboard";

const sidebarGroups = [
  {
    title: "Tổng quan",
    items: [{ label: "Tổng quan", icon: Home }]
  },
  {
    title: "Ứng dụng",
    items: [
      { label: "Ứng dụng", icon: LayoutGrid },
      { label: "Dự án của tôi", icon: FolderOpen },
      { label: "Tài nguyên dự án", icon: Database },
      { label: "Báo cáo", icon: BarChart3 }
    ]
  },
  {
    title: "Quản trị",
    items: [
      { label: "Tổ chức", icon: Building2 },
      { label: "Thành viên", icon: Users },
      { label: "Cài đặt", icon: Settings }
    ]
  }
];

const appCards = [
  {
    title: "Quick Sizing",
    description: "Ước tính nhanh công suất điện mặt trời & BESS.",
    action: "Mở ứng dụng",
    href: "/quick-sizing",
    icon: Zap,
    tone: "blue" as const
  },
  {
    title: "BESS Planner",
    description: "Phân tích chi tiết và lập kế hoạch BESS tối ưu cho doanh nghiệp.",
    action: "Mở ứng dụng",
    href: "/customer-portal/du-an-cua-toi",
    icon: FileText,
    tone: "green" as const
  },
  {
    title: "DataInsight Apps",
    description: "Các ứng dụng phân tích dữ liệu nâng cao sẽ sớm được ra mắt.",
    action: "Xem lộ trình",
    href: "/customer-portal",
    icon: Grid2X2,
    tone: "purple" as const,
    badge: "Sắp ra mắt"
  }
];

const toneClasses = {
  blue: "bg-blue-50 text-brand-blue",
  green: "bg-green-50 text-brand-green",
  purple: "bg-violet-50 text-violet-700"
};

export function CustomerPortalPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "overview";

  return section === "overview" ? <PortalOverviewDashboard /> : <PortalSection section={section} />;
}

function PortalSection({ section }: { section: string }) {
  const [saved, setSaved] = useState(false);
  const [localData, setLocalData] = useState({ hasQuickSizing: false, hasProjectDraft: false, hasProjectResult: false });

  useEffect(() => {
    setLocalData({
      hasQuickSizing: Boolean(window.localStorage.getItem("energyinsight.quickSizing.flow.v1")),
      hasProjectDraft: Boolean(window.localStorage.getItem("energyinsight.bessPlanner.projectDraft.v1")),
      hasProjectResult: Boolean(window.localStorage.getItem("energyinsight.bessPlanner.lastProject.v1"))
    });
  }, [section]);

  if (section === "apps") {
    return (
      <PortalContent title="Ứng dụng" description="Truy cập các công cụ phân tích năng lượng khả dụng trong workspace.">
        <ApplicationsCard />
      </PortalContent>
    );
  }

  if (section === "data") return <BackendResourcesContent />;

  if (section === "local-data") {
    const sources = [
      { label: "Bản nháp Quick Sizing", available: localData.hasQuickSizing, detail: "Thông tin doanh nghiệp và bộ giả định đã lưu trên trình duyệt.", href: "/quick-sizing" },
      { label: "Bản nháp BESS Planner", available: localData.hasProjectDraft, detail: "Thông tin dự án, thông tin tệp và các thiết lập đã nhập.", href: "/customer-portal/du-an-cua-toi/tao-du-an" },
      { label: "Kết quả gần nhất", available: localData.hasProjectResult, detail: "Dữ liệu đầu vào của lần phân tích gần nhất.", href: "/customer-portal/du-an-cua-toi/ket-qua" }
    ];
    return (
      <PortalContent title="Dữ liệu của tôi" description="Theo dõi dữ liệu hiện đang được lưu cục bộ trong trình duyệt.">
        <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
          {sources.map((source) => (
            <Card className="rounded-xl bg-white p-5 shadow-panel" key={source.label}>
              <span className={cn("grid size-11 place-items-center rounded-xl", source.available ? "bg-green-50 text-brand-green" : "bg-slate-100 text-brand-muted")}><Database size={23} /></span>
              <h2 className="mt-4 text-lg font-bold text-brand-navy">{source.label}</h2>
              <p className="mt-2 min-h-[48px] text-sm font-medium leading-6 text-brand-muted">{source.detail}</p>
              <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold", source.available ? "bg-green-50 text-brand-green" : "bg-slate-100 text-brand-muted")}>{source.available ? "Có dữ liệu" : "Chưa có dữ liệu"}</span>
              <Link className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-line text-sm font-bold text-brand-blue" href={source.href}>{source.available ? "Mở dữ liệu" : "Tạo dữ liệu"}<ArrowRight size={16} /></Link>
            </Card>
          ))}
        </div>
      </PortalContent>
    );
  }

  if (section === "reports") return <ReportCenterPage />;

  if (section === "organization") {
    return (
      <PortalContent title="Tổ chức" description="Quản lý thông tin tổ chức dùng chung cho các ứng dụng và dự án DataInsight.">
        <OrganizationSection />
      </PortalContent>
    );
  }

  if (section === "members") {
    const members = [
      ["Nguyễn Tuấn", "nguyen.tuan@solaris.vn", "Quản trị viên", "Đang hoạt động"],
      ["Trần Minh Anh", "minh.anh@solaris.vn", "Kỹ sư", "Đang hoạt động"],
      ["Lê Hoàng Nam", "hoang.nam@solaris.vn", "Người xem", "Đã mời"]
    ];
    return (
      <PortalContent title="Thành viên" description="Danh sách thành viên minh họa của workspace.">
        <div className="mb-4 flex justify-end"><button className="h-10 rounded-lg bg-brand-blue px-5 text-sm font-bold text-white" onClick={() => setSaved(true)} type="button">Mời thành viên</button></div>
        {saved ? <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-brand-green">Đã ghi nhận thay đổi trên thiết bị này.</div> : null}
        <Card className="overflow-x-auto rounded-xl bg-white shadow-panel">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-brand-muted"><tr><th className="px-4 py-3">Họ tên</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
            <tbody>{members.map(([name, email, role, status]) => <tr className="border-t border-brand-line" key={email}><td className="px-4 py-3 font-bold text-brand-navy">{name}</td><td className="px-4 py-3 font-medium text-brand-muted">{email}</td><td className="px-4 py-3 font-semibold text-brand-navy">{role}</td><td className="px-4 py-3"><span className={cn("rounded-full px-3 py-1 text-xs font-bold", status === "Đang hoạt động" ? "bg-green-50 text-brand-green" : "bg-amber-50 text-amber-700")}>{status}</span></td></tr>)}</tbody>
          </table>
        </Card>
      </PortalContent>
    );
  }

  return (
    <PortalContent title="Cài đặt" description="Thiết lập hiển thị và tùy chọn thông báo cho Portal.">
      <div className="grid max-w-4xl gap-4">
        <Card className="rounded-xl bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold text-brand-navy">Tùy chọn chung</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1"><PortalField label="Ngôn ngữ" defaultValue="Tiếng Việt" /><PortalField label="Định dạng ngày" defaultValue="DD/MM/YYYY" /></div>
        </Card>
        <Card className="rounded-xl bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold text-brand-navy">Thông báo</h2>
          <div className="mt-4 grid gap-3"><DemoToggle label="Khi phân tích hoàn thành" /><DemoToggle label="Khi có báo cáo mới" /><DemoToggle label="Thông tin sản phẩm và tư vấn" defaultChecked={false} /></div>
        </Card>
        <DemoSaveButton saved={saved} onSave={() => setSaved(true)} />
      </div>
    </PortalContent>
  );
}

function PortalContent({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return <div className="py-7"><h1 className="text-[34px] font-bold text-brand-navy">{title}</h1><p className="mt-2 text-sm font-medium text-brand-muted">{description}</p><div className="mt-5">{children}</div></div>;
}

function ApplicationsCard() {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <h2 className="text-xl font-bold text-brand-navy">Ứng dụng khả dụng</h2>
      <div className="mt-4 grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        {appCards.map(({ action, badge, description, href, icon: Icon, title, tone }) => (
          <div className={cn("rounded-xl border p-4", tone === "green" ? "border-green-100 bg-green-50/30" : tone === "purple" ? "border-violet-100 bg-violet-50/35" : "border-blue-100 bg-blue-50/30")} key={title}>
            <div className="grid grid-cols-[44px_1fr] gap-3">
              <span className={cn("grid size-11 place-items-center rounded-xl", toneClasses[tone])}><Icon size={24} /></span>
              <div><div className="flex items-center gap-2"><h3 className={cn("text-base font-bold", tone === "green" ? "text-brand-green" : tone === "purple" ? "text-violet-700" : "text-brand-blue")}>{title}</h3>{badge ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">{badge}</span> : null}</div><p className="mt-2 min-h-[42px] text-sm font-medium leading-6 text-brand-muted">{description}</p></div>
            </div>
            <Link className={cn("mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-bold", tone === "green" ? "border-green-100 bg-white/70 text-brand-green" : tone === "purple" ? "border-violet-100 bg-violet-100/40 text-violet-700" : "border-blue-100 bg-white/80 text-brand-blue")} href={href}>{action}<ArrowRight size={17} /></Link>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PortalField({ label, defaultValue, wide = false }: { label: string; defaultValue: string; wide?: boolean }) {
  return <label className={cn("grid gap-2 text-sm font-bold text-brand-navy", wide && "col-span-2 max-md:col-span-1")}>{label}<input className="h-11 rounded-lg border border-brand-line px-4 text-sm font-medium outline-none focus:border-brand-blue" defaultValue={defaultValue} /></label>;
}

function DemoToggle({ label, defaultChecked = true }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return <button className="flex items-center justify-between gap-4 rounded-lg border border-brand-line px-4 py-3 text-left text-sm font-semibold text-brand-navy" onClick={() => setChecked((value) => !value)} type="button"><span>{label}</span><span className={cn("h-6 w-11 rounded-full p-1", checked ? "bg-brand-blue" : "bg-slate-300")}><span className={cn("block size-4 rounded-full bg-white transition", checked && "translate-x-5")} /></span></button>;
}

function DemoSaveButton({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return <div className="mt-5 flex items-center justify-end gap-3">{saved ? <span className="text-sm font-bold text-brand-green">Đã lưu trên thiết bị này</span> : null}<button className="h-10 rounded-lg bg-brand-blue px-5 text-sm font-bold text-white" onClick={onSave} type="button">Lưu thay đổi</button></div>;
}

function resolvePortalActiveItem(pathname: string, section: string | null) {
  if (pathname.startsWith("/customer-portal/du-an-cua-toi")) return "Dự án của tôi";
  const activeItemBySection: Record<string, string> = {
    overview: "Tổng quan",
    apps: "Ứng dụng",
    data: "Tài nguyên dự án",
    reports: "Báo cáo",
    organization: "Tổ chức",
    members: "Thành viên",
    settings: "Cài đặt"
  };
  return activeItemBySection[section ?? "overview"] ?? "Tổng quan";
}

export function PortalAuthenticatedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeItem = resolvePortalActiveItem(pathname, searchParams.get("section"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <PortalAuthGate>
      <main className="min-h-screen bg-white text-brand-navy">
        <div className="grid min-h-screen grid-cols-[264px_1fr] max-lg:grid-cols-1">
          <PortalSidebar activeItem={activeItem} />
          {mobileMenuOpen ? (
            <div className="fixed inset-0 z-50 hidden max-lg:block">
              <button aria-label="Đóng menu" className="absolute inset-0 bg-slate-950/35" onClick={() => setMobileMenuOpen(false)} type="button" />
              <div className="relative h-full w-[min(86vw,300px)] bg-white shadow-2xl"><PortalSidebar activeItem={activeItem} mobile onNavigate={() => setMobileMenuOpen(false)} /></div>
            </div>
          ) : null}
          <section className="flex min-h-screen min-w-0 flex-col bg-white">
            <PortalTopbar onOpenMenu={() => setMobileMenuOpen(true)} />
            <div className="w-full flex-1 px-8 max-sm:px-4">{children}</div>
            <PortalFooter />
          </section>
        </div>
      </main>
    </PortalAuthGate>
  );
}

function PortalSidebar({ activeItem, mobile = false, onNavigate }: { activeItem: string; mobile?: boolean; onNavigate?: () => void }) {
  return (
    <aside className={cn("sticky top-0 h-screen border-r border-brand-line bg-white", !mobile && "max-lg:hidden", mobile && "h-full")}>
      <div className="flex h-full flex-col px-3 py-5">
        <div className="flex items-center justify-between px-3"><EnergyInsightWordmark /><button className="grid size-9 place-items-center rounded-full border border-brand-line bg-white text-brand-navy shadow-panel" type="button"><ChevronLeft size={18} /></button></div>
        <nav className="mt-9 grid gap-6">
          {sidebarGroups.map((group) => (
            <div key={group.title}>
              <h2 className="px-3 text-xs font-bold uppercase text-brand-muted">{group.title}</h2>
              <div className="mt-3 grid gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const href = item.icon === Home ? "/customer-portal" : item.icon === LayoutGrid ? "/customer-portal?section=apps" : item.icon === FolderOpen ? "/customer-portal/du-an-cua-toi" : item.icon === Database ? "/customer-portal?section=data" : item.icon === BarChart3 ? "/customer-portal?section=reports" : item.icon === Building2 ? "/customer-portal?section=organization" : item.icon === Users ? "/customer-portal?section=members" : "/customer-portal?section=settings";
                  const active = item.label === activeItem;
                  return <Link className={cn("relative flex h-11 items-center gap-3 rounded-lg px-4 text-[15px] font-semibold text-brand-muted transition hover:bg-blue-50 hover:text-brand-blue", active && "bg-blue-50 text-brand-blue shadow-panel before:absolute before:left-0 before:top-2 before:h-7 before:w-1 before:rounded-r-full before:bg-brand-blue")} href={href} key={item.label} onClick={onNavigate}><Icon size={20} />{item.label}</Link>;
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto"><button className="flex h-12 w-full items-center gap-3 rounded-lg border border-brand-line bg-white px-5 text-[15px] font-semibold text-brand-muted shadow-panel" type="button"><ChevronLeft size={19} />Thu gọn</button><p className="mt-7 px-5 text-xs font-medium text-brand-muted">Phiên bản 2.0.0</p></div>
      </div>
    </aside>
  );
}

function PortalTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const displayName = user?.representative_name ?? user?.email ?? "Người dùng Portal";
  const companyName = user?.company_name ?? "BESS Planner";
  const initials = getUserInitials(displayName);

  const logout = async () => {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Always clear the browser session when the backend session has expired.
    }
    clearSession();
  };

  return (
    <header className="border-b border-brand-line bg-white">
      <div className="flex min-h-[74px] w-full items-center justify-between gap-5 px-8 max-sm:px-4">
        <button aria-label="Mở menu" className="hidden size-10 place-items-center rounded-lg border border-brand-line max-lg:grid" onClick={onOpenMenu} type="button"><Menu size={20} /></button>
        <button className="flex h-12 min-w-[292px] items-center justify-between rounded-xl border border-brand-line bg-white px-4 shadow-panel" type="button"><span className="flex items-center gap-3 text-left"><span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand-blue"><BarChart3 size={19} /></span><span><small className="block text-xs font-medium text-brand-muted">Workspace hiện tại</small><strong className="text-sm font-bold text-brand-navy">{companyName}</strong></span></span><ChevronDown size={18} className="text-brand-muted" /></button>
        <div className="flex flex-1 items-center justify-end gap-5">
          <button className="relative text-brand-navy" type="button" aria-label="Thông báo"><Bell size={22} /><span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-red-500 text-xs font-bold text-white">6</span></button>
          <button className="text-brand-muted" type="button" aria-label="Trợ giúp"><CircleHelp size={23} /></button>
          <button className="flex items-center gap-3" type="button"><span className="grid size-11 place-items-center rounded-full bg-brand-blue text-sm font-bold text-white">{initials}</span><span className="text-left leading-tight"><strong className="block text-sm font-bold text-brand-navy">{displayName}</strong><small className="font-medium text-brand-muted">{companyName}</small></span><ChevronDown size={18} className="text-brand-muted" /></button>
          <button className="grid size-10 place-items-center rounded-lg border border-brand-line text-brand-muted hover:bg-blue-50 hover:text-brand-blue" onClick={() => void logout()} type="button" aria-label="Đăng xuất"><LogOut size={18} /></button>
        </div>
      </div>
    </header>
  );
}

function getUserInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function EnergyInsightWordmark() {
  return <span className="relative inline-flex items-center gap-2 whitespace-nowrap text-2xl font-bold text-brand-green"><span aria-hidden="true" className="relative inline-flex size-7 shrink-0 rotate-[30deg] rounded-lg border-[5px] border-brand-blue bg-sky-50 shadow-[inset_0_0_0_4px_rgba(12,163,75,0.95)] after:absolute after:inset-[6px] after:rounded after:bg-gradient-to-br after:from-brand-green after:to-brand-blue after:content-['']" /><span>Energy<span className="text-brand-blue">Insight</span></span><small className="absolute left-11 top-7 text-xs font-bold text-brand-navy/80">by DataInsight</small></span>;
}

function PortalFooter() {
  return <footer className="border-t border-brand-line bg-white"><div className="flex min-h-[52px] w-full items-center justify-between px-8 text-xs font-medium text-brand-muted max-sm:px-4"><span>© 2026 DataInsight. All rights reserved.</span><span className="flex gap-12"><Link href="/lien-he">Chính sách bảo mật</Link><Link href="/lien-he">Điều khoản sử dụng</Link></span></div></footer>;
}
