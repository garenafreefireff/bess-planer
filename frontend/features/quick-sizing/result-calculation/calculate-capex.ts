import { clamp, normalizePercent } from "./math";
import { createWarning } from "./validation";
import type {
  CapexBreakdown,
  EpcRateBand,
  GeneratedCandidate,
  ResultCalculationConfig,
  ResultScenarioConfig,
  ResultWarning,
  Step2Assumptions
} from "./types";

function finiteOrFallback(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function rateBandsFromAssumptions(assumptions: Step2Assumptions, config: ResultCalculationConfig) {
  return assumptions.epcRateBands.length > 0 ? assumptions.epcRateBands : config.cost.epcRateBands;
}

export function selectEpcBaseRate(equipmentCostVnd: number, rateBands: EpcRateBand[]) {
  const selected = rateBands.find((band) => (
    equipmentCostVnd >= band.minEquipmentCostVnd
    && (band.maxEquipmentCostVnd === null || equipmentCostVnd < band.maxEquipmentCostVnd)
  ));

  return selected?.ratePct ?? rateBands[rateBands.length - 1]?.ratePct ?? 0;
}

export function calculateEpcRate(
  equipmentCostVnd: number,
  assumptions: Step2Assumptions,
  config: ResultCalculationConfig
) {
  const rateBands = rateBandsFromAssumptions(assumptions, config);
  const baseRatePct = selectEpcBaseRate(equipmentCostVnd, rateBands);
  const voltageAdjustments = Object.keys(assumptions.epcVoltageAdjustmentsPct).length > 0
    ? assumptions.epcVoltageAdjustmentsPct
    : config.cost.epcVoltageAdjustmentsPct;
  const voltageAdjustmentPct = finiteOrFallback(
    voltageAdjustments[assumptions.voltageLevel],
    finiteOrFallback(voltageAdjustments["Chưa xác định"], 0)
  );
  const minRatePct = finiteOrFallback(assumptions.epcMinRatePct, config.cost.epcMinRatePct);
  const maxRatePct = finiteOrFallback(assumptions.epcMaxRatePct, config.cost.epcMaxRatePct);
  const autoRatePct = clamp(baseRatePct + voltageAdjustmentPct, minRatePct, maxRatePct);
  const manualRatePct = assumptions.epcManualRatePct;
  const appliedRatePct = assumptions.epcMode === "manual" && manualRatePct !== null && Number.isFinite(manualRatePct)
    ? clamp(manualRatePct, minRatePct, maxRatePct)
    : autoRatePct;

  return {
    baseRatePct,
    voltageAdjustmentPct,
    appliedRatePct
  };
}

export function calculateCapex(
  candidate: GeneratedCandidate,
  assumptions: Step2Assumptions,
  config: ResultCalculationConfig,
  scenario: ResultScenarioConfig
): { capex: CapexBreakdown; warnings: ResultWarning[] } {
  void scenario;
  const batteryUnitCost = {
    ...assumptions.batteryCostMetadata,
    value: assumptions.batteryCostPerKwh
  };
  const pcsUnitCost = {
    ...assumptions.pcsCostMetadata,
    value: assumptions.pcsCostPerKw
  };
  const batteryCostVnd = candidate.energyKwh * assumptions.batteryCostPerKwh;
  const pcsCostVnd = candidate.powerKw * assumptions.pcsCostPerKw;
  const equipmentCostVnd = batteryCostVnd + pcsCostVnd;
  const { baseRatePct, voltageAdjustmentPct, appliedRatePct } = calculateEpcRate(equipmentCostVnd, assumptions, config);
  const epcAllInVnd = equipmentCostVnd * appliedRatePct / 100;
  const capexExcludingVatVnd = equipmentCostVnd + epcAllInVnd;
  const vatPct = assumptions.vatPct ?? config.cost.vatPctFallback;
  const vatVnd = assumptions.includeVatInCapex ? capexExcludingVatVnd * normalizePercent(vatPct) : 0;
  const totalCapexVnd = capexExcludingVatVnd + vatVnd;
  const epcScopeItems = assumptions.epcScopeItems.length > 0 ? assumptions.epcScopeItems : config.cost.epcScopeItems;

  const capex: CapexBreakdown = {
    batteryCostVnd,
    batteryUnitCost,
    pcsCostVnd,
    pcsUnitCost,
    equipmentCostVnd,
    epcBaseRatePct: baseRatePct,
    epcVoltageAdjustmentPct: voltageAdjustmentPct,
    epcAppliedRatePct: appliedRatePct,
    epcAllInVnd,
    vatVnd,
    capexExcludingVatVnd,
    totalCapexVnd,
    epcScopeItems,
    costModelStatus: assumptions.costModelStatus || config.cost.costModelStatus,
    costCatalogVersion: assumptions.costCatalogVersion || config.cost.version,
    costModelSourceName: assumptions.costModelSourceName || config.cost.costModelSourceName,
    includeVatInCapex: assumptions.includeVatInCapex,
    omBaseCapexVnd: capexExcludingVatVnd,
    depreciableCapexVnd: capexExcludingVatVnd,
    currency: config.cost.currency
  };

  const componentTotal = batteryCostVnd + pcsCostVnd + epcAllInVnd + vatVnd;
  const warnings: ResultWarning[] = [];
  if (Math.abs(componentTotal - totalCapexVnd) > 1) {
    warnings.push(
      createWarning("CAPEX_COMPONENT_MISMATCH", "Tong CAPEX khong khop tong cac thanh phan.", {
        candidateId: candidate.id,
        severity: "error",
        blocking: true
      })
    );
  }

  if (capex.costModelStatus !== "confirmed") {
    warnings.push(
      createWarning("COST_MODEL_PRELIMINARY", "Chi phi dang la uoc tinh so bo, chua phai bao gia nha cung cap.", {
        candidateId: candidate.id,
        severity: "info",
        field: "costModelStatus"
      })
    );
  }

  return { capex, warnings };
}
