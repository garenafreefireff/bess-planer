import type { ReportBessConfig } from "./report.types";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

export function formatReportNumber(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  }).format(value);
}

export function formatReportDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa xác định" : dateTimeFormatter.format(date);
}

export function formatBessConfig(config: ReportBessConfig) {
  return `${numberFormatter.format(config.energyKwh)} kWh / ${numberFormatter.format(config.powerKw)} kW`;
}
