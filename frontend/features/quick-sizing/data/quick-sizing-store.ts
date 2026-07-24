"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuickSizingStep1FormValues } from "./quick-sizing-step1-schema";
import { assumptionsFromAnalysisRun } from "./quick-sizing-backend-mapper";
import type { QuickSizingAnalysisRun } from "./quick-sizing-api-types";
import {
  applyStep1VoltageDemandCharge,
  applyScenarioPreset,
  createAssumptionsFromBasicInfo,
  defaultQuickSizingAssumptions,
  isDemandChargeAssumptionKey,
  markDemandChargeUserInput,
  markEquipmentCostUserInput,
  resolveQuickSizingDemandCharge,
  type QuickSizingAssumptions,
  type QuickSizingScenario
} from "./quick-sizing-model";
import {
  migrateQuickSizingPersistedData,
  QUICK_SIZING_PERSIST_NAME,
  QUICK_SIZING_PERSIST_VERSION
} from "./quick-sizing-store-migration";

type QuickSizingState = {
  basicInfo: QuickSizingStep1FormValues | null;
  analysisRun: QuickSizingAnalysisRun | null;
  assumptions: QuickSizingAssumptions;
  scenario: QuickSizingScenario;
  dirtyFields: string[];
  selectedOptionId: "low" | "recommended" | "high";
  setBasicInfo: (values: QuickSizingStep1FormValues, analysisRun?: QuickSizingAnalysisRun | null) => void;
  setAnalysisRun: (analysisRun: QuickSizingAnalysisRun) => void;
  initializeAssumptions: () => void;
  applyScenario: (scenario: Exclude<QuickSizingScenario, "custom">) => void;
  updateAssumption: <K extends keyof QuickSizingAssumptions>(key: K, value: QuickSizingAssumptions[K]) => void;
  resetEpcToAuto: () => void;
  resetDemandChargeToStep1Voltage: () => void;
  resetAssumptions: () => void;
  selectOption: (id: "low" | "recommended" | "high") => void;
  clearFlow: () => void;
};

const DEMAND_CHARGE_DIRTY_FIELDS = new Set<string>([
  "demandChargeApplicability",
  "demandChargeMode",
  "detailedVoltageBand",
  "demandChargeInputVndPerKwMonth",
  "demandChargeSource",
  "demandChargeEvidenceNote"
]);

export const useQuickSizingStore = create<QuickSizingState>()(
  persist(
    (set, get) => ({
      basicInfo: null,
      analysisRun: null,
      assumptions: { ...defaultQuickSizingAssumptions },
      scenario: "default",
      dirtyFields: [],
      selectedOptionId: "recommended",
      setBasicInfo: (basicInfo, analysisRun = null) => {
        const state = get();
        const baseAssumptions = analysisRun
          ? assumptionsFromAnalysisRun(analysisRun)
          : createAssumptionsFromBasicInfo(basicInfo);
        const preserveCustomDemandCharge = state.assumptions.demandChargeSource === "user_input";
        const assumptions = preserveCustomDemandCharge
          ? markDemandChargeUserInput(
            {
              ...baseAssumptions,
              demandChargeVoltageBand: state.assumptions.demandChargeVoltageBand
            },
            state.assumptions.effectiveDemandChargeVndPerKwMonth
          )
          : baseAssumptions;
        const dirtyFields = preserveCustomDemandCharge
          ? ["demandChargeInputVndPerKwMonth"]
          : [];

        set({
          basicInfo,
          analysisRun,
          assumptions,
          scenario: preserveCustomDemandCharge ? "custom" : "default",
          dirtyFields,
          selectedOptionId: "recommended"
        });
      },
      setAnalysisRun: (analysisRun) => {
        set({
          analysisRun,
          assumptions: assumptionsFromAnalysisRun(analysisRun),
          scenario: "default",
          dirtyFields: [],
          selectedOptionId: "recommended"
        });
      },
      initializeAssumptions: () => {
        const state = get();
        if (state.analysisRun && state.dirtyFields.length === 0 && state.scenario === "default") {
          set({ assumptions: safeAssumptionsFromAnalysisRun(state.analysisRun, state.basicInfo) });
          return;
        }
        if (state.basicInfo && state.dirtyFields.length === 0 && state.scenario === "default") {
          set({ assumptions: createAssumptionsFromBasicInfo(state.basicInfo) });
        }
      },
      applyScenario: (scenario) => {
        const state = get();
        const base = state.analysisRun
          ? safeAssumptionsFromAnalysisRun(state.analysisRun, state.basicInfo)
          : createAssumptionsFromBasicInfo(state.basicInfo);
        set({
          assumptions: applyScenarioPreset(scenario, base),
          scenario,
          dirtyFields: []
        });
      },
      updateAssumption: (key, value) => {
        const state = get();
        let nextAssumptions: QuickSizingAssumptions = { ...state.assumptions, [key]: value };
        let dirtyKeys = [String(key)];
        if ((key === "batteryCostVndPerKwh" || key === "pcsCostVndPerKw") && typeof value === "number") {
          nextAssumptions = markEquipmentCostUserInput(state.assumptions, key, value);
        }
        if (key === "epcManualRatePct" && typeof value === "number") {
          nextAssumptions = {
            ...state.assumptions,
            epcMode: "manual",
            epcManualRatePct: value
          };
          dirtyKeys = ["epcMode", "epcManualRatePct"];
        }
        if (key === "epcMode" && value === "auto") {
          nextAssumptions = {
            ...nextAssumptions,
            epcManualRatePct: null
          };
          dirtyKeys = ["epcMode", "epcManualRatePct"];
        }
        if (key === "demandChargeInputVndPerKwMonth" && typeof value === "number") {
          nextAssumptions = markDemandChargeUserInput(state.assumptions, value);
          dirtyKeys = ["demandChargeInputVndPerKwMonth"];
        }
        if (isDemandChargeAssumptionKey(key)) {
          nextAssumptions = resolveQuickSizingDemandCharge(nextAssumptions);
        }
        const dirtyFields = addDirtyFields(state.dirtyFields, dirtyKeys);
        set({
          assumptions: nextAssumptions,
          scenario: "custom",
          dirtyFields
        });
      },
      resetEpcToAuto: () => {
        const state = get();
        const dirtyFields = state.dirtyFields.filter((field) => field !== "epcMode" && field !== "epcManualRatePct");
        set({
          assumptions: {
            ...state.assumptions,
            epcMode: "auto",
            epcManualRatePct: null
          },
          scenario: dirtyFields.length > 0 ? "custom" : state.scenario === "custom" ? "default" : state.scenario,
          dirtyFields
        });
      },
      resetDemandChargeToStep1Voltage: () => {
        const state = get();
        const nextAssumptions = applyStep1VoltageDemandCharge(
          state.assumptions,
          state.basicInfo?.voltageLevel ?? state.assumptions.voltageLevel
        );
        const dirtyFields = state.dirtyFields.filter((field) => !DEMAND_CHARGE_DIRTY_FIELDS.has(field));
        set({
          assumptions: nextAssumptions,
          scenario: dirtyFields.length > 0 ? "custom" : state.scenario === "custom" ? "default" : state.scenario,
          dirtyFields
        });
      },
      resetAssumptions: () => {
        const state = get();
        set({
          assumptions: state.analysisRun
            ? safeAssumptionsFromAnalysisRun(state.analysisRun, state.basicInfo)
            : createAssumptionsFromBasicInfo(state.basicInfo),
          scenario: "default",
          dirtyFields: [],
          selectedOptionId: "recommended"
        });
      },
      selectOption: (selectedOptionId) => set({ selectedOptionId }),
      clearFlow: () => set({
        basicInfo: null,
        analysisRun: null,
        assumptions: { ...defaultQuickSizingAssumptions },
        scenario: "default",
        dirtyFields: [],
        selectedOptionId: "recommended"
      })
    }),
    {
      name: QUICK_SIZING_PERSIST_NAME,
      version: QUICK_SIZING_PERSIST_VERSION,
      migrate: (persistedState) => {
        const saved = persistedState as Partial<QuickSizingState>;
        return migrateQuickSizingPersistedData(saved) as QuickSizingState;
      }
    }
  )
);

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

function addDirtyFields(current: string[], next: string[]) {
  const fields = new Set(current);
  for (const field of next) {
    fields.add(field);
  }
  return [...fields];
}
