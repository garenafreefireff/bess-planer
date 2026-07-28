import type { DashboardDelta, DashboardFilters } from "./admin-dashboard.types";

const countFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0
});
const byteUnits = ["B", "KB", "MB", "GB", "TB"];

export function formatCount(value: number): string {
  return countFormatter.format(safeNumber(value));
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(safeNumber(value))}%`;
}

export function formatBytes(bytes: number): string {
  let value = Math.max(0, safeNumber(bytes));
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < byteUnits.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1
  }).format(value)} ${byteUnits[unitIndex]}`;
}

export function formatDelta(delta: DashboardDelta): string {
  if (delta.direction === "new") return "Mới phát sinh";
  if (delta.value_pct === null) return delta.label;
  if (delta.value_pct === 0) return "Không đổi";
  return `${delta.value_pct > 0 ? "+" : ""}${formatPercent(delta.value_pct)}`;
}

export function formatDateTime(value: string, timezone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: timezone
  }).format(date);
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });
  if (absSeconds < 60) return formatter.format(diffSeconds, "second");
  if (absSeconds < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (absSeconds < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (absSeconds < 2592000) return formatter.format(Math.round(diffSeconds / 86400), "day");
  return formatter.format(Math.round(diffSeconds / 2592000), "month");
}

export function getCurrentMonthFilters(timezone: string): DashboardFilters {
  const today = datePartsInTimezone(new Date(), timezone);
  return {
    date_from: `${today.year}-${today.month}-01`,
    date_to: `${today.year}-${today.month}-${today.day}`,
    timezone,
    granularity: "day"
  };
}

export function normalizeTimezone(value: string | null | undefined): string {
  const timezone = value || "Asia/Ho_Chi_Minh";
  try {
    new Intl.DateTimeFormat("vi-VN", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "Asia/Ho_Chi_Minh";
  }
}

export function countInclusiveDays(dateFrom: string, dateTo: string): number {
  const start = parseDateInput(dateFrom);
  const end = parseDateInput(dateTo);
  if (!start || !end) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function isDateRangeOrdered(dateFrom: string, dateTo: string): boolean {
  const start = parseDateInput(dateFrom);
  const end = parseDateInput(dateTo);
  if (!start || !end) return false;
  return start.getTime() <= end.getTime();
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function datePartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value || "01";
  return {
    day: getPart("day"),
    month: getPart("month"),
    year: getPart("year")
  };
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
