import type {
  AdminDatasetStatusFilter,
  AdminFileKind,
  AdminFileStatus,
  AdminProjectStatus,
  AdminProjectType
} from "./admin-file.types";

const countFormatter = new Intl.NumberFormat("vi-VN");
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short"
});

export const fileKindLabels: Record<AdminFileKind, string> = {
  load_profile: "Dữ liệu phụ tải",
  pv_profile: "Dữ liệu PV",
  other: "Khác"
};

export const fileStatusLabels: Record<AdminFileStatus, string> = {
  uploaded: "Đã upload",
  validated: "Đã validate",
  invalid: "File lỗi"
};

export const datasetStatusLabels: Record<AdminDatasetStatusFilter, string> = {
  ready: "Sẵn sàng",
  warning: "Có cảnh báo",
  invalid: "Không hợp lệ",
  missing: "Chưa tạo dataset"
};

export const projectTypeLabels: Record<AdminProjectType, string> = {
  quick_sizing: "Quick Sizing",
  bess_planning: "BESS Planner"
};

export const projectStatusLabels: Record<AdminProjectStatus, string> = {
  draft: "Nháp",
  active: "Đang hoạt động",
  completed: "Hoàn thành",
  archived: "Đã lưu trữ"
};

export const deleteBlockReasonLabels: Record<string, string> = {
  active_dataset: "Dataset đang active trong dự án.",
  dataset_used_by_analysis: "Dataset hoặc file đã được analysis tham chiếu.",
  dataset_exists: "File đã có dataset dẫn xuất.",
  admin_delete_disabled: "Chức năng xóa file khách hàng sẽ được bật sau khi hoàn thiện nhật ký kiểm toán."
};

export function formatCount(value: number): string {
  return countFormatter.format(value);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const fractionDigits = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: fractionDigits }).format(value)} ${units[unitIndex]}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return dateFormatter.format(date);
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return formatDateTime(value);
}

export function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function shaShort(value: string): string {
  return value ? value.slice(0, 8) : "--------";
}

export function projectTypeLabel(value: AdminProjectType | null): string {
  return value ? projectTypeLabels[value] : "Chưa rõ";
}

export function projectStatusLabel(value: AdminProjectStatus | null): string {
  return value ? projectStatusLabels[value] : "Chưa rõ";
}

export function deleteBlockReasonLabel(reason: string | null): string {
  if (!reason) return deleteBlockReasonLabels.admin_delete_disabled;
  return deleteBlockReasonLabels[reason] ?? reason;
}
