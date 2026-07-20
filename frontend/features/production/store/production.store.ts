import { create } from "zustand";

interface ProductionState {
  selectedSiteId: string | null;
  setSelectedSiteId: (siteId: string | null) => void;
}

export const useProductionStore = create<ProductionState>((set) => ({
  selectedSiteId: null,
  setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId })
}));
