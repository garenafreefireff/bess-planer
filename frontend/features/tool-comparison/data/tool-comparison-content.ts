import {
  BarChart3,
  BatteryCharging,
  Blocks,
  ChartNoAxesCombined,
  CheckSquare,
  Clock3,
  DatabaseZap,
  FileText,
  Flag,
  Gauge,
  LockKeyhole,
  LogIn,
  PanelsTopLeft,
  ScanSearch,
  Sparkles,
  Sun,
  Target,
  UserRound,
  UsersRound,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ComparisonRow {
  criterion: string;
  quick: string;
  planner: string;
  icon: LucideIcon;
}

export const comparisonRows: ComparisonRow[] = [
  {
    criterion: "Mục tiêu sử dụng",
    quick: "Ước tính nhanh sơ bộ quy mô BESS và hiệu quả kinh tế",
    planner: "Phân tích chi tiết, tối ưu và lập kế hoạch đầu tư BESS",
    icon: Target
  },
  {
    criterion: "Đăng nhập",
    quick: "Không cần đăng nhập",
    planner: "Cần đăng nhập",
    icon: UserRound
  },
  {
    criterion: "Dữ liệu phụ tải",
    quick: "Không cần dữ liệu thực (nhập tay các thông số cơ bản)",
    planner: "Cần upload dữ liệu thực (phụ tải, hóa đơn điện, v.v.)",
    icon: DatabaseZap
  },
  {
    criterion: "Dữ liệu PV",
    quick: "Không cần dữ liệu thực (nhập tay thông số PV dự kiến)",
    planner: "Cần dữ liệu thực hoặc dự báo PV chính xác",
    icon: Sun
  },
  {
    criterion: "Thời gian thực hiện",
    quick: "Ước tính nhanh: 1 - 2 phút",
    planner: "Phân tích chuyên sâu: 10 - 30 phút",
    icon: Clock3
  },
  {
    criterion: "Độ chính xác",
    quick: "Ước tính nhanh, phù hợp giai đoạn sơ bộ",
    planner: "Mô hình khoa học, độ chính xác cao",
    icon: Gauge
  },
  {
    criterion: "Kết quả đầu ra",
    quick: "Quy mô BESS sơ bộ, lợi ích kinh tế ước tính, hoàn vốn đơn giản",
    planner: "Quy mô tối ưu, dòng tiền chi tiết, kịch bản, IRR, NPV, LCOE, v.v.",
    icon: ChartNoAxesCombined
  },
  {
    criterion: "Phù hợp giai đoạn nào",
    quick: "Khảo sát sơ bộ, đánh giá nhanh tiềm năng dự án, tạo lead",
    planner: "Thẩm định dự án, lập kế hoạch đầu tư và ra quyết định",
    icon: Flag
  },
  {
    criterion: "Xuất báo cáo",
    quick: "Báo cáo tóm tắt, biểu đồ trực quan",
    planner: "Báo cáo chi tiết, đầy đủ biểu đồ và phân tích",
    icon: FileText
  },
  {
    criterion: "Khả năng tối ưu theo dữ liệu thực",
    quick: "Không (dựa trên các giả định và thông số nhập tay)",
    planner: "Có - tối ưu theo dữ liệu thực và kịch bản",
    icon: Blocks
  },
  {
    criterion: "Ai nên dùng",
    quick: "Nhà phát triển dự án, tư vấn, sale, đối tác cần đánh giá nhanh",
    planner: "Chủ đầu tư, kỹ sư, tài chính, ban lãnh đạo ra quyết định đầu tư",
    icon: UsersRound
  }
];

export const processSteps = [
  {
    number: "1",
    icon: ScanSearch,
    title: "Khám phá & ước tính nhanh",
    text: "Dùng Quick Sizing để có cái nhìn tổng quan về tiềm năng và lợi ích sơ bộ."
  },
  {
    number: "2",
    icon: PanelsTopLeft,
    title: "Chọn công cụ phù hợp",
    text: "So sánh nhu cầu và chọn công cụ phù hợp với mục tiêu và giai đoạn dự án."
  },
  {
    number: "3",
    icon: BarChart3,
    title: "Nhận kết quả tin cậy",
    text: "Sử dụng BESS Planner để phân tích chi tiết, tối ưu và ra quyết định đầu tư hiệu quả."
  }
];

export const quickIcon = Zap;
export const plannerIcon = BatteryCharging;
export const quickLockIcon = LogIn;
export const plannerLockIcon = LockKeyhole;
export const quickBadgeIcon = Sparkles;
export const plannerBadgeIcon = CheckSquare;
