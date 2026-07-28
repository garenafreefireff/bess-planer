import Link from "next/link";
import type { ReactNode } from "react";
import { Download, Eye, FolderOpen, Trash2, UserRound } from "lucide-react";

import { deleteBlockReasonLabel, fileKindLabels, formatBytes, formatDateTime, shaShort } from "../data/admin-file-format";
import type { AdminFileListItem } from "../data/admin-file.types";
import { DatasetStatusBadge, FileKindBadge, UsageBadge } from "./admin-file-status-badge";
import { AdminFileEmptyState } from "./admin-file-empty-state";

export function AdminFileTable({
  downloadingId,
  items,
  onDownload,
  onOpenDetail
}: {
  downloadingId: string | null;
  items: AdminFileListItem[];
  onDownload: (fileId: string) => void;
  onOpenDetail: (fileId: string) => void;
}) {
  if (!items.length) return <AdminFileEmptyState />;

  return (
    <div className="overflow-x-auto rounded-lg border border-brand-line bg-white">
      <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase text-brand-muted">
          <tr>
            {[
              "Tên file",
              "Loại dữ liệu",
              "Phiên bản",
              "Dự án",
              "Người sở hữu",
              "Dung lượng",
              "Chất lượng",
              "Sử dụng",
              "Ngày upload",
              "Thao tác"
            ].map((header) => (
              <th className="border-b border-brand-line px-4 py-3" key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((file) => {
            const quality = file.dataset?.status ?? "missing";
            return (
              <tr className="border-b border-brand-line last:border-b-0 hover:bg-blue-50/35" key={file.id}>
                <td className="max-w-[280px] px-4 py-4">
                  <button
                    className="block max-w-full text-left"
                    onClick={() => onOpenDetail(file.id)}
                    type="button"
                    title="Xem chi tiết file"
                  >
                    <span className="block truncate font-bold text-brand-navy">{file.original_name}</span>
                    <span className="mt-1 block text-xs font-semibold uppercase text-brand-muted">{file.extension} · SHA {shaShort(file.sha256)}</span>
                  </button>
                </td>
                <td className="px-4 py-4"><FileKindBadge kind={file.kind} /></td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-brand-navy">v{file.version}</span>
                    {file.is_latest_version ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-brand-blue">Mới nhất</span> : null}
                  </div>
                </td>
                <td className="max-w-[190px] px-4 py-4">
                  <span className="block truncate font-semibold text-brand-navy">{file.project.name}</span>
                  <span className="mt-1 block text-xs text-brand-muted">{file.project.project_type ? fileKindProjectLabel(file.project.project_type) : "Chưa rõ"}</span>
                </td>
                <td className="max-w-[210px] px-4 py-4">
                  <span className="block truncate font-semibold text-brand-navy">{file.owner.name}</span>
                  <span className="mt-1 block truncate text-xs text-brand-muted">{file.owner.email || file.owner.company_name || "Chưa có email"}</span>
                </td>
                <td className="px-4 py-4 font-semibold text-brand-navy">{formatBytes(file.size_bytes)}</td>
                <td className="px-4 py-4"><DatasetStatusBadge status={quality} /></td>
                <td className="px-4 py-4"><UsageBadge active={file.is_active} /></td>
                <td className="px-4 py-4 text-sm font-medium text-brand-muted">{formatDateTime(file.created_at)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <IconButton ariaLabel="Xem chi tiết file" onClick={() => onOpenDetail(file.id)} title="Xem chi tiết">
                      <Eye size={16} />
                    </IconButton>
                    <IconButton ariaLabel="Tải file xuống" disabled={downloadingId === file.id} onClick={() => onDownload(file.id)} title="Tải xuống">
                      <Download size={16} />
                    </IconButton>
                    {file.project.id ? (
                      <Link className="grid size-9 place-items-center rounded-md text-brand-muted hover:bg-blue-50 hover:text-brand-blue" href={`/admin/projects?project_id=${file.project.id}`} title="Mở dự án" aria-label="Mở dự án">
                        <FolderOpen size={16} />
                      </Link>
                    ) : null}
                    {file.owner.id ? (
                      <Link className="grid size-9 place-items-center rounded-md text-brand-muted hover:bg-blue-50 hover:text-brand-blue" href={`/admin/users?user_id=${file.owner.id}`} title="Mở người dùng" aria-label="Mở người dùng">
                        <UserRound size={16} />
                      </Link>
                    ) : null}
                    <button
                      aria-label="Xóa file đang bị vô hiệu hóa"
                      className="grid size-9 cursor-not-allowed place-items-center rounded-md text-slate-300"
                      disabled
                      title={deleteBlockReasonLabel(file.delete_block_reason)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function IconButton({ ariaLabel, children, disabled, onClick, title }: { ariaLabel: string; children: ReactNode; disabled?: boolean; onClick: () => void; title: string }) {
  return (
    <button
      aria-label={ariaLabel}
      className="grid size-9 place-items-center rounded-md text-brand-muted hover:bg-blue-50 hover:text-brand-blue disabled:cursor-wait disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function fileKindProjectLabel(value: string): string {
  if (value === "quick_sizing") return "Quick Sizing";
  if (value === "bess_planning") return "BESS Planner";
  return fileKindLabels.other;
}

