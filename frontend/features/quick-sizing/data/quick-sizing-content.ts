import {
  BatteryCharging,
  CalendarClock,
  Clock3,
  Coins,
  Factory,
  Info,
  Layers,
  ShieldCheck,
  Sun,
  TrendingDown,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const stepperItems = [
  { number: "1", title: "Bước 1", description: "Thông tin cơ bản", active: true },
  { number: "2", title: "Bước 2", description: "Giả định", active: false },
  { number: "3", title: "Bước 3", description: "Kết quả", active: false }
];

export const bessGoals: Array<{ title: string; description: string; icon: LucideIcon; selected?: boolean }> = [
  {
    title: "Tiết kiệm điện",
    description: "Lưu trữ khi giá thấp, xả khi giá cao để giảm chi phí điện.",
    icon: Zap,
    selected: true
  },
  {
    title: "Cắt đỉnh",
    description: "Giảm đỉnh công suất, tối ưu phí công suất.",
    icon: TrendingDown
  },
  {
    title: "Dự phòng",
    description: "Đảm bảo vận hành liên tục khi mất điện lưới.",
    icon: ShieldCheck
  },
  {
    title: "Tối ưu PV",
    description: "Tận dụng tối đa điện mặt trời, giảm phát ngược lưới.",
    icon: Sun
  }
];

export const assumptions: Array<{ label: string; value: string; icon: LucideIcon }> = [
  { label: "Độ sâu xả (DoD)", value: "90%", icon: ShieldCheck },
  { label: "Hiệu suất vòng (RTE)", value: "90%", icon: BatteryCharging },
  { label: "Suy hao pin", value: "2%/năm", icon: TrendingDown },
  { label: "Chi phí vận hành (O&M)", value: "2% CAPEX/năm", icon: Coins },
  { label: "Tăng giá điện", value: "3%/năm", icon: Zap },
  { label: "Số chu kỳ/ngày", value: "1 chu kỳ", icon: Clock3 }
];

export const tariffRows = [
  { label: "Thấp điểm", value: "1.728" },
  { label: "Bình thường", value: "2.666" },
  { label: "Cao điểm", value: "4.587" }
];

export const formFields = [
  { label: "Ngành nhà máy", placeholder: "Chọn ngành nhà máy", icon: Factory, type: "select" },
  { label: "Quy mô nhà máy", placeholder: "Nhập quy mô", suffix: "kVA", icon: Layers, type: "input" },
  { label: "Tiền điện trung bình tháng (VNĐ)", placeholder: "Nhập số tiền", suffix: "VNĐ", icon: Coins, type: "input" },
  { label: "Cấp điện áp", placeholder: "Chọn cấp điện áp", icon: Zap, type: "select" },
  { label: "Giờ hoạt động mỗi ngày", placeholder: "Nhập số giờ", suffix: "giờ", icon: CalendarClock, type: "input" }
];

export const infoIcon = Info;
