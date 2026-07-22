import { z } from "zod";
import {
  budgetRangeOptions,
  estimatedLoadRangeOptions,
  exportPolicyOptions,
  industryOptions,
  shiftPatternOptions,
  solarCapacityUnitOptions,
  solarGenerationUnitOptions,
  voltageLevelOptions
} from "./quick-sizing-step1-config";

const optionalNonNegativeNumber = z.number().min(0, "Giá trị không được âm").nullable();

export const quickSizingStep1Schema = z
  .object({
    industry: z.string().min(1, "Vui lòng chọn ngành hoạt động").refine((value) => industryOptions.includes(value), "Ngành hoạt động không hợp lệ"),
    customIndustry: z.string().trim().optional().default(""),
    estimatedLoadRange: z
      .string()
      .min(1, "Vui lòng chọn quy mô phụ tải")
      .refine((value) => estimatedLoadRangeOptions.includes(value), "Quy mô phụ tải không hợp lệ"),
    monthlyElectricityBillVnd: z.number().nullable(),
    voltageLevel: z.string().min(1, "Vui lòng chọn cấp điện áp").refine((value) => voltageLevelOptions.includes(value), "Cấp điện áp không hợp lệ"),
    operatingHoursPerDay: z.number().nullable(),
    operatingDaysPerWeek: z.number().nullable(),
    shiftPattern: z.string().min(1, "Vui lòng chọn đặc điểm ca vận hành").refine((value) => shiftPatternOptions.includes(value), "Ca vận hành không hợp lệ"),
    solarStatus: z.enum(["yes", "none", "planned", "unknown"]),
    solarCapacityValue: optionalNonNegativeNumber,
    solarCapacityUnit: z.string().refine((value) => solarCapacityUnitOptions.includes(value), "Đơn vị công suất PV không hợp lệ"),
    solarMonthlyGenerationValue: optionalNonNegativeNumber,
    solarMonthlyGenerationUnit: z.string().refine((value) => solarGenerationUnitOptions.includes(value), "Đơn vị sản lượng PV không hợp lệ"),
    exportPolicy: z.string().optional().default("").refine((value) => !value || exportPolicyOptions.includes(value), "Cơ chế điện dư không hợp lệ"),
    solarObjectives: z.array(z.string()).default([]),
    bessObjectives: z.array(z.string()).min(1, "Vui lòng chọn ít nhất 1 mục tiêu").max(3, "Chỉ được chọn tối đa 3 mục tiêu"),
    backupCriticalLoadPercent: z.number().min(5, "Tối thiểu 5%").max(100, "Tối đa 100%").nullable(),
    backupDurationHours: z.number().nullable(),
    estimatedPeakDemandKw: optionalNonNegativeNumber,
    targetPeakReductionType: z.enum(["percent", "kw"]),
    targetPeakReductionValue: optionalNonNegativeNumber,
    budgetRange: z.string().refine((value) => budgetRangeOptions.includes(value), "Ngân sách không hợp lệ"),
    customBudgetVnd: optionalNonNegativeNumber
  })
  .superRefine((data, ctx) => {
    if (data.monthlyElectricityBillVnd === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["monthlyElectricityBillVnd"], message: "Vui lòng nhập tiền điện trung bình tháng" });
    } else if (data.monthlyElectricityBillVnd < 1_000_000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["monthlyElectricityBillVnd"], message: "Tiền điện tối thiểu là 1.000.000 VNĐ" });
    }

    if (data.operatingHoursPerDay === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["operatingHoursPerDay"], message: "Vui lòng nhập số giờ hoạt động" });
    } else if (data.operatingHoursPerDay < 1 || data.operatingHoursPerDay > 24) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["operatingHoursPerDay"], message: data.operatingHoursPerDay < 1 ? "Tối thiểu 1 giờ/ngày" : "Tối đa 24 giờ/ngày" });
    }

    if (data.operatingDaysPerWeek === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["operatingDaysPerWeek"], message: "Vui lòng nhập số ngày hoạt động" });
    } else if (data.operatingDaysPerWeek < 1 || data.operatingDaysPerWeek > 7) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["operatingDaysPerWeek"], message: data.operatingDaysPerWeek < 1 ? "Tối thiểu 1 ngày/tuần" : "Tối đa 7 ngày/tuần" });
    }

    if (data.industry === "Khác" && !data.customIndustry?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customIndustry"], message: "Vui lòng nhập ngành hoạt động" });
    }

    if (data.solarStatus === "yes" && (!data.solarCapacityValue || data.solarCapacityValue <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["solarCapacityValue"], message: "Vui lòng nhập công suất hệ thống điện mặt trời" });
    }

    if (data.bessObjectives.includes("backup")) {
      if (data.backupCriticalLoadPercent === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["backupCriticalLoadPercent"], message: "Vui lòng nhập tỷ lệ tải quan trọng" });
      }
      if (data.backupDurationHours === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["backupDurationHours"], message: "Vui lòng chọn thời gian dự phòng" });
      }
    }

    if (data.budgetRange === "Nhập ngân sách tùy chỉnh" && (!data.customBudgetVnd || data.customBudgetVnd <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customBudgetVnd"], message: "Vui lòng nhập ngân sách tùy chỉnh" });
    }
  });

export type QuickSizingStep1FormValues = z.infer<typeof quickSizingStep1Schema>;

export const defaultQuickSizingStep1Values: QuickSizingStep1FormValues = {
  industry: "",
  customIndustry: "",
  estimatedLoadRange: "",
  monthlyElectricityBillVnd: null,
  voltageLevel: "",
  operatingHoursPerDay: null,
  operatingDaysPerWeek: null,
  shiftPattern: "",
  solarStatus: "unknown",
  solarCapacityValue: null,
  solarCapacityUnit: "kWp",
  solarMonthlyGenerationValue: null,
  solarMonthlyGenerationUnit: "kWh/tháng",
  exportPolicy: "",
  solarObjectives: [],
  bessObjectives: [],
  backupCriticalLoadPercent: 30,
  backupDurationHours: 1,
  estimatedPeakDemandKw: null,
  targetPeakReductionType: "percent",
  targetPeakReductionValue: null,
  budgetRange: "Chưa xác định",
  customBudgetVnd: null
};

export function sanitizeQuickSizingStep1Payload(values: QuickSizingStep1FormValues) {
  const payload: Record<string, unknown> = { ...values };

  if (values.industry !== "Khác") {
    delete payload.customIndustry;
  }

  if (values.solarStatus === "none" || values.solarStatus === "unknown") {
    delete payload.solarCapacityValue;
    delete payload.solarCapacityUnit;
    delete payload.solarMonthlyGenerationValue;
    delete payload.solarMonthlyGenerationUnit;
    delete payload.exportPolicy;
    delete payload.solarObjectives;
  }

  if (!values.bessObjectives.includes("backup")) {
    delete payload.backupCriticalLoadPercent;
    delete payload.backupDurationHours;
  }

  if (!values.bessObjectives.includes("peak_shaving")) {
    delete payload.estimatedPeakDemandKw;
    delete payload.targetPeakReductionType;
    delete payload.targetPeakReductionValue;
  }

  if (values.budgetRange !== "Nhập ngân sách tùy chỉnh") {
    delete payload.customBudgetVnd;
  }

  return payload;
}
