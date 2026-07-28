"use client";

import Link from "next/link";
import { Download, Loader2, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  deleteBlockReasonLabel,
  fileKindLabels,
  fileStatusLabels,
  formatBytes,
  formatCount,
  formatDateTime,
  projectStatusLabel,
  projectTypeLabel,
  shaShort
} from "../data/admin-file-format";
import type { AdminFileDetail } from "../data/admin-file.types";
import { DatasetStatusBadge, UsageBadge } from "./admin-file-status-badge";

export function AdminFileDetailDrawer({
  detail,
  downloading,
  error,
  loading,
  onClose,
  onDownload,
  onRetry
}: {
  detail: AdminFileDetail | null;
  downloading: boolean;
  error: string;
  loading: boolean;
  onClose: () => void;
  onDownload: (fileId: string) => void;
  onRetry: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button className="absolute inset-0 bg-brand-navy/30" onClick={onClose} type="button" aria-label="Đóng chi tiết file" />
      <aside
        aria-label="Chi tiết file upload"
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-[560px] max-w-full flex-col bg-white shadow-2xl max-sm:w-full"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-brand-line p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-brand-muted">Chi tiết file</p>
            <h2 className="mt-1 truncate text-xl font-bold text-brand-navy">{detail?.original_name || "Đang tải"}</h2>
          </div>
          <button
            aria-label="Đóng chi tiết file"
            className="grid size-10 shrink-0 place-items-center rounded-md text-brand-muted hover:bg-blue-50 hover:text-brand-blue"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid min-h-[280px] place-items-center text-brand-muted">
              <span className="inline-flex items-center gap-2 text-sm font-semibold"><Loader2 className="animate-spin" size={18} /> Đang tải chi tiết file</span>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
              <p>{error}</p>
              <Button className="mt-3" onClick={onRetry} type="button" variant="secondary">Thử lại</Button>
            </div>
          ) : null}
          {detail && !loading ? <DetailContent detail={detail} /> : null}
        </div>

        {detail ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-line p-5">
            <p className="text-xs font-semibold text-brand-muted">Hard-delete đang khóa cho đến khi có audit log.</p>
            <Button disabled={!detail.can_download || downloading} onClick={() => onDownload(detail.id)} type="button">
              {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              Tải xuống
            </Button>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function DetailContent({ detail }: { detail: AdminFileDetail }) {
  const datasetStatus = detail.dataset?.status ?? "missing";
  return (
    <div className="grid gap-4">
      <Section title="File">
        <DetailRow label="Tên gốc" value={detail.original_name} />
        <DetailRow label="Loại" value={fileKindLabels[detail.kind]} />
        <DetailRow label="Định dạng" value={detail.extension.toUpperCase()} />
        <DetailRow label="Content-Type" value={detail.content_type} />
        <DetailRow label="Dung lượng" value={formatBytes(detail.size_bytes)} />
        <DetailRow label="SHA-256" value={<span className="break-all font-mono text-xs">{detail.sha256}</span>} />
        <DetailRow label="SHA ngắn" value={shaShort(detail.sha256)} />
        <DetailRow label="Version" value={`v${detail.version}`} />
        <DetailRow label="Trạng thái file" value={fileStatusLabels[detail.status]} />
        <DetailRow label="Upload time" value={formatDateTime(detail.created_at)} />
        <DetailRow label="File vật lý" value={detail.physical_file_exists ? "Còn tồn tại" : "Không còn tồn tại"} />
      </Section>

      <Section title="Owner">
        <DetailRow label="Tên" value={detail.owner.name} />
        <DetailRow label="Email" value={detail.owner.email || "Chưa cập nhật"} />
        <DetailRow label="Công ty" value={detail.owner.company_name || "Chưa cập nhật công ty"} />
        <DetailRow label="Link" value={detail.owner.id ? <Link className="font-bold text-brand-blue" href={`/admin/users?user_id=${detail.owner.id}`}>Mở người dùng</Link> : "Chưa có"} />
      </Section>

      <Section title="Project">
        <DetailRow label="Tên" value={detail.project.name} />
        <DetailRow label="Loại project" value={projectTypeLabel(detail.project.project_type)} />
        <DetailRow label="Trạng thái" value={projectStatusLabel(detail.project.status)} />
        <DetailRow label="Active Load/PV" value={detail.is_active ? "File này đang active" : "File này không active"} />
        <DetailRow label="Link" value={detail.project.id ? <Link className="font-bold text-brand-blue" href={`/admin/projects?project_id=${detail.project.id}`}>Mở dự án</Link> : "Chưa có"} />
      </Section>

      <Section title="Dataset">
        <DetailRow label="Status" value={<DatasetStatusBadge status={datasetStatus} />} />
        {detail.dataset ? (
          <>
            <DetailRow label="Row count" value={formatCount(detail.dataset.row_count)} />
            <DetailRow label="Valid row" value={formatCount(detail.dataset.valid_row_count)} />
            <DetailRow label="Interval" value={detail.dataset.interval_minutes ? `${detail.dataset.interval_minutes} phút` : "Chưa có"} />
            <DetailRow label="Start/end" value={`${formatDateTime(detail.dataset.start_at)} - ${formatDateTime(detail.dataset.end_at)}`} />
            <DetailRow label="Timestamp column" value={detail.dataset.timestamp_column || "Chưa có"} />
            <DetailRow label="Value column" value={detail.dataset.value_column || "Chưa có"} />
            <DetailRow label="Columns" value={detail.dataset.columns.length ? detail.dataset.columns.join(", ") : "Chưa có"} />
            <DetailRow label="Warning list" value={detail.dataset.warnings.length ? detail.dataset.warnings.join("; ") : "Không có"} />
            <QualitySummary summary={detail.dataset.quality_summary} />
          </>
        ) : (
          <p className="text-sm font-medium text-brand-muted">Chưa tạo dataset từ file này.</p>
        )}
      </Section>

      <Section title="Traceability">
        <DetailRow label="Active" value={<UsageBadge active={detail.is_active} />} />
        <DetailRow label="Latest" value={detail.is_latest_version ? "Mới nhất" : "Không phải mới nhất"} />
        <DetailRow label="Previous version" value={detail.previous_version ? `${detail.previous_version.original_name} · v${detail.previous_version.version}` : "Không có"} />
        <DetailRow label="Next version" value={detail.next_version ? `${detail.next_version.original_name} · v${detail.next_version.version}` : "Không có"} />
        <DetailRow label="Analysis reference" value={formatCount(detail.analysis_reference_count)} />
        <DetailRow label="Delete block" value={deleteBlockReasonLabel(detail.delete_block_reason)} />
      </Section>
    </div>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-brand-line bg-white p-4">
      <h3 className="mb-3 text-sm font-bold uppercase text-brand-navy">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-3 text-sm max-sm:grid-cols-1 max-sm:gap-1">
      <span className="font-semibold text-brand-muted">{label}</span>
      <span className="min-w-0 font-medium text-brand-navy">{value}</span>
    </div>
  );
}

function QualitySummary({ summary }: { summary: Record<string, unknown> }) {
  const entries = Object.entries(summary).slice(0, 8);
  if (!entries.length) return null;
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="mb-2 text-xs font-bold uppercase text-brand-muted">Quality summary</p>
      <div className="grid gap-1.5">
        {entries.map(([key, value]) => (
          <DetailRow key={key} label={key} value={formatUnknown(value)} />
        ))}
      </div>
    </div>
  );
}

function formatUnknown(value: unknown): string {
  if (value === null || value === undefined) return "Chưa có";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => formatUnknown(item)).join(", ");
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${key}: ${formatUnknown(item)}`).join("; ");
  return String(value);
}

