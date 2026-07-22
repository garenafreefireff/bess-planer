import {
  BatteryCharging,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Factory,
  Gauge,
  HelpCircle,
  LineChart,
  PlugZap,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TrendingDown,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const QUICK_SIZING_DRAFT_KEY = "energyinsight.quickSizing.step1.v1";

export const industryOptions = [
  "Dệt may",
  "Thép và kim loại",
  "Nhựa và bao bì",
  "Thực phẩm và đồ uống",
  "Điện tử",
  "Kho lạnh",
  "Logistics",
  "Khu công nghiệp",
  "Tòa nhà thương mại",
  "Năng lượng",
  "Khác"
];

export const estimatedLoadRangeOptions = [
  "Dưới 500 kW",
  "500 kW – 1 MW",
  "1 MW – 5 MW",
  "5 MW – 10 MW",
  "Trên 10 MW",
  "Chưa xác định"
];

export const voltageLevelOptions = ["Hạ áp", "Trung áp", "Cao áp", "Chưa xác định"];

export const shiftPatternOptions = ["Giờ hành chính", "1 ca", "2 ca", "3 ca", "Hoạt động 24/7", "Không cố định"];

export const solarStatusOptions = [
  { value: "yes", label: "Có" },
  { value: "none", label: "Không" },
  { value: "planned", label: "Đang lên kế hoạch" },
  { value: "unknown", label: "Chưa xác định" }
] as const;

export const solarCapacityUnitOptions = ["kWp", "MWp"];
export const solarGenerationUnitOptions = ["kWh/tháng", "MWh/tháng"];

export const exportPolicyOptions = [
  "Không phát ngược lên lưới",
  "Có thể phát ngược lên lưới",
  "Hạn chế công suất phát ngược",
  "Chưa xác định"
];

export const solarObjectiveOptions = [
  "Tăng tỷ lệ tự dùng",
  "Giảm điện dư",
  "Dịch chuyển năng lượng sang giờ cao điểm",
  "Dự phòng khi mất điện"
];

export const bessObjectiveOptions: Array<{
  value: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "saving",
    title: "Tiết kiệm chi phí điện",
    description: "Sạc vào giờ giá thấp và xả vào giờ giá cao.",
    icon: Zap
  },
  {
    value: "peak_shaving",
    title: "Cắt giảm công suất đỉnh",
    description: "Giảm Pmax và chi phí công suất hoặc nhu cầu cực đại.",
    icon: TrendingDown
  },
  {
    value: "solar_optimization",
    title: "Tối ưu điện mặt trời",
    description: "Tăng tỷ lệ tự dùng và hạn chế điện dư.",
    icon: Sun
  },
  {
    value: "backup",
    title: "Dự phòng nguồn điện",
    description: "Duy trì các tải quan trọng khi mất điện.",
    icon: ShieldCheck
  },
  {
    value: "power_quality",
    title: "Cải thiện chất lượng điện",
    description: "Hỗ trợ ổn định công suất và vận hành hệ thống.",
    icon: PlugZap
  },
  {
    value: "investment",
    title: "Đánh giá cơ hội đầu tư",
    description: "Ước tính nhanh CAPEX, NPV, IRR và thời gian hoàn vốn.",
    icon: CircleDollarSign
  }
];

export const backupDurationOptions = [
  { label: "30 phút", value: 0.5 },
  { label: "1 giờ", value: 1 },
  { label: "2 giờ", value: 2 },
  { label: "4 giờ", value: 4 },
  { label: "8 giờ", value: 8 },
  { label: "Tùy chỉnh", value: -1 }
];

export const budgetRangeOptions = [
  "Chưa xác định",
  "Dưới 5 tỷ VNĐ",
  "5–10 tỷ VNĐ",
  "10–20 tỷ VNĐ",
  "20–50 tỷ VNĐ",
  "Trên 50 tỷ VNĐ",
  "Nhập ngân sách tùy chỉnh"
];

export const quickBillSuggestions = [
  { label: "100 triệu", value: 100_000_000 },
  { label: "500 triệu", value: 500_000_000 },
  { label: "1 tỷ", value: 1_000_000_000 },
  { label: "5 tỷ", value: 5_000_000_000 }
];

export const sampleQuickSizingStep1 = {
  industry: "Thực phẩm và đồ uống",
  customIndustry: "",
  estimatedLoadRange: "1 MW – 5 MW",
  monthlyElectricityBillVnd: 1_000_000_000,
  voltageLevel: "Trung áp",
  operatingHoursPerDay: 18,
  operatingDaysPerWeek: 6,
  shiftPattern: "2 ca",
  solarStatus: "yes",
  solarCapacityValue: 850,
  solarCapacityUnit: "kWp",
  solarMonthlyGenerationValue: 95_000,
  solarMonthlyGenerationUnit: "kWh/tháng",
  exportPolicy: "Hạn chế công suất phát ngược",
  solarObjectives: ["Tăng tỷ lệ tự dùng", "Dịch chuyển năng lượng sang giờ cao điểm"],
  bessObjectives: ["saving", "peak_shaving", "solar_optimization"],
  backupCriticalLoadPercent: 30,
  backupDurationHours: 1,
  estimatedPeakDemandKw: 1800,
  targetPeakReductionType: "percent",
  targetPeakReductionValue: 15,
  budgetRange: "10–20 tỷ VNĐ",
  customBudgetVnd: null
};

export const supportSteps = [
  { icon: Factory, title: "Tạo hồ sơ phụ tải sơ bộ" },
  { icon: SlidersHorizontal, title: "Sinh bộ giả định kỹ thuật và tài chính" },
  { icon: BatteryCharging, title: "Đề xuất cấu hình BESS ban đầu" }
];

export const summaryIcons = {
  industry: BriefcaseBusiness,
  estimatedLoadRange: Gauge,
  monthlyElectricityBillVnd: CircleDollarSign,
  solarStatus: Sun,
  bessObjectives: LineChart,
  budgetRange: Building2,
  fallback: HelpCircle
};
