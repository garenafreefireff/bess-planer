"use client";

import { useEffect, useMemo, useState } from "react";

import { formatReportNumber } from "../data/report-format";
import {
  BASE_ATTENTION_ITEMS,
  MOCK_REPORT_ITEMS,
  REPORT_KIND_LABELS,
  REPORT_STATUS_LABELS
} from "../data/report.mock";
import type {
  LocalReportSignals,
  ReportAttentionItem,
  ReportFilters,
  ReportItem,
  ReportKpiItem
} from "../data/report.types";

const initialFilters: ReportFilters = {
  search: "",
  type: "all",
  status: "all"
};

const initialLocalSignals: LocalReportSignals = {
  hasQuickSizingSavedResult: false,
  hasQuickSizingFlow: false,
  hasBessPlannerDraft: false,
  hasBessPlannerLastProject: false,
  observedAt: "2026-07-28T09:00:00+07:00"
};

export function useReportCenter() {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [localSignals, setLocalSignals] = useState<LocalReportSignals>(initialLocalSignals);

  useEffect(() => {
    setLocalSignals(readLocalReportSignals());
  }, []);

  const reports = useMemo(() => {
    const localReports = buildLocalReports(localSignals);
    return [...localReports, ...MOCK_REPORT_ITEMS].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [localSignals]);

  const filteredReports = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesSearch = !search || [
        report.projectName,
        report.reportCode,
        report.engineVersion,
        report.bessConfig.label,
        REPORT_KIND_LABELS[report.kind],
        REPORT_STATUS_LABELS[report.status]
      ].join(" ").toLowerCase().includes(search);
      const matchesType = filters.type === "all" || report.kind === filters.type;
      const matchesStatus = filters.status === "all" || report.status === filters.status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filters, reports]);

  const kpis = useMemo<ReportKpiItem[]>(() => {
    const finishedReports = reports.filter((report) => !["processing", "failed"].includes(report.status));
    const projectIds = new Set(finishedReports.map((report) => report.projectId));
    const readyCount = reports.filter((report) => report.status === "ready").length;
    const processingCount = reports.filter((report) => report.status === "processing").length;

    return [
      {
        id: "total",
        label: "Tổng báo cáo",
        value: formatReportNumber(reports.length),
        detail: "Bao gồm Quick Sizing và BESS Planner",
        tone: "blue"
      },
      {
        id: "ready",
        label: "Sẵn sàng",
        value: formatReportNumber(readyCount),
        detail: "Có thể mở hoặc xuất ngay",
        tone: "green"
      },
      {
        id: "processing",
        label: "Đang xử lý",
        value: formatReportNumber(processingCount),
        detail: "Đang tổng hợp báo cáo",
        tone: "amber"
      },
      {
        id: "projects",
        label: "Dự án có kết quả",
        value: formatReportNumber(projectIds.size),
        detail: "Workspace đã có dữ liệu phân tích",
        tone: "violet"
      }
    ];
  }, [reports]);

  const latestReport = reports[0] ?? null;

  const attentionItems = useMemo<ReportAttentionItem[]>(() => {
    const localItems: ReportAttentionItem[] = [];
    if (localSignals.hasBessPlannerDraft) {
      localItems.push({
        id: "attention-local-draft",
        title: "Có bản nháp Sizing Lab đang lưu",
        detail: "Hoàn tất upload Load/PV để tạo báo cáo phân tích đầy đủ.",
        actionLabel: "Mở bản nháp",
        href: "/customer-portal/du-an-cua-toi/tao-du-an",
        tone: "blue"
      });
    }
    if (localSignals.hasQuickSizingFlow && !localSignals.hasQuickSizingSavedResult) {
      localItems.push({
        id: "attention-quick-flow",
        title: "Quick Sizing có dữ liệu đang nhập",
        detail: "Tiếp tục luồng Quick Sizing để nhận báo cáo sơ bộ.",
        actionLabel: "Tiếp tục",
        href: "/quick-sizing",
        tone: "slate"
      });
    }
    return [...localItems, ...BASE_ATTENTION_ITEMS].slice(0, 4);
  }, [localSignals]);

  const setFilter = <Key extends keyof ReportFilters>(key: Key, value: ReportFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return {
    filters,
    filteredReports,
    hasActiveFilters: filters.search.trim().length > 0 || filters.type !== "all" || filters.status !== "all",
    kpis,
    latestReport,
    attentionItems,
    localSignals,
    resetFilters: () => setFilters(initialFilters),
    setFilter
  };
}

function buildLocalReports(localSignals: LocalReportSignals): ReportItem[] {
  const savedQuickSizing = readStorageRecord("energyinsight.quickSizing.savedResult.v3");
  if (!localSignals.hasQuickSizingSavedResult || !savedQuickSizing) return [];

  const assumptions = readRecord(savedQuickSizing, "assumptions");
  const energyKwh = readNumber(assumptions, "energyKwh") ?? 1000;
  const powerKw = readNumber(assumptions, "powerKw") ?? 500;
  const savedAt = readNumber(savedQuickSizing, "savedAt");
  const updatedAt = savedAt ? new Date(savedAt).toISOString() : localSignals.observedAt;

  return [
    {
      id: "local-quick-sizing-saved-result",
      projectId: "local-quick-sizing",
      projectName: "Kết quả Quick Sizing gần nhất",
      kind: "quick_sizing",
      reportCode: "QS-LOCAL",
      updatedAt,
      engineVersion: "quick-sizing-step2-formulas-v1",
      status: "preliminary",
      bessConfig: {
        energyKwh,
        powerKw,
        label: `${formatReportNumber(energyKwh)} kWh / ${formatReportNumber(powerKw)} kW`
      },
      primaryMetric: "Dữ liệu local",
      secondaryMetric: "Sẵn sàng xem lại",
      details: ["Được lưu trên trình duyệt", "Chưa đồng bộ vào backend reports", "Có thể mở lại kết quả Quick Sizing"],
      resultHref: "/quick-sizing/ket-qua"
    }
  ];
}

function readLocalReportSignals(): LocalReportSignals {
  return {
    hasQuickSizingSavedResult: Boolean(readStorageRecord("energyinsight.quickSizing.savedResult.v3")),
    hasQuickSizingFlow: Boolean(readStorageRecord("energyinsight.quickSizing.flow.v1") || readStorageRecord("energyinsight.quickSizing.flow.v4")),
    hasBessPlannerDraft: Boolean(readStorageRecord("energyinsight.bessPlanner.projectDraft.v1")),
    hasBessPlannerLastProject: Boolean(readStorageRecord("energyinsight.bessPlanner.lastProject.v1")),
    observedAt: new Date().toISOString()
  };
}

function readStorageRecord(key: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function readRecord(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return isRecord(value) ? value : null;
}

function readNumber(source: Record<string, unknown> | null, key: string) {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
