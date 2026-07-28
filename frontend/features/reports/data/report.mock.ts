import type {
  ReportAttentionItem,
  ReportItem,
  ReportKind,
  ReportStatus,
  ReportStatusFilter,
  ReportTypeCardData,
  ReportTypeFilter
} from "./report.types";

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  quick_sizing: "Quick Sizing",
  bess_planner: "BESS Planner"
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  ready: "Sẵn sàng",
  preliminary: "Báo cáo sơ bộ",
  warning: "Có cảnh báo",
  processing: "Đang xử lý",
  failed: "Không thành công"
};

export const REPORT_TYPE_FILTER_OPTIONS: Array<{ label: string; value: ReportTypeFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Quick Sizing", value: "quick_sizing" },
  { label: "BESS Planner", value: "bess_planner" }
];

export const REPORT_STATUS_FILTER_OPTIONS: Array<{ label: string; value: ReportStatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Sẵn sàng", value: "ready" },
  { label: "Báo cáo sơ bộ", value: "preliminary" },
  { label: "Có cảnh báo", value: "warning" },
  { label: "Đang xử lý", value: "processing" }
];

export const MOCK_REPORT_ITEMS: ReportItem[] = [
  {
    id: "report-bess-abc",
    projectId: "mock-project-abc",
    projectName: "Nhà máy sản xuất ABC",
    kind: "bess_planner",
    reportCode: "BESS-2026-001",
    updatedAt: "2026-07-27T09:30:00+07:00",
    engineVersion: "sizing-lab-oracle-lp-pf-v1",
    status: "ready",
    bessConfig: { energyKwh: 1000, powerKw: 500, label: "1.000 kWh / 500 kW" },
    primaryMetric: "15 phương án",
    secondaryMetric: "6 Pareto",
    details: ["Engine hiện hành", "Có khuyến nghị phương án", "Đã kiểm tra dữ liệu Load/PV"],
    resultHref: "/customer-portal/du-an-cua-toi/ket-qua?projectId=mock-project-abc",
    financials: {
      capex: "5,8 tỷ",
      annualSaving: "1,42 tỷ/năm",
      npv: "3,1 tỷ",
      payback: "4,2 năm"
    }
  },
  {
    id: "report-quick-solar-xyz",
    projectId: "quick-sizing-solar-xyz",
    projectName: "Nhà máy Solar XYZ",
    kind: "quick_sizing",
    reportCode: "QS-2026-128",
    updatedAt: "2026-07-26T15:10:00+07:00",
    engineVersion: "quick-sizing-step2-formulas-v1",
    status: "preliminary",
    bessConfig: { energyKwh: 750, powerKw: 300, label: "750 kWh / 300 kW" },
    primaryMetric: "NPV 3,8 tỷ",
    secondaryMetric: "Hoàn vốn 5,4 năm",
    details: ["Báo cáo tiền khả thi", "Dùng bộ giả định Quick Sizing", "Cần xác nhận dữ liệu giá điện"],
    resultHref: "/quick-sizing/ket-qua",
    financials: {
      capex: "4,2 tỷ",
      annualSaving: "780 triệu/năm",
      npv: "3,8 tỷ",
      payback: "5,4 năm"
    }
  },
  {
    id: "report-bess-cold-storage",
    projectId: "mock-project-cold-storage",
    projectName: "Kho lạnh Miền Nam",
    kind: "bess_planner",
    reportCode: "BESS-2026-014",
    updatedAt: "2026-07-24T11:45:00+07:00",
    engineVersion: "sizing-lab-oracle-lp-pf-v1",
    status: "warning",
    bessConfig: { energyKwh: 1500, powerKw: 600, label: "1.500 kWh / 600 kW" },
    primaryMetric: "Cảnh báo dữ liệu",
    secondaryMetric: "Thiếu 4 giờ Load",
    details: ["Cần kiểm tra chất lượng dữ liệu đầu vào", "Có khoảng trống trong dữ liệu EMS", "Chưa khóa phương án cuối"],
    resultHref: "/customer-portal/du-an-cua-toi/ket-qua?projectId=mock-project-cold-storage",
    financials: {
      capex: "8,6 tỷ",
      annualSaving: "1,9 tỷ/năm",
      npv: "2,4 tỷ",
      payback: "5,1 năm"
    }
  },
  {
    id: "report-bess-textile",
    projectId: "mock-project-textile",
    projectName: "Xưởng dệt Đông Bắc",
    kind: "bess_planner",
    reportCode: "BESS-2026-020",
    updatedAt: "2026-07-23T18:05:00+07:00",
    engineVersion: "sizing-lab-oracle-lp-pf-v1",
    status: "processing",
    bessConfig: { energyKwh: 1200, powerKw: 450, label: "1.200 kWh / 450 kW" },
    primaryMetric: "Đang dựng báo cáo",
    secondaryMetric: "72% hoàn tất",
    details: ["Đã tối ưu dispatch", "Đang tổng hợp chỉ số tài chính", "Báo cáo PDF chưa sẵn sàng"],
    resultHref: "/customer-portal/du-an-cua-toi/ket-qua?projectId=mock-project-textile"
  }
];

export const BASE_ATTENTION_ITEMS: ReportAttentionItem[] = [
  {
    id: "attention-data-quality",
    title: "Một báo cáo cần kiểm tra dữ liệu đầu vào",
    detail: "Kho lạnh Miền Nam có khoảng trống trong dữ liệu EMS trước khi khóa phương án.",
    actionLabel: "Mở cảnh báo",
    href: "/customer-portal/du-an-cua-toi/ket-qua?projectId=mock-project-cold-storage",
    tone: "amber"
  },
  {
    id: "attention-no-result",
    title: "Một dự án chưa có kết quả Sizing Lab",
    detail: "Hoàn tất upload Load/PV để hệ thống tạo báo cáo kỹ thuật.",
    actionLabel: "Tạo phân tích",
    href: "/customer-portal/du-an-cua-toi/tao-du-an",
    tone: "slate"
  },
  {
    id: "attention-processing",
    title: "Một báo cáo đang xử lý",
    detail: "Xưởng dệt Đông Bắc đang tổng hợp chỉ số tài chính và PDF.",
    actionLabel: "Theo dõi",
    href: "/customer-portal/du-an-cua-toi",
    tone: "blue"
  }
];

export const REPORT_TYPE_CARDS: ReportTypeCardData[] = [
  {
    id: "quick-sizing",
    title: "Quick Sizing",
    description: "Báo cáo tiền khả thi cho quy mô BESS, chi phí đầu tư và hiệu quả tài chính sơ bộ.",
    chips: ["CAPEX", "NPV", "IRR", "Dòng tiền"],
    href: "/quick-sizing",
    ctaLabel: "Mở Quick Sizing",
    tone: "blue"
  },
  {
    id: "bess-planner",
    title: "BESS Planner",
    description: "Báo cáo kỹ thuật từ dữ liệu Load/PV thực tế, so sánh phương án và khuyến nghị vận hành.",
    chips: ["Pareto", "Pmax", "Monthly Sizing", "Planning+"],
    href: "/customer-portal/du-an-cua-toi",
    ctaLabel: "Xem dự án",
    tone: "green"
  },
  {
    id: "sample-library",
    title: "Thư viện báo cáo mẫu",
    badge: "Mẫu tham khảo",
    description: "Bộ mẫu báo cáo để xem cấu trúc executive summary, technical report và phụ lục KPI.",
    chips: ["PDF", "Executive", "Finance", "KPI"],
    href: "/bao-cao-mau",
    ctaLabel: "Xem thư viện",
    tone: "violet"
  }
];
