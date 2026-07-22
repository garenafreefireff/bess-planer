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
    title: "Dễ triển khai & kiểm soát",
    text: "Giao diện trực quan, dữ liệu đầu vào rõ ràng và kết quả có thể truy vết."
  }
];

export const trustBadges: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  { title: "Dữ liệu tin cậy", detail: "Đa nguồn, kiểm chứng", icon: DatabaseZap },
  { title: "Phân tích chuyên sâu", detail: "Tối ưu theo thực tế", icon: BarChart3 },
  { title: "Chi phí minh bạch", detail: "TCO & hiệu quả đầu tư", icon: BadgeDollarSign },
  { title: "Bảo mật doanh nghiệp", detail: "An toàn & đáng tin cậy", icon: ShieldCheck }
];

export const heroMetrics: Array<{ icon: LucideIcon; title: string; value: string; tone: "green" | "blue" }> = [
  { icon: CircleDollarSign, title: "Tiềm năng tiết kiệm", value: "Theo từng kịch bản", tone: "green" },
  { icon: TrendingUp, title: "Giảm công suất đỉnh", value: "Tối ưu phụ tải", tone: "blue" },
  { icon: ShieldCheck, title: "Đánh giá đầu tư", value: "IRR • NPV • Payback", tone: "green" }
];

export const quickToolItems = ["Kết quả trong 2 - 5 phút", "Phù hợp giai đoạn đánh giá sơ bộ", "Ít dữ liệu đầu vào, dễ sử dụng"];

export const plannerToolItems = [
  "Mô phỏng theo dữ liệu thực tế",
  "Tối ưu cấu hình & vận hành chuyên sâu",
  "Báo cáo phục vụ thẩm định và ra quyết định"
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

export const industrySegments = [
  "Nhà máy sản xuất",
  "Khu công nghiệp",
  "Điện mặt trời mái nhà",
  "Trung tâm dữ liệu",
  "Tòa nhà thương mại"
];

export const heroPrimaryIcon = Zap;
export const heroSecondaryIcon = CalendarDays;
