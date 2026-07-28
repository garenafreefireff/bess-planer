"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { readAdminApiError } from "@/lib/api/admin.api";
import { cn } from "@/lib/utils";
import { AdminShell } from "../../components/admin-pages";
import { adminFilesApi } from "../api/admin-files.api";
import { formatDateTime } from "../data/admin-file-format";
import type {
  AdminDatasetStatusFilter,
  AdminFileExtension,
  AdminFileFilters,
  AdminFileKind,
  AdminFileSortBy,
  AdminFileSortOrder,
  AdminFileStatus
} from "../data/admin-file.types";
import { AdminFileDetailDrawer } from "./admin-file-detail-drawer";
import { AdminFileErrorState } from "./admin-file-error-state";
import { AdminFileFilters as AdminFileFiltersPanel } from "./admin-file-filters";
import { AdminFileLoading } from "./admin-file-loading";
import { AdminFileMetrics } from "./admin-file-metrics";
import { AdminFilePagination } from "./admin-file-pagination";
import { AdminFileTable } from "./admin-file-table";
import { RecentAdminUploads } from "./recent-admin-uploads";
import { StorageByCompany } from "./storage-by-company";
import { useAdminFileDetail, useAdminFiles, useAdminFilesOverview } from "../hooks/use-admin-files";

const kindValues: AdminFileKind[] = ["load_profile", "pv_profile", "other"];
const fileStatusValues: AdminFileStatus[] = ["uploaded", "validated", "invalid"];
const datasetStatusValues: AdminDatasetStatusFilter[] = ["ready", "warning", "invalid", "missing"];
const extensionValues: AdminFileExtension[] = ["csv", "xlsx"];
const sortByValues: AdminFileSortBy[] = ["created_at", "size_bytes", "original_name", "version"];
const sortOrderValues: AdminFileSortOrder[] = ["asc", "desc"];
const pageSizeValues = [10, 20, 50, 100];

export function AdminFilesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(queryString)), [queryString]);
  const timezone = useAuthStore((state) => state.user?.preferences.timezone || "Asia/Ho_Chi_Minh");
  const overviewParams = useMemo(() => ({ timezone }), [timezone]);
  const { data: listData, error: listError, loading: listLoading, reload: reloadList } = useAdminFiles(filters);
  const { data: overview, error: overviewError, loading: overviewLoading, reload: reloadOverview } = useAdminFilesOverview(overviewParams);
  const detail = useAdminFileDetail();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");

  const replaceFilters = useCallback((next: AdminFileFilters, extra?: { fileId?: string | null }) => {
    const nextQuery = buildQuery(next, extra?.fileId ?? null);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [pathname, router]);

  const openDetail = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    void detail.load(fileId);
    replaceFilters(filters, { fileId });
  }, [detail, filters, replaceFilters]);

  const closeDetail = useCallback(() => {
    setSelectedFileId(null);
    detail.clear();
    replaceFilters(filters, { fileId: null });
  }, [detail, filters, replaceFilters]);

  const retryDetail = useCallback(() => {
    if (selectedFileId) void detail.load(selectedFileId);
  }, [detail, selectedFileId]);

  const refreshAll = useCallback(() => {
    void reloadList();
    void reloadOverview();
    if (selectedFileId) void detail.load(selectedFileId);
  }, [detail, reloadList, reloadOverview, selectedFileId]);

  const downloadFile = useCallback(async (fileId: string) => {
    setDownloadingId(fileId);
    setDownloadError("");
    try {
      const { blob, filename } = await adminFilesApi.download(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(readAdminApiError(error) || "Không thể tải file xuống.");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  useEffect(() => {
    const fileId = searchParams.get("file_id");
    if (fileId && fileId !== selectedFileId) {
      setSelectedFileId(fileId);
      void detail.load(fileId);
    }
  }, [detail, searchParams, selectedFileId]);

  useEffect(() => {
    if (!listData || listData.meta.total_pages === 0) return;
    if (filters.page > listData.meta.total_pages) {
      replaceFilters({ ...filters, page: listData.meta.total_pages }, { fileId: selectedFileId });
    }
  }, [filters, listData, replaceFilters, selectedFileId]);

  const initialLoading = listLoading && overviewLoading && !listData && !overview;

  return (
    <AdminShell
      activeItem="File upload"
      title="File upload"
      subtitle="Quản lý file dữ liệu Load/PV, phiên bản, chất lượng dataset và mối liên hệ với các dự án trong hệ thống."
      action={
        <Button disabled={listLoading || overviewLoading} onClick={refreshAll} type="button" variant="secondary">
          <RefreshCw className={cn((listLoading || overviewLoading) && "animate-spin")} size={17} />
          Làm mới
        </Button>
      }
    >
      {initialLoading ? <AdminFileLoading /> : null}
      {!initialLoading ? (
        <>
          <AdminFileMetrics loading={overviewLoading} overview={overview} />
          {overview?.generated_at ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-brand-blue">
              Dữ liệu được tổng hợp lúc {formatDateTime(overview.generated_at)}
            </div>
          ) : null}
          {overviewError ? <AdminFileErrorState message={overviewError} onRetry={() => void reloadOverview()} /> : null}

          <AdminFileFiltersPanel
            filters={filters}
            loading={listLoading}
            onApply={(next) => replaceFilters(next, { fileId: null })}
            onReset={() => replaceFilters(defaultFilters(), { fileId: null })}
          />

          {downloadError ? <AdminFileErrorState message={downloadError} onRetry={() => setDownloadError("")} /> : null}
          {listError && !listData ? <AdminFileErrorState message={listError} onRetry={() => void reloadList()} /> : null}
          {listError && listData ? <AdminFileErrorState message={listError} onRetry={() => void reloadList()} /> : null}

          <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-4 max-xl:grid-cols-1">
            <div className="grid min-w-0 content-start gap-4">
              {listLoading && !listData ? (
                <div className="h-[520px] animate-pulse rounded-lg border border-brand-line bg-slate-50" />
              ) : null}
              {listData ? (
                <>
                  <AdminFileTable
                    downloadingId={downloadingId}
                    items={listData.items}
                    onDownload={(fileId) => void downloadFile(fileId)}
                    onOpenDetail={openDetail}
                  />
                  <AdminFilePagination
                    disabled={listLoading}
                    page={listData.meta.page}
                    pageSize={listData.meta.page_size}
                    total={listData.meta.total}
                    totalPages={listData.meta.total_pages}
                    onChangePage={(page) => replaceFilters({ ...filters, page }, { fileId: selectedFileId })}
                    onChangePageSize={(page_size) => replaceFilters({ ...filters, page: 1, page_size }, { fileId: selectedFileId })}
                  />
                </>
              ) : null}
            </div>
            <aside className="grid min-w-0 content-start gap-4">
              {overview ? (
                <>
                  <RecentAdminUploads items={overview.recent_uploads} onOpenDetail={openDetail} />
                  <StorageByCompany rows={overview.storage_by_company} />
                </>
              ) : overviewLoading ? (
                <>
                  <div className="h-64 animate-pulse rounded-lg border border-brand-line bg-slate-50" />
                  <div className="h-64 animate-pulse rounded-lg border border-brand-line bg-slate-50" />
                </>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}

      {selectedFileId ? (
        <AdminFileDetailDrawer
          detail={detail.data}
          downloading={downloadingId === selectedFileId}
          error={detail.error}
          loading={detail.loading}
          onClose={closeDetail}
          onDownload={(fileId) => void downloadFile(fileId)}
          onRetry={retryDetail}
        />
      ) : null}
    </AdminShell>
  );
}

function defaultFilters(): AdminFileFilters {
  return {
    page: 1,
    page_size: 20,
    search: "",
    kind: "",
    file_status: "",
    dataset_status: "",
    extension: "",
    user_id: "",
    project_id: "",
    company: "",
    active: "",
    latest_only: false,
    date_from: "",
    date_to: "",
    sort_by: "created_at",
    sort_order: "desc"
  };
}

function parseFilters(searchParams: { get: (name: string) => string | null }): AdminFileFilters {
  const defaults = defaultFilters();
  const page = parsePositiveInt(searchParams.get("page"), defaults.page);
  const pageSize = parsePageSize(searchParams.get("page_size"), defaults.page_size);
  return {
    ...defaults,
    page,
    page_size: pageSize,
    search: searchParams.get("search")?.slice(0, 160) ?? "",
    kind: enumValue(searchParams.get("kind"), kindValues) ?? "",
    file_status: enumValue(searchParams.get("status") ?? searchParams.get("file_status"), fileStatusValues) ?? "",
    dataset_status: enumValue(searchParams.get("dataset_status"), datasetStatusValues) ?? "",
    extension: enumValue(searchParams.get("extension"), extensionValues) ?? "",
    user_id: searchParams.get("user_id")?.slice(0, 24) ?? "",
    project_id: searchParams.get("project_id")?.slice(0, 24) ?? "",
    company: searchParams.get("company")?.slice(0, 160) ?? "",
    active: activeValue(searchParams.get("active")),
    latest_only: searchParams.get("latest_only") === "true",
    date_from: dateValue(searchParams.get("date_from")),
    date_to: dateValue(searchParams.get("date_to")),
    sort_by: enumValue(searchParams.get("sort_by"), sortByValues) ?? defaults.sort_by,
    sort_order: enumValue(searchParams.get("sort_order"), sortOrderValues) ?? defaults.sort_order
  };
}

function buildQuery(filters: AdminFileFilters, fileId: string | null): string {
  const params = new URLSearchParams();
  const defaults = defaultFilters();
  if (filters.page !== defaults.page) params.set("page", String(filters.page));
  if (filters.page_size !== defaults.page_size) params.set("page_size", String(filters.page_size));
  setIf(params, "search", filters.search.trim());
  setIf(params, "kind", filters.kind);
  setIf(params, "status", filters.file_status);
  setIf(params, "dataset_status", filters.dataset_status);
  setIf(params, "extension", filters.extension);
  setIf(params, "active", filters.active);
  if (filters.latest_only) params.set("latest_only", "true");
  setIf(params, "user_id", filters.user_id.trim());
  setIf(params, "company", filters.company.trim());
  setIf(params, "project_id", filters.project_id.trim());
  setIf(params, "date_from", filters.date_from);
  setIf(params, "date_to", filters.date_to);
  if (filters.sort_by !== defaults.sort_by) params.set("sort_by", filters.sort_by);
  if (filters.sort_order !== defaults.sort_order) params.set("sort_order", filters.sort_order);
  if (fileId) params.set("file_id", fileId);
  return params.toString();
}

function setIf(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | null, fallback: number): number {
  const parsed = parsePositiveInt(value, fallback);
  return pageSizeValues.includes(parsed) ? parsed : fallback;
}

function enumValue<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (!value) return null;
  return allowed.includes(value as T) ? value as T : null;
}

function activeValue(value: string | null): "" | "true" | "false" {
  return value === "true" || value === "false" ? value : "";
}

function dateValue(value: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}


