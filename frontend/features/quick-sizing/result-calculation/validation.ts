import type { ResultWarning, Step2Assumptions } from "./types";

export function createWarning(
  code: string,
  message: string,
  options: {
    severity?: ResultWarning["severity"];
    field?: string;
    candidateId?: string;
    blocking?: boolean;
  } = {}
): ResultWarning {
  return {
    code,
    severity: options.severity ?? "warning",
    field: options.field,
    candidateId: options.candidateId,
    message,
    blocking: options.blocking ?? false
  };
}

export function validateAssumptions(assumptions: Step2Assumptions) {
  const warnings: ResultWarning[] = [];

  if (assumptions.powerKw <= 0) {
    warnings.push(createWarning("INVALID_POWER", "Công suất BESS phải lớn hơn 0.", { field: "powerKw", blocking: true, severity: "error" }));
  }
  if (assumptions.energyKwh <= 0) {
    warnings.push(createWarning("INVALID_ENERGY", "Dung lượng BESS phải lớn hơn 0.", { field: "energyKwh", blocking: true, severity: "error" }));
  }
  if (assumptions.dodPct <= 0 || assumptions.dodPct > 100) {
    warnings.push(createWarning("INVALID_DOD", "DoD phải nằm trong khoảng 0-100%.", { field: "dodPct", blocking: true, severity: "error" }));
  }
  if (assumptions.rtePct <= 0 || assumptions.rtePct > 100) {
    warnings.push(createWarning("INVALID_RTE", "RTE phải nằm trong khoảng 0-100%.", { field: "rtePct", blocking: true, severity: "error" }));
  }
  if (assumptions.waccPct < 0) {
    warnings.push(createWarning("INVALID_WACC", "WACC không được âm.", { field: "waccPct", blocking: true, severity: "error" }));
  }
  if (assumptions.analysisYears <= 0) {
    warnings.push(createWarning("INVALID_ANALYSIS_YEARS", "Thời hạn phân tích phải lớn hơn 0.", { field: "analysisYears", blocking: true, severity: "error" }));
  }
  if (assumptions.peakEventDurationHours <= 0) {
    warnings.push(createWarning("INVALID_PEAK_EVENT_DURATION", "Peak event duration must be greater than 0.", { field: "peakEventDurationHours", blocking: true, severity: "error" }));
  }
  if (assumptions.peakEventFrequencyPerOperatingDay < 0) {
    warnings.push(createWarning("INVALID_PEAK_EVENT_FREQUENCY", "Peak event frequency cannot be negative.", { field: "peakEventFrequencyPerOperatingDay", blocking: true, severity: "error" }));
  }
  if (assumptions.minimumPeakCoveragePct <= 0 || assumptions.minimumPeakCoveragePct > 100) {
    warnings.push(createWarning("INVALID_PEAK_COVERAGE", "Minimum peak coverage must be in the range 0-100%.", { field: "minimumPeakCoveragePct", blocking: true, severity: "error" }));
  }
  if ((assumptions.selectedObjectives ?? []).includes("solar_optimization") && !assumptions.solarMonthlyGenerationKwh && !assumptions.solarCapacityKw) {
    warnings.push(createWarning("PV_DATA_MISSING", "Đã chọn tối ưu PV nhưng chưa có dữ liệu PV hợp lệ; lợi ích PV sẽ không được tính.", { field: "solarStatus" }));
  }
  if ((assumptions.selectedObjectives ?? []).includes("peak_shaving") && !assumptions.finalPeakDemandKw) {
    warnings.push(createWarning("FALLBACK_ASSUMPTION_USED", "Thiếu Pmax xác nhận; engine dùng công suất BESS làm proxy cho kiểm tra peak shaving.", { field: "finalPeakDemandKw" }));
  }
  if (assumptions.demandChargeInputVndPerKwMonth !== null && assumptions.demandChargeInputVndPerKwMonth < 0) {
    warnings.push(createWarning("INVALID_DEMAND_CHARGE_INPUT", "Giá công suất không được âm.", { field: "demandChargeInputVndPerKwMonth", blocking: true, severity: "error" }));
  }
  if (assumptions.demandChargeApplicability === "applicable" && (assumptions.demandChargeMode === "invoice" || assumptions.demandChargeMode === "manual")) {
    if (!assumptions.demandChargeInputVndPerKwMonth || assumptions.demandChargeInputVndPerKwMonth <= 0) {
      warnings.push(createWarning("DEMAND_CHARGE_INPUT_REQUIRED", "Cần nhập giá công suất lớn hơn 0 khi áp dụng theo hóa đơn hoặc nhập thủ công.", { field: "demandChargeInputVndPerKwMonth", severity: "error" }));
    }
  }
  const demandChargeIsStep1VoltageAuto = assumptions.demandChargeSource === "step1_voltage_auto";
  if (assumptions.demandChargeApplicability === "applicable" && assumptions.demandChargeMode === "reference" && assumptions.detailedVoltageBand === "unknown" && !demandChargeIsStep1VoltageAuto) {
    warnings.push(createWarning("DEMAND_CHARGE_VOLTAGE_BAND_REQUIRED", "Cần chọn cấp điện áp chi tiết trước khi dùng giá công suất tham chiếu.", { field: "detailedVoltageBand", severity: "error" }));
  }
  if (assumptions.demandChargeApplicability !== "applicable" && assumptions.effectiveDemandChargeVndPerKwMonth !== 0) {
    warnings.push(createWarning("DEMAND_CHARGE_EFFECTIVE_MUST_BE_ZERO", "Giá công suất hiệu lực phải bằng 0 khi chưa xác định hoặc không áp dụng.", { field: "effectiveDemandChargeVndPerKwMonth", severity: "error" }));
  }
  if (assumptions.demandChargeApplicability === "unknown") {
    warnings.push(createWarning("DEMAND_CHARGE_NOT_CONFIRMED", "Chưa xác nhận giá công suất; lợi ích giảm phí công suất chưa được cộng vào NPV cơ sở.", { field: "demandChargeApplicability", severity: "info" }));
  }
  if (demandChargeIsStep1VoltageAuto) {
    warnings.push(createWarning("DEMAND_CHARGE_PRELIMINARY_REFERENCE", "Giá công suất là tham chiếu sơ bộ theo cấp điện áp, cần đối chiếu hóa đơn hoặc hợp đồng trước khi quyết định đầu tư.", { field: "effectiveDemandChargeVndPerKwMonth", severity: "warning" }));
  } else if (assumptions.demandChargeApplicability === "applicable" && assumptions.demandChargeMode === "reference") {
    warnings.push(createWarning("DEMAND_CHARGE_TRIAL_REFERENCE", "Giá công suất đang dùng tham chiếu thử nghiệm, chưa phải xác nhận từ hóa đơn.", { field: "detailedVoltageBand", severity: "warning" }));
  }
  if ((assumptions.selectedObjectives ?? []).includes("backup")) {
    warnings.push(createWarning("BACKUP_BENEFIT_NOT_MONETIZED", "Lợi ích dự phòng chưa được định giá trong kết quả tài chính.", { field: "selectedObjectives", severity: "info" }));
  }
  if ((assumptions.selectedObjectives ?? []).includes("power_quality")) {
    warnings.push(createWarning("POWER_QUALITY_BENEFIT_NOT_MONETIZED", "Lợi ích chất lượng điện chưa được định giá trong kết quả tài chính.", { field: "selectedObjectives", severity: "info" }));
  }

  if (assumptions.costModelStatus !== "confirmed") {
    warnings.push(createWarning("COST_MODEL_PRELIMINARY", "Chi phi dang la uoc tinh so bo, chua phai bao gia nha cung cap.", { field: "costModelStatus", severity: "info" }));
  }
  if (assumptions.costModelSourceName === "frontend_fallback") {
    warnings.push(createWarning("COST_MODEL_FALLBACK", "Cost model dang la fallback so bo tu frontend.", { field: "costCatalogVersion", severity: "info" }));
  }

  return warnings;
}
