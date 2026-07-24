import type { QuickSizingAnalysisRun } from "./quick-sizing-api-types";
import { assumptionsFromAnalysisRun } from "./quick-sizing-backend-mapper";
import {
  applyStep1VoltageDemandCharge,
  applyScenarioPreset,
  createAssumptionsFromBasicInfo,
  defaultQuickSizingAssumptions,
  markDemandChargeUserInput,
  markEquipmentCostUserInput,
  type QuickSizingAssumptions,
  type QuickSizingScenario
} from "./quick-sizing-model";
import type { QuickSizingStep1FormValues } from "./quick-sizing-step1-schema";

export const QUICK_SIZING_PERSIST_NAME = "energyinsight.quickSizing.flow.v4";
export const QUICK_SIZING_PERSIST_VERSION = 7;

const LEGACY_DEFAULT_BATTERY_COST_VND_PER_KWH = 6_000_000;
const LEGACY_DEFAULT_PCS_COST_VND_PER_KW = 2_000_000;

type PersistedQuickSizingState = {
  basicInfo?: QuickSizingStep1FormValues | null;
  analysisRun?: QuickSizingAnalysisRun | null;
  assumptions?: (Partial<QuickSizingAssumptions> & { demandPrice?: number }) | null;
  scenario?: QuickSizingScenario;
  dirtyFields?: string[];
  selectedOptionId?: "low" | "recommended" | "high";
};

export function migrateQuickSizingPersistedData(saved: PersistedQuickSizingState) {
  const dirtyFields = Array.isArray(saved.dirtyFields)
    ? saved.dirtyFields.filter((field): field is string => typeof field === "string")
    : [];
  const baseline = saved.analysisRun
    ? safeAssumptionsFromAnalysisRun(saved.analysisRun, saved.basicInfo)
    : createAssumptionsFromBasicInfo(saved.basicInfo ?? null);
  const normalizedScenario = saved.scenario === "optimistic" || saved.scenario === "conservative" || saved.scenario === "default"
    ? saved.scenario
    : "default";
  const scenarioBaseline = dirtyFields.length === 0
    ? applyScenarioPreset(normalizedScenario, baseline)
    : baseline;
  const migratedAssumptions = migrateAssumptions({
    baseline: scenarioBaseline,
    dirtyFields,
    savedAssumptions: saved.assumptions ?? null
  });
  const nextDirtyFields = dirtyFields.filter((field) => field in migratedAssumptions);
  if (dirtyFields.includes("demandPrice")) {
    nextDirtyFields.push(
      "demandChargeApplicability",
      "demandChargeMode",
      "demandChargeInputVndPerKwMonth"
    );
  }

  return {
    ...saved,
    assumptions: migratedAssumptions,
    scenario: nextDirtyFields.length > 0 ? "custom" : normalizedScenario,
    dirtyFields: nextDirtyFields,
    selectedOptionId: saved.selectedOptionId ?? "recommended"
  };
}

function migrateAssumptions({
  baseline,
  dirtyFields,
  savedAssumptions
}: {
  baseline: QuickSizingAssumptions;
  dirtyFields: string[];
  savedAssumptions: (Partial<QuickSizingAssumptions> & { demandPrice?: number }) | null;
}) {
  let next = { ...baseline };

  if (savedAssumptions) {
    for (const field of dirtyFields) {
      if (field === "batteryCostVndPerKwh" || field === "pcsCostVndPerKw") {
        continue;
      }
      if (field in savedAssumptions) {
        next = {
          ...next,
          [field]: savedAssumptions[field as keyof QuickSizingAssumptions]
        };
      }
    }
  }

  next = migrateUnitCost({
    assumptions: next,
    dirtyFields,
    key: "batteryCostVndPerKwh",
    metadataKey: "batteryCostMetadata",
    savedValue: savedAssumptions?.batteryCostVndPerKwh,
    legacyDefault: LEGACY_DEFAULT_BATTERY_COST_VND_PER_KWH,
    newDefault: defaultQuickSizingAssumptions.batteryCostVndPerKwh
  });
  next = migrateUnitCost({
    assumptions: next,
    dirtyFields,
    key: "pcsCostVndPerKw",
    metadataKey: "pcsCostMetadata",
    savedValue: savedAssumptions?.pcsCostVndPerKw,
    legacyDefault: LEGACY_DEFAULT_PCS_COST_VND_PER_KW,
    newDefault: defaultQuickSizingAssumptions.pcsCostVndPerKw
  });

  return migrateDemandCharge({
    assumptions: next,
    dirtyFields,
    savedDemandPrice: savedAssumptions?.demandPrice
  });
}

function migrateDemandCharge({
  assumptions,
  dirtyFields,
  savedDemandPrice
}: {
  assumptions: QuickSizingAssumptions;
  dirtyFields: string[];
  savedDemandPrice: number | undefined;
}) {
  const legacyValue = typeof savedDemandPrice === "number" && Number.isFinite(savedDemandPrice)
    ? Math.max(0, savedDemandPrice)
    : 0;

  if (assumptions.demandChargeSource === "user_input" && assumptions.effectiveDemandChargeVndPerKwMonth > 0) {
    return markDemandChargeUserInput(assumptions, assumptions.effectiveDemandChargeVndPerKwMonth);
  }

  if (dirtyFields.includes("demandPrice")) {
    return markDemandChargeUserInput(assumptions, legacyValue);
  }

  if (dirtyFields.includes("demandChargeInputVndPerKwMonth") && assumptions.demandChargeInputVndPerKwMonth) {
    return markDemandChargeUserInput(assumptions, assumptions.demandChargeInputVndPerKwMonth);
  }

  return applyStep1VoltageDemandCharge(assumptions, assumptions.voltageLevel);
}

function migrateUnitCost({
  assumptions,
  dirtyFields,
  key,
  metadataKey,
  savedValue,
  legacyDefault,
  newDefault
}: {
  assumptions: QuickSizingAssumptions;
  dirtyFields: string[];
  key: "batteryCostVndPerKwh" | "pcsCostVndPerKw";
  metadataKey: "batteryCostMetadata" | "pcsCostMetadata";
  savedValue: number | undefined;
  legacyDefault: number;
  newDefault: number;
}) {
  const isUserModified = dirtyFields.includes(key);
  const currentValue = assumptions[key];
  const valueFromSaved = typeof savedValue === "number" && Number.isFinite(savedValue)
    ? savedValue
    : null;

  if (isUserModified && valueFromSaved !== null) {
    return markEquipmentCostUserInput(assumptions, key, valueFromSaved);
  }

  if (isCloseTo(currentValue, legacyDefault) || isCloseTo(valueFromSaved, legacyDefault)) {
    return {
      ...assumptions,
      [key]: newDefault,
      [metadataKey]: {
        ...defaultQuickSizingAssumptions[metadataKey],
        value: newDefault
      }
    };
  }

  return {
    ...assumptions,
    [metadataKey]: {
      ...assumptions[metadataKey],
      value: assumptions[key]
    }
  };
}

function safeAssumptionsFromAnalysisRun(
  analysisRun: QuickSizingAnalysisRun,
  basicInfo?: QuickSizingStep1FormValues | null
) {
  try {
    return assumptionsFromAnalysisRun(analysisRun);
  } catch {
    return createAssumptionsFromBasicInfo(basicInfo ?? null);
  }
}

function isCloseTo(value: number | null, target: number) {
  return value !== null && Math.abs(value - target) < 1;
}
