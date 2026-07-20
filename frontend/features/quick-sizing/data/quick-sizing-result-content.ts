import {
  BatteryCharging,
  ChartNoAxesCombined,
  Clock3,
  Gauge,
  LineChart,
  Phone,
  Target,
  TimerReset,
  UserRound,
  Wallet,
  Building2,
  Mail,
  MapPin,
  ShieldCheck,
  Factory,
  Send,
  ArrowRight
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const resultMetrics: Array<{ label: string; value: string; unit?: string; icon: LucideIcon; tone: string }> = [
  { label: "Công suất BESS đề xuất", value: "500", unit: "kW", icon: BatteryCharging, tone: "blue" },
  { label: "Dung lượng BESS đề xuất", value: "1.000", unit: "kWh", icon: BatteryCharging, tone: "green" },
  { label: "Thời lượng hệ thống", value: "2,0", unit: "giờ", icon: Clock3, tone: "purple" },
  { label: "CAPEX ước tính", value: "11,2", unit: "tỷ VNĐ", icon: Wallet, tone: "orange" },
  { label: "Tiết kiệm điện/năm", value: "2,18", unit: "tỷ VNĐ/năm", icon: ChartNoAxesCombined, tone: "green" },
  { label: "Payback ước tính", value: "5,1", unit: "năm", icon: TimerReset, tone: "blue" },
  { label: "NPV (15 năm)", value: "18,7", unit: "tỷ VNĐ", icon: LineChart, tone: "purple" },
  { label: "IRR (ước tính)", value: "18,6", unit: "%", icon: Target, tone: "green" }
];

export const assumptionRows = [
  ["Giá điện bình quân (không VAT)", "2.380 VNĐ/kWh"],
  ["Chênh lệch giá sạc/xả (đỉnh - thấp điểm)", "1.680 VNĐ/kWh"],
  ["Chu kỳ sạc/xả mỗi ngày", "1,0 chu kỳ"],
  ["Hiệu suất hệ thống (round-trip)", "90 %"],
  ["Chi phí O&M", "2,0 % CAPEX/năm"],
  ["Tuổi thọ pin (chu kỳ)", "6.000 chu kỳ"],
  ["Thời gian phân tích", "15 năm"],
  ["Thuế TNDN", "20 %"],
  ["Các khoản phí & lệ phí", "Đã bao gồm"]
];

export const reportFields: Array<{ placeholder: string; icon: LucideIcon; type?: "select" | "input" }> = [
  { placeholder: "Họ tên *", icon: UserRound },
  { placeholder: "Công ty *", icon: Building2 },
  { placeholder: "Email công việc *", icon: Mail },
  { placeholder: "Số điện thoại *", icon: Phone },
  { placeholder: "Ngành nghề *", icon: Factory, type: "select" },
  { placeholder: "Tỉnh/Thành phố *", icon: MapPin, type: "select" }
];

export const reportSendIcon = Send;
export const plannerArrowIcon = ArrowRight;
export const plannerShieldIcon = ShieldCheck;
export const gaugeIcon = Gauge;
