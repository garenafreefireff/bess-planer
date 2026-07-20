import {
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ClipboardPenLine,
  DatabaseZap,
  Gauge,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const navItems = [
  { label: "Giới thiệu", href: "/" },
  { label: "So sánh công cụ", href: "/so-sanh-cong-cu" },
  { label: "Quick Sizing", href: "/quick-sizing" },
  { label: "BESS Planner", href: "/bess-planner" },
  { label: "Báo cáo mẫu", href: "/bao-cao-mau" },
  { label: "Liên hệ", href: "/lien-he" }
];

export const benefits: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Target,
    title: "Đánh giá nhanh & chính xác",
    text: "Ước tính tiềm năng chỉ trong vài phút với dữ liệu tin cậy."
  },
  {
    icon: BarChart3,
    title: "Phân tích chuyên sâu",
    text: "Mô phỏng theo dữ liệu thực tế, so sánh nhiều kịch bản linh hoạt."
  },
  {
    icon: CircleDollarSign,
    title: "Tối ưu hiệu quả đầu tư",
    text: "Tính toán TCO, IRR, thời gian hoàn vốn và giá trị vòng đời dự án."
  },
  {
    icon: ShieldCheck,
    title: "Dễ dàng & an toàn",
    text: "Giao diện trực quan, bảo mật cao cấp theo chuẩn doanh nghiệp."
  }
];

export const trustBadges: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  { title: "Dữ liệu tin cậy", detail: "Đa nguồn, kiểm chứng", icon: DatabaseZap },
  { title: "Phân tích chuyên sâu", detail: "Tối ưu theo thực tế", icon: BarChart3 },
  { title: "Chi phí minh bạch", detail: "TCO & hiệu quả đầu tư", icon: BadgeDollarSign },
  { title: "Bảo mật doanh nghiệp", detail: "An toàn & đáng tin cậy", icon: ShieldCheck }
];

export const heroMetrics: Array<{ icon: LucideIcon; title: string; value: string; tone: "green" | "blue" }> = [
  { icon: CircleDollarSign, title: "Giảm chi phí điện", value: "10 - 30%", tone: "green" },
  { icon: TrendingUp, title: "Tối ưu công suất", value: "Giảm đỉnh hiệu quả", tone: "blue" },
  { icon: ShieldCheck, title: "Đầu tư hiệu quả", value: "NPV - IRR - Payback", tone: "green" }
];

export const quickToolItems = ["Kết quả trong 2 - 5 phút", "Phù hợp giai đoạn đầu sơ bộ", "Miễn phí, dễ sử dụng"];

export const plannerToolItems = [
  "Mô phỏng theo dữ liệu thực tế",
  "Tối ưu cấu hình & vận hành chuyên sâu",
  "Báo cáo đầu tư cho vay & đấu thầu dự án"
];

export const workflowSteps: Array<{ number: string; icon: LucideIcon; title: string; text: string }> = [
  {
    number: "1",
    icon: ClipboardPenLine,
    title: "Nhập thông tin",
    text: "Nhập dữ liệu cơ bản về phụ tải, hóa đơn điện và hệ thống hiện tại."
  },
  {
    number: "2",
    icon: BarChart3,
    title: "Phân tích & tối ưu",
    text: "Công cụ phân tích nhanh hoặc phân tích chuyên sâu theo nhu cầu."
  },
  {
    number: "3",
    icon: Gauge,
    title: "Nhận kết quả & báo cáo",
    text: "Xem kết quả, tải báo cáo và lên lộ trình chuyển đổi tối ưu."
  }
];

export const logos = [
  "SOLARIS ENERGY",
  "GREEN POWER VIETNAM",
  "VIETTECH INDUSTRIES",
  "NEXUS ENERGY",
  "HORIZON INDUSTRIAL",
  "MEKONG SOLAR",
  "SUNTECH ENERGY",
  "DELTA INDUSTRIES",
  "PEAK ENERGY",
  "VICTORY INDUSTRIAL"
];

export const heroPrimaryIcon = Zap;
export const heroSecondaryIcon = CalendarDays;
