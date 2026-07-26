import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  CloudUpload,
  CreditCard,
  Database,
  Download,
  Edit3,
  Eye,
  FileBarChart,
  FileText,
  Folder,
  Gauge,
  HelpCircle,
  Home,
  Lock,
  Menu,
  MoreHorizontal,
  MoreVertical,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  XCircle,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "purple" | "orange" | "red" | "yellow";

type Metric = {
  title: string;
  value: string;
  delta: string;
  detail?: string;
  icon: LucideIcon;
  tone: Tone;
  down?: boolean;
  points?: number[];
};

const adminNav = [
  { label: "Tổng quan", href: "/admin", icon: Home },
  { label: "Quản lý người dùng", href: "/admin/users", icon: Users },
  { label: "Lead khách hàng", href: "/admin/leads", icon: UserPlus },
  { label: "Vai trò & quyền", href: "/admin/roles", icon: ShieldCheck },
  { label: "Dự án của người dùng", href: "/admin/projects", icon: Folder },
  { label: "File upload", href: "/admin/files", icon: CloudUpload },
  { label: "Báo cáo & Hoạt động", href: "/admin/reports", icon: FileBarChart },
  { label: "Gói & Thanh toán", href: "/admin/billing", icon: CreditCard },
  { label: "Cài đặt hệ thống", href: "/admin/settings", icon: Settings }
];

const defaultPoints = [18, 14, 28, 19, 23, 35, 17, 22, 18, 26, 21, 34, 16, 24];

const toneStyles: Record<Tone, { icon: string; text: string; bg: string; fill: string; stroke: string; soft: string }> = {
  blue: {
    icon: "bg-blue-500 text-white",
    text: "text-brand-blue",
    bg: "bg-blue-50",
    fill: "rgba(7,91,234,0.12)",
    stroke: "#075BEA",
    soft: "bg-blue-50 text-brand-blue"
  },
  green: {
    icon: "bg-brand-green text-white",
    text: "text-brand-green",
    bg: "bg-green-50",
    fill: "rgba(12,163,75,0.12)",
    stroke: "#0CA34B",
    soft: "bg-green-50 text-brand-green"
  },
  purple: {
    icon: "bg-violet-600 text-white",
    text: "text-violet-600",
    bg: "bg-violet-50",
    fill: "rgba(124,92,255,0.12)",
    stroke: "#7C5CFF",
    soft: "bg-violet-50 text-violet-700"
  },
  orange: {
    icon: "bg-orange-500 text-white",
    text: "text-orange-500",
    bg: "bg-orange-50",
    fill: "rgba(255,137,31,0.12)",
    stroke: "#FF8A1F",
    soft: "bg-orange-50 text-orange-600"
  },
  red: {
    icon: "bg-red-500 text-white",
    text: "text-red-500",
    bg: "bg-red-50",
    fill: "rgba(239,68,68,0.12)",
    stroke: "#EF4444",
    soft: "bg-red-50 text-red-600"
  },
  yellow: {
    icon: "bg-amber-500 text-white",
    text: "text-amber-500",
    bg: "bg-amber-50",
    fill: "rgba(245,158,11,0.12)",
    stroke: "#F59E0B",
    soft: "bg-amber-50 text-amber-600"
  }
};

const overviewMetrics: Metric[] = [
  { title: "Tổng người dùng", value: "1.248", delta: "12.5%", icon: Users, tone: "blue" },
  { title: "Người dùng hoạt động", value: "892", delta: "18.7%", icon: UserCheck, tone: "green" },
  { title: "Tổng dự án", value: "342", delta: "9.3%", icon: Folder, tone: "purple" },
  { title: "Tổng file upload", value: "18.62 TB", delta: "23.4%", icon: CloudUpload, tone: "orange" },
  { title: "Doanh thu tháng", value: "312.450.000 đ", delta: "15.6%", icon: CircleDollarSign, tone: "green" }
];

const roleMetrics: Metric[] = [
  { title: "Tổng vai trò", value: "7", delta: "12.5%", icon: Users, tone: "blue" },
  { title: "Vai trò tuỳ chỉnh", value: "3", delta: "23.1%", icon: SlidersHorizontal, tone: "green" },
  { title: "Người dùng có quyền admin", value: "12", delta: "9.1%", icon: UserCog, tone: "purple" },
  { title: "Quyền truy cập đang hoạt động", value: "48", delta: "18.4%", icon: Lock, tone: "orange" }
];

const userMetrics: Metric[] = [
  { title: "Tổng người dùng", value: "1.248", delta: "12.5%", icon: Users, tone: "blue" },
  { title: "Người dùng hoạt động", value: "892", delta: "18.7%", icon: UserCheck, tone: "green" },
  { title: "Người dùng mới", value: "156", delta: "22.3%", icon: UserPlus, tone: "purple" },
  { title: "Tài khoản bị khóa", value: "28", delta: "8.6%", icon: Lock, tone: "red", down: true }
];

const projectMetrics: Metric[] = [
  { title: "Tổng dự án", value: "342", delta: "9.3%", icon: Folder, tone: "purple" },
  { title: "Đang thực hiện", value: "156", delta: "18.7%", icon: Zap, tone: "blue" },
  { title: "Hoàn thành", value: "128", delta: "21.4%", icon: CheckCircle2, tone: "green" },
  { title: "Tạm dừng", value: "38", delta: "6.2%", icon: Gauge, tone: "orange" },
  { title: "Dự án mới tháng này", value: "46", delta: "15.6%", icon: Plus, tone: "yellow" }
];

const fileMetrics: Metric[] = [
  { title: "Tổng file", value: "12.458", delta: "18.7%", icon: FileText, tone: "blue" },
  { title: "Dung lượng lưu trữ", value: "268.4 GB", delta: "14.2%", icon: Database, tone: "green" },
  { title: "Upload hôm nay", value: "186", delta: "23.5%", icon: UploadCloud, tone: "purple" },
  { title: "File lỗi", value: "156", delta: "6.3%", icon: AlertTriangle, tone: "orange", down: true },
  { title: "File chờ duyệt", value: "342", delta: "12.1%", icon: CalendarDays, tone: "red" }
];

const billingMetrics: Metric[] = [
  { title: "Doanh thu tháng", value: "312.450.000 đ", delta: "15.6%", icon: CircleDollarSign, tone: "green" },
  { title: "Gói đang hoạt động", value: "156", delta: "14.2%", icon: PackagePlus, tone: "blue" },
  { title: "Sắp hết hạn", value: "23", delta: "9.5%", icon: CalendarDays, tone: "orange" },
  { title: "Thanh toán thất bại", value: "7", delta: "22.2%", icon: AlertTriangle, tone: "red", down: true }
];

const reportMetrics: Metric[] = [
  { title: "Số báo cáo tháng này", value: "28", delta: "12.5%", icon: FileText, tone: "blue" },
  { title: "Lượt tải báo cáo", value: "156", delta: "18.7%", icon: Cloud, tone: "green" },
  { title: "Sự kiện hệ thống", value: "1.234", delta: "9.3%", icon: Bell, tone: "purple" },
  { title: "Hoạt động bất thường", value: "27", delta: "3.4%", icon: AlertTriangle, tone: "orange" }
];

const roleRows = [
  ["Super Admin", "Quyền truy cập toàn bộ hệ thống", "1", "Đang hoạt động"],
  ["Admin", "Quản trị hệ thống và người dùng", "4", "Đang hoạt động"],
  ["Quản trị viên", "Quản lý dự án và dữ liệu", "6", "Đang hoạt động"],
  ["Kỹ sư", "Upload dữ liệu và xem phân tích", "18", "Đang hoạt động"],
  ["Nhà phân tích", "Xem báo cáo và phân tích", "12", "Đang hoạt động"],
  ["Khách hàng", "Xem thông tin dự án và báo cáo", "25", "Đang hoạt động"],
  ["Viewer", "Chỉ xem thông tin cơ bản", "34", "Đang hoạt động"]
];

const users = [
  ["1", "Nguyễn Văn An", "an.nguyen@solartech.vn", "Super Admin", "SolarTech Việt Nam", "Hoạt động", "31/05/2024 09:15"],
  ["2", "Trần Thị Bình", "binh.tran@greencode.vn", "Admin", "GreenCode JSC", "Hoạt động", "31/05/2024 08:47"],
  ["3", "Lê Hoàng Cường", "cuong.le@pv-power.vn", "Manager", "PV Power JSC", "Hoạt động", "31/05/2024 07:32"],
  ["4", "Phạm Thu Hà", "ha.pham@solartech.vn", "Viewer", "SolarTech Việt Nam", "Hoạt động", "30/05/2024 16:05"],
  ["5", "Đặng Minh Khôi", "khoi.dang@energyhub.vn", "Analyst", "Energy Hub Co., Ltd", "Hoạt động", "30/05/2024 14:21"],
  ["6", "Vũ Quốc Huy", "huy.vu@windpower.vn", "Manager", "WindPower Co., Ltd", "Hoạt động", "30/05/2024 11:11"],
  ["7", "Ngô Thùy Linh", "linh.ngo@greencode.vn", "Viewer", "GreenCode JSC", "Không hoạt động", "28/05/2024 09:18"],
  ["8", "Bùi Đức Nam", "nam.bui@pv-power.vn", "Analyst", "PV Power JSC", "Không hoạt động", "26/05/2024 17:42"],
  ["9", "Lý Nhật Anh", "anh.ly@solartech.vn", "Viewer", "SolarTech Việt Nam", "Bị khóa", "20/05/2024 10:33"],
  ["10", "Trịnh Quốc Bảo", "bao.trinh@energyhub.vn", "Analyst", "Energy Hub Co., Ltd", "Bị khóa", "15/05/2024 08:56"]
];

const projects = [
  ["PRJ-2024-00567", "Nhà máy điện mặt trời Phú Yên", "Công ty TNHH Năng lượng Xanh", "Nguyễn Văn Admin", "Quick Sizing", "Đang thực hiện", "29/05/2024", "31/05/2024 10:30"],
  ["PRJ-2024-00566", "BESS 10MW/20MWh - Bình Dương", "Công ty CP Đầu tư Bình Dương", "Trần Thị Mai", "BESS Planner", "Đang thực hiện", "28/05/2024", "31/05/2024 09:10"],
  ["PRJ-2024-00565", "Nhà máy điện mặt trời Long An", "Công ty TNHH Long An Solar", "Lê Minh Tuấn", "Quick Sizing", "Hoàn thành", "27/05/2024", "30/05/2024 16:45"],
  ["PRJ-2024-00564", "BESS 5MW/10MWh - Tây Ninh", "Công ty TNHH Tây Ninh Power", "Phạm Hoàng Nam", "BESS Planner", "Tạm dừng", "25/05/2024", "29/05/2024 14:20"],
  ["PRJ-2024-00563", "Nhà máy điện gió Bạc Liêu", "Công ty CP Năng lượng Gió", "Nguyễn Thị Hạnh", "Quick Sizing", "Đang thực hiện", "24/05/2024", "29/05/2024 11:05"],
  ["PRJ-2024-00562", "Điện mặt trời mái nhà - Cần Thơ", "Công ty CP Thương mại Cần Thơ", "Trần Văn Khoa", "Quick Sizing", "Hoàn thành", "23/05/2024", "28/05/2024 15:35"],
  ["PRJ-2024-00561", "BESS 20MW/40MWh - Đồng Nai", "Công ty TNHH Đồng Nai Energy", "Lê Minh Tuấn", "BESS Planner", "Tạm dừng", "22/05/2024", "27/05/2024 10:15"],
  ["PRJ-2024-00560", "Nhà máy điện mặt trời Ninh Thuận", "Công ty TNHH Ninh Thuận Solar", "Nguyễn Văn Admin", "Quick Sizing", "Hoàn thành", "21/05/2024", "26/05/2024 09:40"]
];

const files = [
  ["Bao_cao_san_luong_T5_2024.xlsx", "Báo cáo sản lượng", "XLSX", "Nguyễn Văn An", "EVN HCMC", "Nhà máy điện Thủ Đức", "2.45 MB", "31/05/2024 14:32", "Hợp lệ"],
  ["Hop_dong_mua_ban_dien_2024.pdf", "Hợp đồng", "PDF", "Trần Thị Bình", "PV Power", "NMĐ Cà Mau 1&2", "1.38 MB", "31/05/2024 11:05", "Hợp lệ"],
  ["Du_lieu_van_hanh_T5.csv", "Dữ liệu vận hành", "CSV", "Lê Minh Đức", "EVN HANOI", "Trạm biến áp 110kV", "5.76 MB", "31/05/2024 09:41", "Chờ duyệt"],
  ["Ke_hoach_bao_tri_T6_2024.xlsx", "Kế hoạch bảo trì", "XLSX", "Phạm Quốc Huy", "REE Power", "Nhà máy điện Gió Bạc Liêu", "3.21 MB", "30/05/2024 16:20", "Hợp lệ"],
  ["Huong_dan_van_hanh_thiet_bi.pdf", "Tài liệu kỹ thuật", "PDF", "Vũ Thị Hường", "EVNGENCO 3", "NMNĐ Vĩnh Tân 4", "4.92 MB", "30/05/2024 13:15", "Lỗi định dạng"],
  ["Du_lieu_SCADA_T5_2024.zip", "Dữ liệu SCADA", "ZIP", "Nguyễn Hoàng Nam", "PC Đà Nẵng", "Lưới điện phân phối", "128.7 MB", "30/05/2024 10:02", "Chờ duyệt"],
  ["Chi_so_cong_to_T5.csv", "Chỉ số công tơ", "CSV", "Đỗ Hải Long", "EVN NPC", "Công tơ khách hàng", "1.02 MB", "29/05/2024 15:47", "Hợp lệ"],
  ["Bien_ban_nghiem_thu_2024.pdf", "Biên bản nghiệm thu", "PDF", "Ngô Thị Mai", "SolarTech", "Dự án Điện mặt trời 50MW", "2.18 MB", "29/05/2024 09:12", "Chờ duyệt"],
  ["Bao_cao_tai_chinh_Q1_2024.xlsx", "Báo cáo tài chính", "XLSX", "Phan Văn Dũng", "EVNFINANCE", "Báo cáo quý I/2024", "6.83 MB", "28/05/2024 17:33", "Hợp lệ"],
  ["De_xuat_dau_tu_du_an.pdf", "Đề xuất đầu tư", "PDF", "Bùi Đức Thắng", "PC Hải Phòng", "Nâng cấp lưới điện 2024", "3.66 MB", "29/05/2024 14:08", "Lỗi định dạng"]
];

const payments = [
  ["EV", "Công ty TNHH Năng lượng Xanh", "greenenergy@company.vn", "Professional", "Tháng", "599.000 đ", "Đã thanh toán", "INV-2024-0512", "12/06/2024"],
  ["PV", "EV Power JSC", "contact@evpower.vn", "Starter", "Tháng", "199.000 đ", "Chờ thanh toán", "INV-2024-0528", "28/06/2024"],
  ["SW", "SolarTech Việt Nam", "info@solartech.vn", "Professional", "Năm", "6.590.000 đ", "Đã thanh toán", "INV-2024-0115", "15/01/2025"],
  ["GF", "GreenFuture Co., Ltd", "hello@greenfuture.vn", "Starter", "Tháng", "199.000 đ", "Quá hạn", "INV-2024-0410", "10/05/2024"],
  ["BN", "Bắc Nam Energy", "admin@bacnamenergy.vn", "Enterprise", "Năm", "Liên hệ", "Đã thanh toán", "INV-2023-1201", "01/12/2024"]
];

const activityRows = [
  ["01/05/2024 10:25:43", "Nguyễn Văn Admin", "Đăng nhập hệ thống", "Hệ thống", "Thành công", "103.77.12.45"],
  ["01/05/2024 09:58:11", "Trần Minh Quân", "Tạo người dùng mới", "Người dùng: phamthao@evn.vn", "Thành công", "118.69.21.33"],
  ["01/05/2024 09:32:07", "Lê Thị Mai", "Cập nhật vai trò", "Người dùng: lehoang@evn.vn", "Thành công", "27.78.90.12"],
  ["01/05/2024 09:12:54", "Phạm Hoàng Nam", "Xóa file", "File: report_q1_2024.pdf", "Thành công", "113.161.45.21"],
  ["01/05/2024 08:31:15", "Hệ thống", "Upload file", "File: data_energy_may.csv", "Thành công", "System"],
  ["01/05/2024 08:13:11", "Hệ thống", "Đăng xuất người dùng", "Người dùng: tranminhquan@evn.vn", "Thành công", "System"],
  ["01/05/2024 07:59:41", "Hệ thống", "Đăng nhập thất bại", "Người dùng: admin@evn.vn", "Thất bại", "113.161.45.21"]
];

export function AdminOverviewPage() {
  return (
    <AdminShell activeItem="Tổng quan" title="Tổng quan hệ thống" subtitle="Chào mừng bạn trở lại! Đây là tổng quan hoạt động của hệ thống EnergyInsight." action={<DateRange />}>
      <MetricGrid metrics={overviewMetrics} columns="five" />
      <div className="grid grid-cols-[1.35fr_0.85fr_1.15fr] gap-4 max-2xl:grid-cols-2 max-xl:grid-cols-1">
        <Panel title="Tăng trưởng người dùng" action={<MiniSelect label="6 tháng gần nhất" />} className="max-2xl:col-span-2 max-xl:col-span-1">
          <LineChart lines={[{ color: "#075BEA", values: [820, 870, 940, 1020, 1110, 1248] }, { color: "#0CA34B", values: [520, 560, 610, 670, 750, 892] }]} labels={["Tháng 12/2023", "Tháng 01/2024", "Tháng 02/2024", "Tháng 03/2024", "Tháng 04/2024", "Tháng 05/2024"]} />
        </Panel>
        <Panel title="Phân bổ người dùng theo vai trò">
          <DonutWithLegend center="1.248" label="người dùng" items={[["Admin", "5 (0.4%)", "blue"], ["Quản trị viên", "18 (1.4%)", "green"], ["Kỹ sư", "563 (45.1%)", "purple"], ["Nhà phân tích", "412 (33.0%)", "purple"], ["Khách hàng", "250 (20.1%)", "orange"]]} />
        </Panel>
        <Panel title="Trạng thái dự án" action={<MiniSelect label="Tất cả dự án" />}>
          <DonutWithLegend center="342" label="dự án" items={[["Đang thực hiện", "158 (46.2%)", "green"], ["Hoàn thành", "112 (32.7%)", "blue"], ["Tạm dừng", "46 (13.5%)", "yellow"], ["Đã hủy", "26 (7.6%)", "red"]]} />
        </Panel>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1.25fr] gap-4 max-xl:grid-cols-1">
        <TopUsagePanel />
        <RecentSystemPanel />
        <QuickStatusPanel />
      </div>
      <UpdatedAt />
    </AdminShell>
  );
}

export function AdminRolesPage() {
  return (
    <AdminShell activeItem="Vai trò & quyền" title="Vai trò & quyền" subtitle="Quản lý vai trò hệ thống và phân quyền truy cập cho người dùng." action={<Button variant="secondary"><HelpCircle size={17} /> Hướng dẫn</Button>}>
      <MetricGrid metrics={roleMetrics} columns="four" />
      <div className="grid grid-cols-[0.85fr_1fr_360px] gap-4 max-2xl:grid-cols-[1fr_1.1fr] max-xl:grid-cols-1">
        <Panel title="Danh sách vai trò" className="overflow-hidden">
          <Toolbar fields={["Tìm kiếm vai trò...", "Tất cả trạng thái"]} button="Tạo vai trò mới" />
          <SimpleTable headers={["Vai trò", "Số người dùng", "Trạng thái", "Hành động"]} rows={roleRows.map(([role, desc, count, status]) => [
            <RoleCell key={role} title={role} desc={desc} />,
            count,
            <StatusPill key={status} status={status} />,
            <IconButton key="more" icon={MoreHorizontal} />
          ])} />
          <Pagination text="Hiển thị 1 - 7 trong 7 vai trò" />
        </Panel>
        <Panel title="Ma trận quyền" action={<MiniSelect label="Hiển thị: Tất cả vai trò" />} className="overflow-hidden">
          <PermissionMatrix />
        </Panel>
        <Panel title="Tạo / Chỉnh sửa vai trò">
          <RoleForm />
        </Panel>
      </div>
      <UpdatedAt />
    </AdminShell>
  );
}

export function AdminSettingsPage() {
  return (
    <AdminShell activeItem="Cài đặt hệ thống" title="Cài đặt hệ thống" subtitle="Quản lý và cấu hình các thiết lập hệ thống áp dụng cho toàn bộ nền tảng EnergyInsight.">
      <div className="grid grid-cols-[1fr_360px] gap-5 max-xl:grid-cols-1">
        <div className="grid gap-4">
          <SettingsTabs />
          <Panel title="Thông tin nền tảng">
            <SettingsForm />
          </Panel>
          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
            <ConfigCard title="Cấu hình email" toggle="Kích hoạt email" />
            <ConfigCard title="Cấu hình SMPP (SMS)" toggle="Kích hoạt SMPP" sms />
          </div>
          <div className="flex justify-between gap-4">
            <Button variant="secondary"><RefreshCw size={17} /> Khôi phục mặc định</Button>
            <Button><Download size={17} /> Lưu tất cả cấu hình</Button>
          </div>
        </div>
        <div className="grid content-start gap-4">
          <ServiceStatus />
          <VersionPanel />
          <BackupPanel />
        </div>
      </div>
    </AdminShell>
  );
}

export function AdminProjectsPage() {
  return (
    <AdminShell activeItem="Dự án của người dùng" title="Dự án của người dùng" subtitle="Theo dõi và quản lý các dự án do khách hàng và người dùng nội bộ tạo ra.">
      <MetricGrid metrics={projectMetrics} columns="five" />
      <Panel title="">
        <ProjectToolbar />
        <SimpleTable
          headers={["Mã dự án", "Tên dự án", "Khách hàng/Công ty", "Người sở hữu", "Công cụ", "Trạng thái", "Ngày tạo", "Cập nhật cuối", "Thao tác"]}
          rows={projects.map((row) => [
            row[0],
            row[1],
            row[2],
            <AvatarText key={row[3]} name={row[3]} />,
            <Tag key={row[4]} tone={row[4] === "BESS Planner" ? "green" : "purple"}>{row[4]}</Tag>,
            <StatusPill key={row[5]} status={row[5]} />,
            row[6],
            row[7],
            <ActionGroup key="actions" />
          ])}
        />
        <Pagination text="Hiển thị 1 đến 8 trong tổng số 342 dự án" pages={["1", "2", "3", "4", "5", "...", "35"]} />
      </Panel>
      <div className="grid grid-cols-[0.72fr_1fr] gap-5 max-xl:grid-cols-1">
        <Panel title="Phân bổ dự án theo trạng thái">
          <DonutWithLegend center="342" label="dự án" items={[["Đang thực hiện", "156 (45,6%)", "blue"], ["Hoàn thành", "128 (37,4%)", "green"], ["Tạm dừng", "38 (11,1%)", "orange"], ["Dự án mới", "20 (5,8%)", "yellow"]]} />
        </Panel>
        <Panel title="Top khách hàng theo số lượng dự án">
          <RankBars rows={[["Công ty TNHH Năng lượng Xanh", "28 dự án", 96], ["Công ty CP Đầu tư Bình Dương", "24 dự án", 82], ["Công ty TNHH Long An Solar", "20 dự án", 67], ["Công ty TNHH Đồng Nai Energy", "18 dự án", 59], ["Công ty CP Thương mại Cần Thơ", "16 dự án", 51]]} />
          <PanelLink label="Xem tất cả khách hàng" />
        </Panel>
      </div>
    </AdminShell>
  );
}

export function AdminFilesPage() {
  return (
    <AdminShell activeItem="File upload" title="File upload" subtitle="Quản lý và theo dõi các file được người dùng tải lên hệ thống.">
      <MetricGrid metrics={fileMetrics} columns="five" />
      <div className="grid grid-cols-[1fr_360px] gap-4 max-xl:grid-cols-1">
        <div className="grid gap-4">
          <Panel title="">
            <FileFilters />
          </Panel>
          <Panel title="" className="overflow-hidden">
            <SimpleTable headers={["Tên file", "Loại file", "Định dạng", "Người dùng", "Công ty", "Dự án", "Dung lượng", "Ngày tải lên", "Trạng thái", "Thao tác"]} rows={files.map((row) => [
              <FileName key={row[0]} name={row[0]} type={row[2]} />,
              row[1],
              <Tag key={row[2]} tone={row[2] === "PDF" ? "red" : row[2] === "ZIP" ? "purple" : "green"}>{row[2]}</Tag>,
              <AvatarText key={row[3]} name={row[3]} />,
              row[4],
              row[5],
              row[6],
              row[7],
              <StatusPill key={row[8]} status={row[8]} />,
              <FileActions key="actions" status={row[8]} />
            ])} />
            <Pagination text="Hiển thị 1 - 10 trong tổng số 12.458 file" pages={["1", "2", "3", "...", "1.246"]} />
          </Panel>
        </div>
        <div className="grid content-start gap-4">
          <RecentUploads />
          <StorageByCompany />
        </div>
      </div>
      <UpdatedAt label="Dữ liệu được cập nhật lần cuối: 31/05/2024 14:45" />
    </AdminShell>
  );
}

export function AdminBillingPage() {
  return (
    <AdminShell activeItem="Gói & Thanh toán" title="Gói & Thanh toán" subtitle="Quản lý gói đăng ký, thanh toán và tình hình sử dụng gói của khách hàng." action={<BillingActions />}>
      <MetricGrid metrics={billingMetrics} columns="four" />
      <Panel title="Các gói đăng ký">
        <PlanGrid />
      </Panel>
      <Panel title="Danh sách thanh toán" className="overflow-hidden">
        <BillingToolbar />
        <SimpleTable headers={["Khách hàng", "Gói hiện tại", "Chu kỳ", "Giá trị", "Trạng thái thanh toán", "Hóa đơn gần nhất", "Hết hạn", "Thao tác"]} rows={payments.map((row) => [
          <CustomerCell key={row[1]} initials={row[0]} name={row[1]} email={row[2]} />,
          <span key={row[3]} className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-violet-500" />{row[3]}</span>,
          row[4],
          row[5],
          <StatusPill key={row[6]} status={row[6]} />,
          <span key={row[7]} className="font-semibold text-brand-blue">{row[7]}<small className="block text-brand-muted">12/05/2024</small></span>,
          <span key={row[8]}>{row[8]}<small className={cn("block font-semibold", row[6] === "Quá hạn" ? "text-red-500" : "text-brand-green")}>{row[6] === "Quá hạn" ? "Quá hạn 21 ngày" : "Còn 12 ngày"}</small></span>,
          <ActionGroup key="actions" />
        ])} />
      </Panel>
      <div className="grid grid-cols-[1fr_1fr] gap-4 max-xl:grid-cols-1">
        <Panel title="Xu hướng doanh thu" action={<MiniSelect label="30 ngày qua" />}>
          <LineChart lines={[{ color: "#075BEA", values: [120, 150, 170, 160, 190, 210, 185, 225, 260, 230, 280, 350] }]} labels={["01/05", "06/05", "11/05", "16/05", "21/05", "31/05"]} />
        </Panel>
        <Panel title="Phân bổ phương thức thanh toán">
          <DonutWithLegend center="312.450.000 đ" label="" items={[["Chuyển khoản ngân hàng", "178.540.000 đ (57.1%)", "blue"], ["Thẻ tín dụng / Thẻ ghi nợ", "92.370.000 đ (29.6%)", "green"], ["Ví điện tử", "28.440.000 đ (9.1%)", "orange"], ["Khác", "13.100.000 đ (4.2%)", "purple"]]} />
        </Panel>
      </div>
    </AdminShell>
  );
}

export function AdminUsersPage() {
  return (
    <AdminShell activeItem="Quản lý người dùng" title="Quản lý người dùng" subtitle="Quản lý tất cả người dùng, vai trò và quyền truy cập trong hệ thống EnergyInsight.">
      <MetricGrid metrics={userMetrics} columns="four" />
      <Panel title="" className="overflow-hidden">
        <UserToolbar />
        <SimpleTable headers={["STT", "Họ và tên", "Email", "Vai trò", "Công ty", "Trạng thái", "Đăng nhập cuối", "Thao tác"]} rows={users.map((row) => [
          row[0],
          <AvatarText key={row[1]} name={row[1]} />,
          row[2],
          <Tag key={row[3]} tone={row[3] === "Manager" ? "green" : row[3] === "Analyst" ? "orange" : row[3] === "Viewer" ? "purple" : "blue"}>{row[3]}</Tag>,
          row[4],
          <StatusPill key={row[5]} status={row[5]} />,
          row[6],
          <ActionGroup key="actions" />
        ])} />
        <Pagination text="1 - 10 của 1.248" pages={["1", "2", "3", "...", "125"]} />
      </Panel>
    </AdminShell>
  );
}

export function AdminReportsPage() {
  return (
    <AdminShell activeItem="Báo cáo & Hoạt động" title="Báo cáo & Hoạt động" subtitle="Quản lý báo cáo hệ thống và theo dõi nhật ký hoạt động, sự kiện của hệ thống EnergyInsight.">
      <MetricGrid metrics={reportMetrics} columns="four" />
      <div className="grid grid-cols-[0.85fr_1fr] gap-4 max-xl:grid-cols-1">
        <ReportsCenter />
        <ActivityLog />
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-4 max-xl:grid-cols-1">
        <Panel title="Xu hướng hoạt động theo ngày" action={<MiniSelect label="7 ngày qua" />}>
          <LineChart lines={[{ color: "#075BEA", values: [612, 648, 701, 768, 832, 905, 948] }, { color: "#FF8A1F", values: [12, 14, 16, 18, 19, 23, 27] }]} labels={["25/04", "26/04", "27/04", "28/04", "29/04", "30/04", "01/05"]} />
        </Panel>
        <SecurityEvents />
      </div>
      <UpdatedAt />
    </AdminShell>
  );
}

export function AdminShell({ activeItem, action, children, subtitle, title }: { activeItem: string; action?: ReactNode; children: ReactNode; subtitle: string; title: string }) {
  return (
    <main className="min-h-screen bg-white text-brand-navy">
      <div className="grid min-h-screen grid-cols-[300px_1fr] max-xl:grid-cols-[260px_1fr] max-lg:grid-cols-1">
        <aside className="sticky top-0 h-screen border-r border-brand-line bg-white max-lg:hidden">
          <div className="flex h-full flex-col px-4 py-7">
            <Link className="flex items-center gap-3 px-2" href="/admin">
              <span className="relative block h-11 w-9">
                <span className="absolute left-3 top-0 h-9 w-4 -skew-y-[28deg] rounded bg-brand-green" />
                <span className="absolute bottom-0 left-0 h-8 w-4 skew-y-[28deg] rounded bg-brand-blue" />
                <span className="absolute bottom-3 right-0 h-6 w-4 -skew-y-[28deg] rounded bg-sky-400" />
              </span>
              <span>
                <strong className="block text-2xl font-bold text-brand-green">Energy<span className="text-brand-blue">Insight</span></strong>
                <small className="block text-center text-xs font-bold uppercase tracking-[0.24em] text-brand-muted">Admin Portal</small>
              </span>
            </Link>
            <nav className="mt-11 grid gap-2">
              {adminNav.map(({ href, icon: Icon, label }) => {
                const active = activeItem === label;
                return (
                  <Link className={cn("relative flex h-14 items-center gap-4 rounded-lg px-5 text-[15px] font-semibold text-brand-navy transition hover:bg-blue-50 hover:text-brand-blue", active && "bg-blue-50 text-brand-blue before:absolute before:left-0 before:top-3 before:h-8 before:w-1 before:rounded-r-full before:bg-brand-blue")} href={href} key={label}>
                    <Icon size={22} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto rounded-lg border border-brand-line bg-white p-4 shadow-panel">
              <div className="flex items-center gap-3">
                <AdminAvatar />
                <span className="min-w-0">
                  <strong className="block truncate text-sm">Nguyễn Văn Admin</strong>
                  <small className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-brand-green">Super Admin</small>
                  <small className="mt-1 block truncate text-xs text-brand-muted">admin@energyinsight.vn</small>
                </span>
                <ChevronDown className="ml-auto text-brand-muted" size={16} />
              </div>
            </div>
          </div>
        </aside>
        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 backdrop-blur">
            <div className="flex min-h-[76px] items-center gap-6 px-8 max-sm:px-4">
              <button className="grid size-10 place-items-center rounded-md text-brand-navy" type="button" aria-label="Menu">
                <Menu size={26} />
              </button>
              <div className="min-w-[260px] text-base font-semibold text-brand-navy">
                <span>Admin Portal</span>
                <span className="mx-4 text-brand-muted">/</span>
                <span>{activeItem}</span>
              </div>
              <div className="mx-auto max-w-[560px] flex-1">
                <label className="relative block">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
                  <Input className="h-12 rounded-lg pl-12 pr-16 text-[15px]" placeholder="Tìm kiếm người dùng, dự án, file..." />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-brand-line px-2 py-0.5 text-xs font-semibold text-brand-muted">⌘ K</span>
                </label>
              </div>
              <button className="relative text-brand-navy" type="button" aria-label="Thông báo">
                <Bell size={25} />
                <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-red-500 text-xs font-bold text-white">8</span>
              </button>
              <button className="flex items-center gap-3" type="button">
                <AdminAvatar />
                <strong className="text-sm">Nguyễn Văn Admin</strong>
                <ChevronDown size={17} />
              </button>
            </div>
          </header>
          <div className="px-8 py-5 max-sm:px-4">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[30px] font-bold leading-tight text-brand-navy">{title}</h1>
                <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">{subtitle}</p>
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className="grid gap-4">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricGrid({ columns, metrics }: { columns: "four" | "five"; metrics: Metric[] }) {
  return (
    <div className={cn("grid gap-4", columns === "five" ? "grid-cols-5 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-sm:grid-cols-1" : "grid-cols-4 max-2xl:grid-cols-2 max-sm:grid-cols-1")}>
      {metrics.map((metric) => <MetricCard key={metric.title} metric={metric} />)}
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  const tone = toneStyles[metric.tone];
  return (
    <Card className="overflow-hidden rounded-xl bg-white p-5 shadow-panel">
      <div className="grid grid-cols-[56px_1fr] gap-4">
        <span className={cn("grid size-14 place-items-center rounded-full", tone.icon)}>
          <Icon size={28} />
        </span>
        <span>
          <span className="block text-sm font-medium text-brand-muted">{metric.title}</span>
          <strong className="mt-1 block text-[27px] font-bold leading-none text-brand-navy">{metric.value}</strong>
          <small className={cn("mt-3 block text-xs font-semibold", metric.down ? "text-red-500" : "text-brand-green")}>
            {metric.down ? "↓" : "↑"} {metric.delta} <span className="font-medium text-brand-muted">so với tháng trước</span>
          </small>
        </span>
      </div>
      <Sparkline className="mt-4 h-9" points={metric.points ?? defaultPoints} tone={metric.tone} />
    </Card>
  );
}

function Panel({ action, children, className, title }: { action?: ReactNode; children: ReactNode; className?: string; title: string }) {
  return (
    <Card className={cn("rounded-xl bg-white p-4 shadow-panel", className)}>
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-bold text-brand-navy">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </Card>
  );
}

function Sparkline({ className, points, tone }: { className?: string; points: number[]; tone: Tone }) {
  const width = 220;
  const height = 42;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((point - min) / Math.max(1, max - min)) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg className={cn("w-full", className)} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polygon points={area} fill={toneStyles[tone].fill} />
      <polyline points={line} fill="none" stroke={toneStyles[tone].stroke} strokeWidth="2.2" />
    </svg>
  );
}

function LineChart({ labels, lines }: { labels: string[]; lines: Array<{ color: string; values: number[] }> }) {
  const width = 760;
  const height = 230;
  const all = lines.flatMap((line) => line.values);
  const max = Math.max(...all);
  const min = Math.min(...all, 0);
  const toPoints = (values: number[]) =>
    values.map((value, index) => {
      const x = 46 + (index / (values.length - 1)) * (width - 82);
      const y = height - 34 - ((value - min) / Math.max(1, max - min)) * (height - 72);
      return { x, y, value };
    });
  return (
    <div className="w-full overflow-hidden">
      <svg className="h-[260px] w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        {[0, 1, 2, 3].map((tick) => {
          const y = 24 + tick * 42;
          return <line key={tick} x1="46" x2={width - 24} y1={y} y2={y} stroke="#E5EDF8" strokeDasharray="5 5" />;
        })}
        {lines.map((line) => {
          const points = toPoints(line.values);
          const path = points.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <g key={line.color}>
              <polyline points={path} fill="none" stroke={line.color} strokeWidth="2.4" />
              {points.map((point, index) => (
                <g key={`${line.color}-${index}`}>
                  <circle cx={point.x} cy={point.y} r="4" fill={line.color} />
                  <text x={point.x} y={point.y - 12} textAnchor="middle" className="fill-brand-blue text-[10px] font-bold">{point.value}</text>
                </g>
              ))}
            </g>
          );
        })}
        {labels.map((label, index) => (
          <text key={label} x={46 + (index / Math.max(1, labels.length - 1)) * (width - 82)} y={height - 8} textAnchor="middle" className="fill-brand-muted text-[10px] font-medium">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function DonutWithLegend({ center, items, label }: { center: string; items: Array<[string, string, string]>; label: string }) {
  const colors: Record<string, string> = { blue: "#3B82F6", green: "#35B85E", purple: "#7C5CFF", orange: "#FF8A1F", red: "#EF4444", yellow: "#FBBF24" };
  const gradient = items.map((item, index) => `${colors[item[2]]} ${index * (100 / items.length)}% ${(index + 1) * (100 / items.length)}%`).join(", ");
  return (
    <div className="grid grid-cols-[190px_1fr] items-center gap-5 max-sm:grid-cols-1">
      <div className="relative mx-auto grid size-[180px] place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="grid size-[98px] place-items-center rounded-full bg-white text-center shadow-panel">
          <span className="text-xs font-medium text-brand-muted">Tổng</span>
          <strong className="-mt-2 text-xl font-bold text-brand-navy">{center}</strong>
          {label ? <small className="-mt-2 text-xs text-brand-muted">{label}</small> : null}
        </div>
      </div>
      <div className="grid gap-3">
        {items.map(([name, value, tone]) => (
          <div className="grid grid-cols-[14px_1fr_auto] items-center gap-3 text-sm" key={name}>
            <span className="size-3 rounded-full" style={{ backgroundColor: colors[tone] }} />
            <span className="font-medium text-brand-navy">{name}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-brand-muted">
          <tr>
            {headers.map((header) => (
              <th className="border-y border-brand-line px-4 py-3 font-semibold" key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="border-b border-brand-line" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="px-4 py-3 font-medium text-brand-navy" key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DateRange() {
  return (
    <Button variant="outline" className="h-11 min-w-[260px] justify-between text-brand-navy">
      <CalendarDays size={18} />
      01/05/2024 - 31/05/2024
      <ChevronDown size={16} />
    </Button>
  );
}

function MiniSelect({ label }: { label: string }) {
  return (
    <button className="inline-flex h-9 items-center gap-2 rounded-md border border-brand-line bg-white px-4 text-xs font-semibold text-brand-navy" type="button">
      {label}
      <ChevronDown size={14} />
    </button>
  );
}

function Toolbar({ button, fields }: { button?: string; fields: string[] }) {
  return (
    <div className="mb-4 grid grid-cols-[1fr_170px_auto] gap-3 max-lg:grid-cols-1">
      {fields.map((field, index) => index === 0 ? <Input key={field} placeholder={field} /> : <SelectBox key={field} label={field} />)}
      {button ? <Button className="h-10"><Plus size={16} /> {button}</Button> : null}
    </div>
  );
}

function SelectBox({ label }: { label: string }) {
  return (
    <button className="flex h-10 items-center justify-between rounded-md border border-brand-line bg-white px-4 text-sm font-medium text-brand-muted" type="button">
      {label}
      <ChevronDown size={16} />
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    ["Hoạt động", "Đang hoạt động", "Hoàn thành", "Hợp lệ", "Đã thanh toán", "Thành công"].includes(status)
      ? "green"
      : ["Đang thực hiện", "Super Admin", "Admin"].includes(status)
        ? "blue"
        : ["Tạm dừng", "Chờ duyệt", "Chờ thanh toán", "Không hoạt động"].includes(status)
          ? "orange"
          : ["Bị khóa", "Lỗi định dạng", "Quá hạn", "Thất bại"].includes(status)
            ? "red"
            : "purple";
  return <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold", toneStyles[tone].soft)}><span className="size-1.5 rounded-full bg-current" />{status}</span>;
}

function Tag({ children, tone }: { children: ReactNode; tone: Tone }) {
  return <span className={cn("inline-flex rounded-md px-2.5 py-1 text-xs font-semibold", toneStyles[tone].soft)}>{children}</span>;
}

function IconButton({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <button className="grid size-8 place-items-center rounded-md border border-brand-line bg-white text-brand-navy" type="button">
      <Icon size={16} />
    </button>
  );
}

function ActionGroup() {
  return (
    <span className="inline-flex items-center gap-2">
      <IconButton icon={Eye} />
      <IconButton icon={Edit3} />
      <IconButton icon={MoreVertical} />
    </span>
  );
}

function FileActions({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <IconButton icon={Eye} />
      {status === "Chờ duyệt" ? <IconButton icon={CheckCircle2} /> : <IconButton icon={Download} />}
      {status === "Chờ duyệt" ? <IconButton icon={XCircle} /> : null}
      <IconButton icon={MoreHorizontal} />
    </span>
  );
}

function AvatarText({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <AdminAvatar small />
      <span>{name}</span>
    </span>
  );
}

function AdminAvatar({ small }: { small?: boolean }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-100 to-blue-200", small ? "size-7" : "size-11")}>
      <span className={cn("rounded-full bg-[linear-gradient(#26476e_0_38%,#f4c3a4_39%_57%,#1f6ed4_58%)]", small ? "size-6" : "size-10")} />
    </span>
  );
}

function RoleCell({ desc, title }: { desc: string; title: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-md bg-blue-50 text-brand-blue"><UserCog size={18} /></span>
      <span>
        <strong className="block">{title}</strong>
        <small className="text-brand-muted">{desc}</small>
      </span>
    </span>
  );
}

function Pagination({ pages = ["1", "2", "3", "4", "5"], text }: { pages?: string[]; text: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-brand-line px-2 py-3 text-sm font-medium text-brand-muted max-sm:flex-col">
      <span>{text}</span>
      <div className="inline-flex items-center gap-2">
        <IconButton icon={ChevronLeft} />
        {pages.map((page) => <button className={cn("grid h-9 min-w-9 place-items-center rounded-md border border-brand-line px-2 font-bold", page === "1" ? "bg-brand-blue text-white" : "bg-white text-brand-navy")} key={page} type="button">{page}</button>)}
        <IconButton icon={ChevronRight} />
      </div>
    </div>
  );
}

function PermissionMatrix() {
  const roles = ["Super Admin", "Admin", "Quản trị viên", "Kỹ sư", "Nhà phân tích", "Khách hàng", "Viewer"];
  const features = ["Xem dashboard", "Quản lý người dùng", "Phê duyệt upload", "Xem báo cáo", "Quản lý thanh toán", "Cài đặt hệ thống"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-brand-line px-3 py-3 text-left">Tính năng / Vai trò</th>
            {roles.map((role) => <th className="border border-brand-line px-3 py-3" key={role}>{role}</th>)}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, rowIndex) => (
            <tr key={feature}>
              <td className="border border-brand-line px-3 py-3 font-semibold">{feature}</td>
              {roles.map((role, colIndex) => {
                const yes = colIndex < 3 || rowIndex === 0 || (rowIndex === 3 && colIndex < 6);
                const partial = !yes && colIndex === 3 && [2, 3].includes(rowIndex);
                return (
                  <td className="border border-brand-line px-3 py-3 text-center" key={role}>
                    {partial ? <span className="mx-auto block h-5 w-9 rounded-full bg-brand-blue" /> : yes ? <CheckCircle2 className="mx-auto text-brand-green" size={19} /> : <span className="mx-auto grid size-5 place-items-center rounded-full bg-slate-300 text-white">-</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleForm() {
  return (
    <div className="grid gap-4">
      <FormField label="Tên vai trò *"><Input placeholder="Nhập tên vai trò" /></FormField>
      <FormField label="Mô tả"><textarea className="min-h-[98px] rounded-md border border-brand-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/20" placeholder="Nhập mô tả vai trò" /></FormField>
      <FormField label="Dựa trên vai trò"><SelectBox label="Chọn vai trò gốc (tuỳ chọn)" /></FormField>
      <FormField label="Trạng thái"><SelectBox label="Đang hoạt động" /></FormField>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="outline">Hủy</Button>
        <Button>Lưu thay đổi</Button>
      </div>
    </div>
  );
}

function FormField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-brand-navy">
      {label}
      {children}
    </label>
  );
}

function SettingsTabs() {
  const tabs = ["Thông tin nền tảng", "Cấu hình email / SMPP", "Bảo mật & đăng nhập", "Giới hạn upload", "Tích hợp API", "Branding giao diện", "Sao lưu dữ liệu", "Nhật ký hệ thống"];
  return (
    <Card className="grid grid-cols-4 overflow-hidden rounded-xl bg-white shadow-panel max-xl:grid-cols-2 max-sm:grid-cols-1">
      {tabs.map((tab, index) => (
        <button className={cn("flex h-14 items-center justify-center gap-2 border-b border-brand-line text-sm font-semibold", index === 0 ? "border-b-2 border-brand-blue text-brand-blue" : "text-brand-muted")} key={tab} type="button">
          <Settings size={17} />
          {tab}
        </button>
      ))}
    </Card>
  );
}

function SettingsForm() {
  const fields = ["Tên nền tảng", "Tên hiển thị", "Mô tả", "Ngôn ngữ mặc định", "Múi giờ", "Định dạng ngày", "Định dạng số", "Đơn vị tiền tệ"];
  return (
    <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
      {fields.map((field) => <FormField key={field} label={field}><Input defaultValue={field === "Tên nền tảng" ? "EnergyInsight" : field === "Tên hiển thị" ? "EnergyInsight Admin Portal" : ""} placeholder={field} /></FormField>)}
      <div className="col-span-2 flex justify-end max-lg:col-span-1"><Button>Lưu cấu hình</Button></div>
    </div>
  );
}

function ConfigCard({ sms, title, toggle }: { sms?: boolean; title: string; toggle: string }) {
  return (
    <Panel title={title} action={<span className="inline-flex items-center gap-2 text-sm font-semibold">{toggle}<span className="block h-5 w-10 rounded-full bg-brand-blue" /></span>}>
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {["Nhà cung cấp", sms ? "SMPP Host" : "Host (SMTP)", "Port", "Bảo mật", "Tên đăng nhập", "Mật khẩu"].map((field) => (
          <FormField key={field} label={field}><Input placeholder={field} defaultValue={field === "Port" ? (sms ? "2775" : "587") : ""} /></FormField>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <Button variant="secondary">Kiểm tra kết nối</Button>
        <Button>Lưu cấu hình</Button>
      </div>
    </Panel>
  );
}

function ServiceStatus() {
  const services = ["Web Server", "Database", "Email Service", "SMPP Service", "File Storage", "Backup Service"];
  return (
    <Panel title="Trạng thái dịch vụ">
      <div className="grid gap-4">
        {services.map((service) => <div className="flex items-center justify-between text-sm" key={service}><span className="font-semibold">{service}</span><span className="font-semibold text-brand-green">• Hoạt động</span></div>)}
      </div>
      <PanelLink label="Xem chi tiết hệ thống" />
    </Panel>
  );
}

function VersionPanel() {
  return (
    <Panel title="Phiên bản hệ thống">
      <InfoRow label="Phiên bản hiện tại" value="v2.4.1" />
      <InfoRow label="Môi trường" value="Production" green />
      <InfoRow label="Cập nhật lần cuối" value="01/05/2024 08:30" />
      <PanelLink label="Kiểm tra cập nhật mới" />
    </Panel>
  );
}

function BackupPanel() {
  return (
    <Panel title="Backup & Dung lượng">
      <InfoRow label="Lần backup gần nhất" value="01/05/2024 02:00" green />
      <InfoRow label="Lần backup thành công" value="01/05/2024 02:00" />
      <InfoRow label="Dung lượng đã dùng" value="268.4 GB / 500 GB" />
      <div className="mt-3 h-2 rounded-full bg-slate-100"><span className="block h-full w-[54%] rounded-full bg-brand-blue" /></div>
      <PanelLink label="Quản lý backup & lưu trữ" />
    </Panel>
  );
}

function InfoRow({ green, label, value }: { green?: boolean; label: string; value: string }) {
  return <div className="mb-3 flex justify-between gap-3 text-sm"><span className="text-brand-muted">{label}</span><strong className={green ? "text-brand-green" : "text-brand-navy"}>{value}</strong></div>;
}

function ProjectToolbar() {
  return (
    <div className="mb-4 grid grid-cols-[140px_140px_240px_140px_1fr_auto_auto] gap-3 max-2xl:grid-cols-4 max-lg:grid-cols-1">
      <SelectBox label="Tất cả" />
      <SelectBox label="Tất cả" />
      <Button variant="outline" className="justify-start"><CalendarDays size={17} /> 01/05/2024 - 31/05/2024</Button>
      <SelectBox label="Tất cả công ty" />
      <Input placeholder="Tìm kiếm mã dự án, tên dự án, khách hàng..." />
      <Button variant="secondary"><Download size={17} /> Xuất danh sách</Button>
      <Button><Plus size={17} /> Tạo dự án hộ</Button>
    </div>
  );
}

function FileFilters() {
  return (
    <div className="grid grid-cols-[1fr_repeat(4,220px)] gap-4 max-2xl:grid-cols-3 max-lg:grid-cols-1">
      <Input placeholder="Tìm kiếm file..." />
      {["Loại file", "Định dạng", "Người dùng", "Công ty"].map((field) => <FormField key={field} label={field}><SelectBox label="Tất cả" /></FormField>)}
      <Button variant="outline">Đặt lại</Button>
      <Button><SlidersHorizontal size={17} /> Lọc</Button>
    </div>
  );
}

function FileName({ name, type }: { name: string; type: string }) {
  const iconTone = type === "PDF" ? "red" : type === "ZIP" ? "purple" : "green";
  return <span className="inline-flex items-center gap-2"><span className={cn("grid size-7 place-items-center rounded", toneStyles[iconTone].soft)}><FileText size={15} /></span>{name}</span>;
}

function RecentUploads() {
  return (
    <Panel title="Hoạt động tải lên gần đây" action={<MiniSelect label="Xem tất cả" />}>
      <div className="grid gap-4">
        {files.slice(0, 5).map((file, index) => (
          <div className="grid grid-cols-[34px_1fr_auto] gap-3 text-sm" key={file[0]}>
            <span className={cn("grid size-8 place-items-center rounded", toneStyles[index % 2 ? "red" : "green"].soft)}><FileText size={17} /></span>
            <span><strong className="block truncate">{file[0]}</strong><small className="text-brand-muted">{file[3]} • {file[4]}</small></span>
            <CheckCircle2 className={index < 2 ? "text-brand-green" : "text-orange-500"} size={17} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StorageByCompany() {
  return (
    <Panel title="Dung lượng lưu trữ theo công ty" action={<MiniSelect label="Xem chi tiết" />}>
      <RankBars rows={[["EVN HCMC", "62.4 GB", 60], ["PV Power", "48.7 GB", 48], ["EVN HANOI", "36.3 GB", 36], ["REE Power", "28.6 GB", 28], ["EVNGENCO 3", "23.9 GB", 24], ["Khác", "68.5 GB", 66]]} />
    </Panel>
  );
}

function BillingActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <DateRange />
      <Button><Plus size={17} /> Tạo gói mới</Button>
      <Button variant="secondary"><Download size={17} /> Xuất hóa đơn</Button>
      <Button variant="outline"><Bell size={17} /> Nhắc thanh toán</Button>
    </div>
  );
}

function PlanGrid() {
  const plans = [
    ["Free Trial", "0 đ", "Dùng thử đầy đủ tính năng trong 14 ngày.", "37"],
    ["Starter", "199.000 đ", "Phù hợp cho cá nhân và đội nhóm nhỏ.", "64"],
    ["Professional", "599.000 đ", "Dành cho doanh nghiệp vừa và nhỏ.", "41"],
    ["Enterprise", "Liên hệ", "Giải pháp toàn diện cho doanh nghiệp lớn.", "14"]
  ];
  return (
    <div className="grid grid-cols-4 gap-4 max-2xl:grid-cols-2 max-lg:grid-cols-1">
      {plans.map(([name, price, desc, usersCount], index) => (
        <Card className="rounded-xl p-5 shadow-none" key={name}>
          <div className="grid grid-cols-[48px_1fr_auto] gap-3">
            <span className={cn("grid size-12 place-items-center rounded-full", toneStyles[(["green", "blue", "purple", "yellow"] as Tone[])[index]].soft)}><Zap size={24} /></span>
            <span><strong className="block">{name}</strong><small className="text-brand-muted">{desc}</small></span>
            <strong className="text-2xl">{price}</strong>
          </div>
          <ul className="mt-4 grid gap-2 text-sm font-medium text-brand-navy">
            {["Tối đa người dùng", "Tối đa dự án", "Lưu trữ dữ liệu", "Báo cáo cơ bản"].map((item) => <li className="flex items-center gap-2" key={item}><CheckCircle2 className="text-brand-green" size={15} /> {item}</li>)}
          </ul>
          <div className="mt-4 border-t border-brand-line pt-3 text-sm text-brand-muted">Khách hàng đang dùng: <strong className="text-brand-navy">{usersCount}</strong></div>
        </Card>
      ))}
    </div>
  );
}

function BillingToolbar() {
  return (
    <div className="mb-3 grid grid-cols-[1fr_190px_190px_240px_1fr] gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
      <span />
      <SelectBox label="Tất cả gói" />
      <SelectBox label="Tất cả trạng thái" />
      <Button variant="outline"><CalendarDays size={17} /> 01/05/2024 - 31/05/2024</Button>
      <Input placeholder="Tìm kiếm khách hàng..." />
    </div>
  );
}

function CustomerCell({ email, initials, name }: { email: string; initials: string; name: string }) {
  return <span className="inline-flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-blue-50 text-xs font-bold text-brand-blue">{initials}</span><span><strong className="block">{name}</strong><small className="text-brand-muted">{email}</small></span></span>;
}

function UserToolbar() {
  return (
    <div className="mb-4 grid grid-cols-[1fr_180px_180px_180px_auto_auto] gap-3 max-xl:grid-cols-3 max-lg:grid-cols-1">
      <Input placeholder="Tìm kiếm theo tên, email hoặc công ty..." />
      <SelectBox label="Vai trò: Tất cả" />
      <SelectBox label="Trạng thái: Tất cả" />
      <SelectBox label="Công ty: Tất cả" />
      <Button variant="secondary"><Download size={17} /> Xuất Excel</Button>
      <Button><Plus size={17} /> Thêm người dùng</Button>
    </div>
  );
}

function ReportsCenter() {
  const reports = [
    ["Báo cáo sử dụng", "Báo cáo chi tiết về mức sử dụng hệ thống", "01/05/2024 08:30"],
    ["Báo cáo tăng trưởng người dùng", "Báo cáo tăng trưởng và hoạt động người dùng", "01/05/2024 07:45"],
    ["Báo cáo dung lượng lưu trữ", "Báo cáo chi tiết dung lượng và xu hướng lưu trữ file", "01/05/2024 07:15"],
    ["Báo cáo upload lỗi", "Báo cáo các file upload lỗi và thất bại", "01/05/2024 06:20"]
  ];
  return (
    <Panel title="Trung tâm báo cáo" action={<div className="flex gap-3"><MiniSelect label="Tất cả" /><Button size="sm"><Plus size={16} /> Tạo báo cáo</Button></div>}>
      <SimpleTable headers={["Loại báo cáo", "Mô tả", "Lần tạo gần nhất", "Trạng thái", "Hành động"]} rows={reports.map((row, index) => [
        <span key={row[0]} className="inline-flex items-center gap-3"><span className={cn("grid size-10 place-items-center rounded-full", toneStyles[(["blue", "green", "purple", "orange"] as Tone[])[index]].icon)}><FileBarChart size={20} /></span>{row[0]}</span>,
        row[1],
        row[2],
        <StatusPill key="status" status="Hoàn tất" />,
        <Button key="download" variant="secondary" size="sm"><Download size={15} /> Tải xuống</Button>
      ])} />
      <PanelLink label="Xem tất cả báo cáo" />
    </Panel>
  );
}

function ActivityLog() {
  return (
    <Panel title="Nhật ký hoạt động" action={<div className="flex gap-2"><MiniSelect label="7 ngày qua" /><MiniSelect label="Tất cả" /><Button variant="secondary" size="sm"><Download size={15} /> Xuất Excel</Button></div>}>
      <SimpleTable headers={["Thời gian", "Người thực hiện", "Hành động", "Đối tượng", "Kết quả", "IP/Thiết bị"]} rows={activityRows.map((row) => [
        row[0],
        <AvatarText key={row[1]} name={row[1]} />,
        row[2],
        row[3],
        <StatusPill key={row[4]} status={row[4]} />,
        row[5]
      ])} />
      <PanelLink label="Xem tất cả hoạt động" />
    </Panel>
  );
}

function SecurityEvents() {
  return (
    <Panel title="Sự kiện bảo mật" action={<MiniSelect label="7 ngày qua" />}>
      {[
        ["Đăng nhập thất bại", "Có 27 lần đăng nhập thất bại từ 8 địa chỉ IP", "27", "red"],
        ["Truy cập từ IP lạ", "Phát hiện 15 lượt truy cập từ IP chưa từng sử dụng", "15", "yellow"],
        ["Thay đổi cài đặt quan trọng", "Có 8 thay đổi cài đặt hệ thống và phân quyền", "8", "blue"]
      ].map(([title, desc, count, tone]) => (
        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-brand-line py-3" key={title}>
          <span className={cn("grid size-9 place-items-center rounded-full", toneStyles[tone as Tone].soft)}><AlertTriangle size={18} /></span>
          <span><strong className="block">{title}</strong><small className="text-brand-muted">{desc}</small></span>
          <strong className="text-xl">{count}</strong>
        </div>
      ))}
      <PanelLink label="Xem tất cả sự kiện bảo mật" />
    </Panel>
  );
}

function TopUsagePanel() {
  return (
    <Panel title="Top công ty theo mức sử dụng (lưu trữ)" action={<MiniSelect label="Theo dung lượng" />}>
      <RankBars rows={[["Công ty TNHH Năng lượng Xanh", "2.45 TB", 88], ["EV Power JSC", "1.98 TB", 68], ["SolarTech Việt Nam", "1.35 TB", 50], ["GreenFuture Co., Ltd", "1.02 TB", 38], ["Bắc Nam Energy", "0.88 TB", 32]]} />
      <PanelLink label="Xem tất cả báo cáo sử dụng" />
    </Panel>
  );
}

function RecentSystemPanel() {
  return (
    <Panel title="Hoạt động hệ thống gần đây">
      <div className="grid gap-3">
        {["Người dùng mới được tạo: lê.thi.hang@evpower.vn", "Dự án “Nhà máy điện mặt trời Phú Yên” đã được tạo", "File bao-cao-2024-q2.xlsx được upload", "Vai trò Kỹ sư đã được cập nhật", "Người dùng pham.minh.tuan@xyz.com bị vô hiệu hóa"].map((item, index) => (
          <div className="grid grid-cols-[34px_1fr_auto] items-center gap-3 text-sm" key={item}>
            <span className={cn("grid size-8 place-items-center rounded-full", toneStyles[(["green", "blue", "purple", "orange", "red"] as Tone[])[index]].soft)}><Bell size={16} /></span>
            <span><strong className="block font-semibold">{item}</strong><small className="text-brand-muted">Bởi Nguyễn Văn Admin</small></span>
            <small className="text-brand-muted">{index + 2} phút trước</small>
          </div>
        ))}
      </div>
      <PanelLink label="Xem tất cả hoạt động" />
    </Panel>
  );
}

function QuickStatusPanel() {
  return (
    <Panel title="Trạng thái nhanh">
      <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
        {[
          ["Uploads hôm nay", "268.4 GB", "Mục tiêu: 500 GB / ngày", "blue"],
          ["Jobs thất bại", "7", "Xem chi tiết", "red"],
          ["Gói đang hoạt động", "156", "Quản lý gói", "green"]
        ].map(([title, value, desc, tone]) => (
          <Card className="rounded-lg p-5 shadow-none" key={title}>
            <CloudUpload className={toneStyles[tone as Tone].text} size={38} />
            <span className="mt-4 block text-sm text-brand-muted">{title}</span>
            <strong className="mt-2 block text-2xl">{value}</strong>
            <small className={cn("mt-3 block font-semibold", toneStyles[tone as Tone].text)}>{desc}</small>
          </Card>
        ))}
      </div>
    </Panel>
  );
}

function RankBars({ rows }: { rows: Array<[string, string, number]> }) {
  return (
    <div className="grid gap-4">
      {rows.map(([name, value, percent], index) => (
        <div className="grid grid-cols-[1fr_180px_70px] items-center gap-4 text-sm max-sm:grid-cols-1" key={name}>
          <span className="font-medium text-brand-navy"><span className="mr-3 inline-grid size-6 place-items-center rounded bg-slate-100 text-xs">{index + 1}</span>{name}</span>
          <span className="h-2 rounded-full bg-slate-100"><span className="block h-full rounded-full bg-brand-blue" style={{ width: `${percent}%` }} /></span>
          <strong className="text-right text-brand-muted">{value}</strong>
        </div>
      ))}
    </div>
  );
}

function PanelLink({ label }: { label: string }) {
  return (
    <Link className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-brand-blue" href="/admin/reports">
      {label}
      <ChevronRight size={16} />
    </Link>
  );
}

function UpdatedAt({ label = "Dữ liệu được cập nhật lần cuối: 31/05/2024 10:30" }: { label?: string }) {
  return <div className="pb-2 text-center text-sm font-medium text-brand-muted">{label} <RefreshCw className="inline" size={14} /></div>;
}
