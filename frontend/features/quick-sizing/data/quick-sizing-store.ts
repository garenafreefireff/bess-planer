"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuickSizingStep1FormValues } from "./quick-sizing-step1-schema";
import {
  applyScenarioPreset,
  createAssumptionsFromBasicInfo,
  defaultQuickSizingAssumptions,
  type QuickSizingAssumptions,
  type QuickSizingScenario
} from "./quick-sizing-model";

type QuickSizingState = {
  basicInfo: QuickSizingStep1FormValues | null;
  assumptions: QuickSizingAssumptions;
  scenario: QuickSizingScenario;
  dirtyFields: string[];
  selectedOptionId: "low" | "recommended" | "high";
  setBasicInfo: (values: QuickSizingStep1FormValues) => void;
  initializeAssumptions: () => void;
  applyScenario: (scenario: Exclude<QuickSizingScenario, "custom">) => void;
  updateAssumption: <K extends keyof QuickSizingAssumptions>(key: K, value: QuickSizingAssumptions[K]) => void;
  resetAssumptions: () => void;
  selectOption: (id: "low" | "recommended" | "high") => void;
  clearFlow: () => void;
};

export const useQuickSizingStore = create<QuickSizingState>()(
  persist(
    (set, get) => ({
      basicInfo: null,
      assumptions: { ...defaultQuickSizingAssumptions },
      scenario: "default",
      dirtyFields: [],
      selectedOptionId: "recommended",
      setBasicInfo: (basicInfo) => {
        set({
          basicInfo,
          assumptions: createAssumptionsFromBasicInfo(basicInfo),
          scenario: "default",
          dirtyFields: [],
          selectedOptionId: "recommended"
        });
      },
      initializeAssumptions: () => {
        const state = get();
        if (state.basicInfo && state.dirtyFields.length === 0 && state.scenario === "default") {
          set({ assumptions: createAssumptionsFromBasicInfo(state.basicInfo) });
        }
      },
      applyScenario: (scenario) => {
        const base = createAssumptionsFromBasicInfo(get().basicInfo);
        set({
          assumptions: applyScenarioPreset(scenario, base),
          scenario,
          dirtyFields: []
        });
      },
      updateAssumption: (key, value) => {
        const state = get();
        set({
          assumptions: { ...state.assumptions, [key]: value },
          scenario: "custom",
          dirtyFields: state.dirtyFields.includes(String(key))
            ? state.dirtyFields
            : [...state.dirtyFields, String(key)]
        });
      },
      resetAssumptions: () => {
        set({
          assumptions: createAssumptionsFromBasicInfo(get().basicInfo),
          scenario: "default",
          dirtyFields: [],
          selectedOptionId: "recommended"
        });
      },
      selectOption: (selectedOptionId) => set({ selectedOptionId }),
      clearFlow: () => set({
        basicInfo: null,
        assumptions: { ...defaultQuickSizingAssumptions },
        scenario: "default",
        dirtyFields: [],
        selectedOptionId: "recommended"
      })
    }),
    {
      name: "energyinsight.quickSizing.flow.v1",
      version: 1
    }
  )
);
