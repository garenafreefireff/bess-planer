import { clamp } from "./math";
import type { BasicInfoForResult, ConfidenceResult, ResultCalculationConfig, ResultWarning, Step2Assumptions } from "./types";

export function calculateConfidence(
  assumptions: Step2Assumptions,
  basicInfo: BasicInfoForResult | null | undefined,
  warnings: ResultWarning[],
  config: ResultCalculationConfig
): ConfidenceResult {
  let score = 100;
  const reasons: string[] = [];

  if (!assumptions.finalPeakDemandKw && !basicInfo?.estimatedPeakDemandKw) {
    score -= config.confidence.missingPmaxPenalty;
    reasons.push("Chưa có Pmax xác nhận.");
  }
  if (!basicInfo || !basicInfo.bessObjectives?.length) {
    score -= config.confidence.missingLoadPenalty;
    reasons.push("Thiếu thông tin mục tiêu từ Bước 1.");
  }
  if ((assumptions.selectedObjectives ?? []).includes("solar_optimization") && !assumptions.solarMonthlyGenerationKwh && !assumptions.solarCapacityKw) {
    score -= config.confidence.missingPvPenalty;
    reasons.push("Thiếu dữ liệu PV hợp lệ.");
  }

  const fallbackWarnings = warnings.filter((warning) => (
    warning.code === "FALLBACK_ASSUMPTION_USED"
    || warning.code === "COST_MODEL_FALLBACK"
    || warning.code === "COST_MODEL_PRELIMINARY"
  )).length;
  if (fallbackWarnings > 0) {
    score -= fallbackWarnings * config.confidence.fallbackPenalty;
    reasons.push("Có giả định fallback cần nghiệp vụ xác nhận.");
  }

  if (warnings.some((warning) => warning.code.includes("CONFLICT") || warning.code.includes("MISMATCH"))) {
    score -= config.confidence.dataConflictPenalty;
    reasons.push("Có cảnh báo mâu thuẫn dữ liệu.");
  }

  const clampedScore = Math.round(clamp(score, 0, 100));
  const level = clampedScore >= 80
    ? "high"
    : clampedScore >= 65
      ? "medium"
      : clampedScore >= 45
        ? "preliminary"
        : "low";

  return {
    score: clampedScore,
    level,
    reasons: reasons.length > 0 ? reasons : ["Dữ liệu đủ cho ước tính sơ bộ."]
  };
}
