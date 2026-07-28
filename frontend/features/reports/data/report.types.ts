export type ReportKind = "quick_sizing" | "bess_planner";

export type ReportStatus = "ready" | "preliminary" | "warning" | "processing" | "failed";

export type ReportTypeFilter = "all" | ReportKind;

export type ReportStatusFilter = "all" | ReportStatus;

export type ReportFilters = {
  search: string;
  type: ReportTypeFilter;
  status: ReportStatusFilter;
};

export type ReportBessConfig = {
  energyKwh: number;
  powerKw: number;
  label: string;
};

export type ReportFinancials = {
  capex: string;
  annualSaving: string;
  npv: string;
  payback: string;
};

export type ReportItem = {
  id: string;
  projectId: string;
  projectName: string;
  kind: ReportKind;
  reportCode: string;
  updatedAt: string;
  engineVersion: string;
  status: ReportStatus;
  bessConfig: ReportBessConfig;
  primaryMetric: string;
  secondaryMetric: string;
  details: string[];
  resultHref: string;
  financials?: ReportFinancials;
};

export type ReportKpiItem = {
  id: "total" | "ready" | "processing" | "projects";
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "amber" | "violet";
};

export type ReportAttentionItem = {
  id: string;
  title: string;
  detail: string;
  actionLabel: string;
  href: string;
  tone: "amber" | "blue" | "red" | "slate";
};

export type ReportTypeCardData = {
  id: "quick-sizing" | "bess-planner" | "sample-library";
  title: string;
  badge?: string;
  description: string;
  chips: string[];
  href: string;
  ctaLabel: string;
  tone: "blue" | "green" | "violet";
};

export type LocalReportSignals = {
  hasQuickSizingSavedResult: boolean;
  hasQuickSizingFlow: boolean;
  hasBessPlannerDraft: boolean;
  hasBessPlannerLastProject: boolean;
  observedAt: string;
};
