"use client";

import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  Database,
  FileBarChart,
  FileText,
  Folder,
  FolderOpen,
  Grid2X2,
  Headphones,
  Home,
  LayoutGrid,
  Menu,
  MoreVertical,
  Settings,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const sidebarGroups = [
  {
    title: "Tổng quan",
    items: [{ label: "Tổng quan", icon: Home, active: true }]
  },
  {
    title: "Ứng dụng",
    items: [
      { label: "Ứng dụng", icon: LayoutGrid },
      { label: "Dự án của tôi", icon: FolderOpen },
      { label: "Dữ liệu của tôi", icon: Database },
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
    icon: Zap,
    tone: "blue"
  },
  {
    title: "BESS Planner",
    description: "Phân tích chi tiết và lập kế hoạch BESS tối ưu cho doanh nghiệp.",
    action: "Mở ứng dụng",
    icon: FileText,
    tone: "green"
  },
  {
    title: "DataInsight Apps",
    description: "Các ứng dụng phân tích dữ liệu nâng cao sẽ sớm được ra mắt.",
    action: "Xem lộ trình",
    icon: Grid2X2,
    tone: "purple",
    badge: "Sắp ra mắt"
  }
];

const stats = [
  { label: "Tổng dự án", value: "24", change: "14%", icon: Folder, tone: "blue" },
  { label: "Kịch bản đã lưu", value: "68", change: "21%", icon: FileText, tone: "green" },
  { label: "Tệp dữ liệu đã tải lên", value: "132", change: "18%", icon: CloudUpload, tone: "purple" },
  { label: "Báo cáo đã xuất", value: "56", change: "25%", icon: BarChart3, tone: "orange" }
];

const projects = [
  ["Nhà máy May Bình An - GĐ2", "Bình An Textile Co., Ltd.", "BESS Planner", "Đang phân tích", "14/05/2024 09:30"],
  ["Kho lạnh Lâm Đồng", "Green Cold Storage", "Quick Sizing", "Hoàn thành", "13/05/2024 16:45"],
  ["Nhà máy thực phẩm Hưng Phát", "Hưng Phát Foods", "BESS Planner", "Đang phân tích", "13/05/2024 10:12"],
  ["Tòa nhà văn phòng DSS", "DSS Office Building", "Quick Sizing", "Hoàn thành", "12/05/2024 14:22"],
  ["Trang trại điện mặt trời 5MW", "Solaris Energy Vietnam", "BESS Planner", "Đã lưu", "11/05/2024 08:55"]
];

const activities = [
  { title: "Bạn đã xuất báo cáo", detail: "Báo cáo tối ưu BESS - Nhà máy May Bình An", time: "09:30 SA", icon: FileText, tone: "green" },
  { title: "Bạn đã tải lên tệp dữ liệu", detail: "load_profile_may_2024.csv (2.4 MB)", time: "08:45 SA", icon: CloudUpload, tone: "blue" },
  { title: "Kịch bản đã hoàn thành", detail: "BESS Planner - Kho lạnh Lâm Đồng", time: "Hôm qua, 04:15 CH", icon: Zap, tone: "green" },
  { title: "Bạn đã tạo dự án mới", detail: "Nhà máy thực phẩm Hưng Phát", time: "Hôm qua, 10:02 SA", icon: Grid2X2, tone: "purple" },
  { title: "Báo cáo đã xuất", detail: "Quick Sizing - Tòa nhà văn phòng DSS", time: "11/05/2024", icon: BarChart3, tone: "orange" }
];

const toneClasses = {
  blue: "bg-blue-50 text-brand-blue",
  green: "bg-green-50 text-brand-green",
  orange: "bg-orange-50 text-orange-500",
  purple: "bg-violet-50 text-violet-700"
};

export function CustomerPortalPage() {
  const [section, setSection] = useState("overview");

  useEffect(() => {
    setSection(new URLSearchParams(window.location.search).get("section") ?? "overview");
  }, []);

  const activeItemBySection: Record<string, string> = {
    overview: "Tổng quan",
    apps: "Ứng dụng",
    data: "Dữ liệu của tôi",
    reports: "Báo cáo",
    organization: "Tổ chức",
    members: "Thành viên",
    settings: "Cài đặt"
  };

  return (
    <PortalAuthenticatedLayout activeItem={activeItemBySection[section] ?? "Tổng quan"}>
      {section === "overview" ? (
        <div className="py-7">
          <div>
            <h1 className="text-[34px] font-bold leading-tight text-brand-navy">Tổng quan Portal</h1>
            <p className="mt-2 text-[15px] font-medium text-brand-muted">Nền tảng phân tích & lập kế hoạch năng lượng toàn diện cho doanh nghiệp.</p>
          </div>

          <div className="mt-6 grid grid-cols-[minmax(0,1.92fr)_minmax(360px,0.88fr)] gap-5 max-xl:grid-cols-1">
            <div className="grid min-w-0 gap-5">
              <ApplicationsCard />
              <StatsGrid />
              <ProjectsTable />
            </div>
            <div className="grid content-start gap-5">
              <RecentActivity />
              <SupportCard />
              <PlanCard />
            </div>
          </div>
        </div>
      ) : <PortalSection section={section} />}
    </PortalAuthenticatedLayout>
  );
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
      <div className="py-7">
        <h1 className="text-[34px] font-bold text-brand-navy">Ứng dụng</h1>
        <p className="mt-2 text-sm font-medium text-brand-muted">Truy cập các công cụ phân tích năng lượng khả dụng trong workspace.</p>
        <div className="mt-5"><ApplicationsCard /></div>
      </div>
    );
  }

  if (section === "data") {
    const sources = [
      { label: "Bản nháp Quick Sizing", available: localData.hasQuickSizing, detail: "Thông tin doanh nghiệp và bộ giả định đã lưu trên trình duyệt.", href: "/quick-sizing" },
      { label: "Bản nháp BESS Planner", available: localData.hasProjectDraft, detail: "Thông tin dự án, metadata file và cấu hình wizard.", href: "/customer-portal/du-an-cua-toi/tao-du-an" },
      { label: "Snapshot kết quả gần nhất", available: localData.hasProjectResult, detail: "Dữ liệu đầu vào của lần chạy phân tích demo gần nhất.", href: "/customer-portal/du-an-cua-toi/ket-qua" }
    ];
    return (
      <div className="py-7">
        <h1 className="text-[34px] font-bold text-brand-navy">Dữ liệu của tôi</h1>
        <p className="mt-2 text-sm font-medium text-brand-muted">Theo dõi dữ liệu hiện đang được lưu cục bộ trong phiên bản frontend.</p>
        <div className="mt-5 grid grid-cols-3 gap-4 max-xl:grid-cols-1">
          {sources.map((source) => (
            <Card className="rounded-xl bg-white p-5 shadow-panel" key={source.label}>
              <span className={cn("grid size-11 place-items-center rounded-xl", source.available ? "bg-green-50 text-brand-green" : "bg-slate-100 text-brand-muted")}>
                <Database size={23} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-brand-navy">{source.label}</h2>
              <p className="mt-2 min-h-[48px] text-sm font-medium leading-6 text-brand-muted">{source.detail}</p>
              <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold", source.available ? "bg-green-50 text-brand-green" : "bg-slate-100 text-brand-muted")}>{source.available ? "Có dữ liệu" : "Chưa có dữ liệu"}</span>
              <a className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-line text-sm font-bold text-brand-blue" href={source.href}>{source.available ? "Mở dữ liệu" : "Tạo dữ liệu"}<ArrowRight size={16} /></a>
            </Card>
          ))}
        </div>
        <Card className="mt-5 rounded-xl border-blue-100 bg-blue-50 p-4 shadow-none">
          <p className="text-sm font-medium leading-6 text-brand-muted">File gốc chưa được lưu trong trình duyệt. Wizard chỉ lưu tên file, kích thước, kết quả kiểm tra và phần preview CSV để phục vụ luồng frontend demo.</p>
        </Card>
      </div>
    );
  }

  if (section === "reports") {
    const reports = [
      { title: "Quick Sizing Summary", detail: "KPI sizing, CAPEX, payback, NPV và dòng tiền sơ bộ.", href: "/quick-sizing/ket-qua", icon: Zap },
      { title: "BESS Planner Analysis", detail: "Khuyến nghị, so sánh chế độ, sizing theo tháng và dữ liệu đầu vào.", href: "/customer-portal/du-an-cua-toi/ket-qua", icon: FileBarChart },
      { title: "Thư viện báo cáo mẫu", detail: "Xem cấu trúc và nội dung mẫu trước khi triển khai xuất PDF thực tế.", href: "/bao-cao-mau", icon: FileText }
    ];
    return (
      <div className="py-7">
        <h1 className="text-[34px] font-bold text-brand-navy">Báo cáo</h1>
        <p className="mt-2 text-sm font-medium text-brand-muted">Truy cập kết quả hiện có và thư viện báo cáo mẫu.</p>
        <div className="mt-5 grid grid-cols-3 gap-4 max-xl:grid-cols-1">
          {reports.map(({ title, detail, href, icon: Icon }) => (
            <Card className="rounded-xl bg-white p-5 shadow-panel" key={title}>
              <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-brand-blue"><Icon size={23} /></span>
              <h2 className="mt-4 text-lg font-bold text-brand-navy">{title}</h2>
              <p className="mt-2 min-h-[48px] text-sm font-medium leading-6 text-brand-muted">{detail}</p>
              <a className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-blue text-sm font-bold text-white" href={href}>Mở báo cáo<ArrowRight size={16} /></a>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (section === "organization") {
    return (
      <div className="py-7">
        <h1 className="text-[34px] font-bold text-brand-navy">Tổ chức</h1>
        <p className="mt-2 text-sm font-medium text-brand-muted">Thông tin workspace dùng để hiển thị trong Portal.</p>
        <Card className="mt-5 max-w-4xl rounded-xl bg-white p-5 shadow-panel">
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <PortalField label="Tên tổ chức" defaultValue="Solaris Energy Vietnam" />
            <PortalField label="Mã workspace" defaultValue="SEV-ENERGY-01" />
            <PortalField label="Ngành hoạt động" defaultValue="Năng lượng" />
            <PortalField label="Múi giờ" defaultValue="UTC+07:00 Bangkok, Hanoi, Jakarta" />
            <PortalField label="Địa chỉ" defaultValue="Hà Nội, Việt Nam" wide />
          </div>
          <DemoSaveButton saved={saved} onSave={() => setSaved(true)} />
        </Card>
      </div>
    );
  }

  if (section === "members") {
    const members = [
      ["Nguyễn Tuấn", "nguyen.tuan@solaris.vn", "Quản trị viên", "Đang hoạt động"],
      ["Trần Minh Anh", "minh.anh@solaris.vn", "Kỹ sư", "Đang hoạt động"],
      ["Lê Hoàng Nam", "hoang.nam@solaris.vn", "Người xem", "Đã mời"]
    ];
    return (
      <div className="py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-[34px] font-bold text-brand-navy">Thành viên</h1><p className="mt-2 text-sm font-medium text-brand-muted">Danh sách thành viên minh họa của workspace.</p></div>
          <button className="h-10 rounded-lg bg-brand-blue px-5 text-sm font-bold text-white" onClick={() => setSaved(true)} type="button">Mời thành viên</button>
        </div>
        {saved ? <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-brand-green">Đã ghi nhận thao tác trên giao diện demo.</div> : null}
        <Card className="mt-5 overflow-x-auto rounded-xl bg-white shadow-panel">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-brand-muted"><tr><th className="px-4 py-3">Họ tên</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
            <tbody>{members.map(([name, email, role, status]) => <tr className="border-t border-brand-line" key={email}><td className="px-4 py-3 font-bold text-brand-navy">{name}</td><td className="px-4 py-3 font-medium text-brand-muted">{email}</td><td className="px-4 py-3 font-semibold text-brand-navy">{role}</td><td className="px-4 py-3"><span className={cn("rounded-full px-3 py-1 text-xs font-bold", status === "Đang hoạt động" ? "bg-green-50 text-brand-green" : "bg-amber-50 text-amber-700")}>{status}</span></td></tr>)}</tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-7">
      <h1 className="text-[34px] font-bold text-brand-navy">Cài đặt</h1>
      <p className="mt-2 text-sm font-medium text-brand-muted">Thiết lập hiển thị và tùy chọn thông báo cho Portal frontend.</p>
      <div className="mt-5 grid max-w-4xl gap-4">
        <Card className="rounded-xl bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold text-brand-navy">Tùy chọn chung</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <PortalField label="Ngôn ngữ" defaultValue="Tiếng Việt" />
            <PortalField label="Định dạng ngày" defaultValue="DD/MM/YYYY" />
          </div>
        </Card>
        <Card className="rounded-xl bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold text-brand-navy">Thông báo</h2>
          <div className="mt-4 grid gap-3"><DemoToggle label="Khi phân tích hoàn thành" /><DemoToggle label="Khi có báo cáo mới" /><DemoToggle label="Thông tin sản phẩm và tư vấn" defaultChecked={false} /></div>
        </Card>
        <DemoSaveButton saved={saved} onSave={() => setSaved(true)} />
      </div>
    </div>
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
  return <div className="mt-5 flex items-center justify-end gap-3">{saved ? <span className="text-sm font-bold text-brand-green">Đã lưu trên giao diện demo</span> : null}<button className="h-10 rounded-lg bg-brand-blue px-5 text-sm font-bold text-white" onClick={onSave} type="button">Lưu thay đổi</button></div>;
}

export function PortalAuthenticatedLayout({ activeItem = "Tổng quan", children }: { activeItem?: string; children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-brand-navy">
      <div className="grid min-h-screen grid-cols-[264px_1fr] max-lg:grid-cols-1">
        <PortalSidebar activeItem={activeItem} />
        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 hidden max-lg:block">
            <button aria-label="Đóng menu" className="absolute inset-0 bg-slate-950/35" onClick={() => setMobileMenuOpen(false)} type="button" />
            <div className="relative h-full w-[min(86vw,300px)] bg-white shadow-2xl">
              <PortalSidebar activeItem={activeItem} mobile onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        ) : null}
        <section className="min-w-0 bg-white">
          <PortalTopbar onOpenMenu={() => setMobileMenuOpen(true)} />
          <div className="w-full px-8 max-sm:px-4">
            {children}
          </div>
          <PortalFooter />
        </section>
      </div>
    </main>
  );
}

function PortalSidebar({ activeItem, mobile = false, onNavigate }: { activeItem: string; mobile?: boolean; onNavigate?: () => void }) {
  return (
    <aside className={cn("sticky top-0 h-screen border-r border-brand-line bg-white", !mobile && "max-lg:hidden", mobile && "h-full")}>
      <div className="flex h-full flex-col px-3 py-5">
        <div className="flex items-center justify-between px-3">
          <EnergyInsightWordmark />
          <button className="grid size-9 place-items-center rounded-full border border-brand-line bg-white text-brand-navy shadow-panel" type="button">
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="mt-9 grid gap-6">
          {sidebarGroups.map((group) => (
            <div key={group.title}>
              <h2 className="px-3 text-xs font-bold uppercase text-brand-muted">{group.title}</h2>
              <div className="mt-3 grid gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const href =
                    item.icon === Home
                      ? "/customer-portal"
                      : item.icon === LayoutGrid
                        ? "/customer-portal?section=apps"
                        : item.icon === FolderOpen
                          ? "/customer-portal/du-an-cua-toi"
                          : item.icon === Database
                            ? "/customer-portal?section=data"
                            : item.icon === BarChart3
                              ? "/customer-portal?section=reports"
                              : item.icon === Building2
                                ? "/customer-portal?section=organization"
                                : item.icon === Users
                                  ? "/customer-portal?section=members"
                                  : item.icon === Settings
                                    ? "/customer-portal?section=settings"
                                    : "/customer-portal";
                  const active = item.label === activeItem || ("active" in item && item.active && activeItem === "Tổng quan");

                  return (
                  <a
                    className={cn(
                      "relative flex h-11 items-center gap-3 rounded-lg px-4 text-[15px] font-semibold text-brand-muted transition hover:bg-blue-50 hover:text-brand-blue",
                      active && "bg-blue-50 text-brand-blue shadow-panel before:absolute before:left-0 before:top-2 before:h-7 before:w-1 before:rounded-r-full before:bg-brand-blue"
                    )}
                    href={href}
                    key={item.label}
                    onClick={onNavigate}
                  >
                    <Icon size={20} />
                    {item.label}
                  </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto">
          <button className="flex h-12 w-full items-center gap-3 rounded-lg border border-brand-line bg-white px-5 text-[15px] font-semibold text-brand-muted shadow-panel" type="button">
            <ChevronLeft size={19} />
            Thu gọn
          </button>
          <p className="mt-7 px-5 text-xs font-medium text-brand-muted">Phiên bản 2.0.0</p>
        </div>
      </div>
    </aside>
  );
}

function PortalTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="border-b border-brand-line bg-white">
      <div className="flex min-h-[74px] w-full items-center justify-between gap-5 px-8 max-sm:px-4">
        <button aria-label="Mở menu" className="hidden size-10 place-items-center rounded-lg border border-brand-line max-lg:grid" onClick={onOpenMenu} type="button">
          <Menu size={20} />
        </button>
        <button className="flex h-12 min-w-[292px] items-center justify-between rounded-xl border border-brand-line bg-white px-4 shadow-panel" type="button">
          <span className="flex items-center gap-3 text-left">
            <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand-blue">
              <BarChart3 size={19} />
            </span>
            <span>
              <small className="block text-xs font-medium text-brand-muted">Workspace hiện tại</small>
              <strong className="text-sm font-bold text-brand-navy">Solaris Energy Vietnam</strong>
            </span>
          </span>
          <ChevronDown size={18} className="text-brand-muted" />
        </button>

        <div className="flex flex-1 items-center justify-end gap-5">
          <button className="relative text-brand-navy" type="button" aria-label="Thông báo">
            <Bell size={22} />
            <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-red-500 text-xs font-bold text-white">6</span>
          </button>
          <button className="text-brand-muted" type="button" aria-label="Trợ giúp">
            <CircleHelp size={23} />
          </button>
          <button className="flex items-center gap-3" type="button">
            <span className="grid size-11 place-items-center rounded-full bg-brand-blue text-sm font-bold text-white">NT</span>
            <span className="text-left leading-tight">
              <strong className="block text-sm font-bold text-brand-navy">Nguyễn Tuấn</strong>
              <small className="font-medium text-brand-muted">Quản trị viên</small>
            </span>
            <ChevronDown size={18} className="text-brand-muted" />
          </button>
        </div>
      </div>
    </header>
  );
}

function ApplicationsCard() {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <h2 className="text-xl font-bold text-brand-navy">Ứng dụng khả dụng</h2>
      <div className="mt-4 grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        {appCards.map(({ action, badge, description, icon: Icon, title, tone }) => (
          <div className={cn("rounded-xl border p-4", tone === "green" ? "border-green-100 bg-green-50/30" : tone === "purple" ? "border-violet-100 bg-violet-50/35" : "border-blue-100 bg-blue-50/30")} key={title}>
            <div className="grid grid-cols-[44px_1fr_auto] gap-3">
              <span className={cn("grid size-11 place-items-center rounded-xl", toneClasses[tone as keyof typeof toneClasses])}>
                <Icon size={24} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={cn("text-base font-bold", tone === "green" ? "text-brand-green" : tone === "purple" ? "text-violet-700" : "text-brand-blue")}>{title}</h3>
                  {badge ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">{badge}</span> : null}
                </div>
                <p className="mt-2 min-h-[42px] text-sm font-medium leading-6 text-brand-muted">{description}</p>
              </div>
            </div>
            <a className={cn("mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-bold", tone === "green" ? "border-green-100 bg-white/70 text-brand-green" : tone === "purple" ? "border-violet-100 bg-violet-100/40 text-violet-700" : "border-blue-100 bg-white/80 text-brand-blue")} href={title === "BESS Planner" ? "/customer-portal/du-an-cua-toi" : title === "Quick Sizing" ? "/quick-sizing" : "/customer-portal"}>
              {action}
              <ArrowRight size={17} />
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatsGrid() {
  return (
    <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {stats.map(({ change, icon: Icon, label, tone, value }) => (
        <Card className="grid min-h-[105px] grid-cols-[56px_1fr] items-center gap-4 rounded-xl bg-white p-4 shadow-panel" key={label}>
          <span className={cn("grid size-14 place-items-center rounded-full", toneClasses[tone as keyof typeof toneClasses])}>
            <Icon size={30} />
          </span>
          <span>
            <span className="block text-sm font-medium text-brand-muted">{label}</span>
            <strong className="mt-1 inline-flex items-baseline gap-2 text-[30px] font-bold leading-none text-brand-navy">
              {value}
              <small className="text-sm font-bold text-brand-green">↑ {change}</small>
            </strong>
            <small className="block text-sm font-medium text-brand-muted">so với tháng trước</small>
          </span>
        </Card>
      ))}
    </div>
  );
}

function ProjectsTable() {
  return (
    <Card className="overflow-hidden rounded-xl bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-brand-line px-4 py-4">
        <h2 className="text-xl font-bold text-brand-navy">Dự án gần đây</h2>
        <a className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue" href="/customer-portal/du-an-cua-toi">
          Xem tất cả dự án
          <ArrowRight size={17} />
        </a>
      </div>
      <table className="w-full table-fixed border-collapse text-sm">
        <thead className="bg-white text-left text-brand-muted">
          <tr>
            <th className="w-[28%] px-4 py-3 font-semibold">Tên dự án</th>
            <th className="w-[24%] px-4 py-3 font-semibold">Công ty / Site</th>
            <th className="w-[17%] px-4 py-3 font-semibold">Ứng dụng</th>
            <th className="w-[16%] px-4 py-3 font-semibold">Trạng thái</th>
            <th className="px-4 py-3 font-semibold">Cập nhật lần cuối</th>
            <th className="w-10 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {projects.map(([name, company, app, status, updated]) => (
            <tr className="border-t border-brand-line" key={name}>
              <td className="px-4 py-3 font-semibold text-brand-navy">
                <span className="inline-flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded bg-blue-50 text-brand-blue">
                    <FileBarChart size={16} />
                  </span>
                  {name}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-brand-muted">{company}</td>
              <td className="px-4 py-3 font-semibold text-brand-navy">
                <span className="inline-flex items-center gap-2">
                  <Zap size={16} className={app === "BESS Planner" ? "text-brand-green" : "text-brand-blue"} />
                  {app}
                </span>
              </td>
              <td className="px-4 py-3"><StatusBadge status={status} /></td>
              <td className="px-4 py-3 font-medium text-brand-muted">{updated}</td>
              <td className="px-2 py-3 text-brand-muted"><MoreVertical size={17} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-brand-line px-4 py-3 text-sm font-medium text-brand-muted">
        <span>Hiển thị 1 - 5 trên 24 dự án</span>
        <div className="flex items-center gap-2">
          <button className="grid size-8 place-items-center rounded-md text-brand-muted" type="button"><ChevronLeft size={16} /></button>
          {[1, 2, 3, 4, 5].map((page) => (
            <button className={cn("grid size-8 place-items-center rounded-md border border-brand-line font-bold", page === 1 ? "bg-brand-blue text-white" : "bg-white text-brand-muted")} key={page} type="button">{page}</button>
          ))}
          <span className="px-2">...</span>
          <button className="grid size-8 place-items-center rounded-md border border-brand-line text-brand-navy" type="button"><ChevronRight size={16} /></button>
        </div>
      </div>
    </Card>
  );
}

function RecentActivity() {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-navy">Hoạt động gần đây</h2>
        <a className="text-sm font-bold text-brand-blue" href="/customer-portal">Xem tất cả</a>
      </div>
      <div className="mt-4 grid gap-4">
        {activities.map(({ detail, icon: Icon, time, title, tone }) => (
          <div className="grid grid-cols-[42px_1fr_auto] gap-3" key={`${title}-${time}`}>
            <span className={cn("grid size-10 place-items-center rounded-full", toneClasses[tone as keyof typeof toneClasses])}>
              <Icon size={20} />
            </span>
            <span>
              <strong className="block text-sm font-bold text-brand-navy">{title}</strong>
              <small className="mt-1 block text-sm font-medium leading-5 text-brand-muted">{detail}</small>
            </span>
            <span className="whitespace-nowrap text-xs font-semibold text-brand-muted">{time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SupportCard() {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <div className="grid grid-cols-[1fr_124px] gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Hỗ trợ & Liên hệ</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-brand-muted">Đội ngũ DataInsight luôn sẵn sàng hỗ trợ bạn tận dụng tối đa nền tảng.</p>
          <a className="mt-4 flex h-10 min-w-[176px] items-center justify-center gap-2 rounded-lg bg-brand-blue px-5 text-sm font-bold text-white shadow-panel" href="/lien-he">
            Trung tâm hỗ trợ
            <ArrowRight size={17} />
          </a>
          <a className="mt-3 flex h-10 min-w-[176px] items-center justify-center gap-2 rounded-lg border border-brand-line bg-white px-5 text-sm font-bold text-brand-muted" href="/lien-he">
            <Headphones size={17} />
            Liên hệ chuyên gia
          </a>
        </div>
        <SupportIllustration />
      </div>
    </Card>
  );
}

function PlanCard() {
  return (
    <Card className="overflow-hidden rounded-xl border-green-100 bg-green-50/60 p-4 shadow-panel">
      <div className="grid grid-cols-[1fr_140px] items-end gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-brand-green">Gói Doanh nghiệp</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-brand-green">
              Đang sử dụng
              <ChevronDown size={13} />
            </span>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-brand-muted">Truy cập đầy đủ các ứng dụng hiện có và sắp ra mắt, cùng bộ công cụ phân tích & quản lý năng lượng toàn diện.</p>
          <a className="mt-5 inline-flex items-center gap-2 text-base font-bold text-brand-blue" href="/bao-cao-mau">
            Xem chi tiết gói dịch vụ
            <ArrowRight size={18} />
          </a>
        </div>
        <PlanIllustration />
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Hoàn thành"
      ? "bg-green-50 text-brand-green"
      : status === "Đang phân tích"
        ? "bg-blue-50 text-brand-blue"
        : "bg-slate-100 text-brand-muted";

  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", styles)}>{status}</span>;
}

function EnergyInsightWordmark() {
  return (
    <span className="relative inline-flex items-center gap-2 whitespace-nowrap text-2xl font-bold text-brand-green">
      <span
        aria-hidden="true"
        className="relative inline-flex size-7 shrink-0 rotate-[30deg] rounded-lg border-[5px] border-brand-blue bg-sky-50 shadow-[inset_0_0_0_4px_rgba(12,163,75,0.95)] after:absolute after:inset-[6px] after:rounded after:bg-gradient-to-br after:from-brand-green after:to-brand-blue after:content-['']"
      />
      <span>
        Energy<span className="text-brand-blue">Insight</span>
      </span>
      <small className="absolute left-11 top-7 text-xs font-bold text-brand-navy/80">by DataInsight</small>
    </span>
  );
}

function SupportIllustration() {
  return (
    <div className="relative h-full min-h-[128px]">
      <div className="absolute bottom-2 left-4 grid size-20 place-items-center rounded-full bg-blue-100">
        <Headphones className="text-brand-blue" size={48} />
      </div>
      <span className="absolute right-2 top-5 h-9 w-14 rounded-lg bg-blue-100 after:absolute after:left-3 after:top-3 after:h-1 after:w-8 after:rounded-full after:bg-brand-blue/60 after:content-['']" />
      <span className="absolute right-0 top-20 h-9 w-14 rounded-lg bg-blue-50 after:absolute after:left-3 after:top-3 after:h-1 after:w-8 after:rounded-full after:bg-brand-blue/30 after:content-['']" />
    </div>
  );
}

function PlanIllustration() {
  return (
    <svg className="h-[130px] w-full" viewBox="0 0 160 130" fill="none" aria-hidden="true">
      <path d="M23 92h45l-10 24H10l13-24Z" fill="#7AC8F2" />
      <path d="M32 80h45l-9 22H21l11-22Z" fill="#075BEA" opacity=".85" />
      <path d="M99 40h32v74H99V40Z" fill="#D7F2DE" stroke="#7AC99B" />
      <path d="M109 53h13M109 66h13M109 79h13" stroke="#0CA34B" strokeWidth="3" />
      <path d="M128 23v91" stroke="#7AB88B" strokeWidth="4" />
      <path d="M128 24l-32 10M129 24l25-18M129 24l24 28" stroke="#7AB88B" strokeWidth="4" strokeLinecap="round" />
      <path d="M71 83h24v31H71V83ZM126 83h24v31h-24V83Z" fill="#EAF8EF" stroke="#9EDDB3" />
      <path d="M82 94v9M138 94v9" stroke="#0CA34B" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PortalFooter() {
  return (
    <footer className="border-t border-brand-line bg-white">
      <div className="flex min-h-[52px] w-full items-center justify-between px-8 text-xs font-medium text-brand-muted max-sm:px-4">
        <span>© 2026 DataInsight. All rights reserved.</span>
        <span className="flex gap-12">
          <a href="/lien-he">Chính sách bảo mật</a>
          <a href="/lien-he">Điều khoản sử dụng</a>
        </span>
      </div>
    </footer>
  );
}
