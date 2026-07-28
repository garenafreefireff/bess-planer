"use client";

import { Download, FileSpreadsheet, RadioTower, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  filesApi,
  readWorkspaceApiError,
  type AnalysisRunResponse,
  type DatasetResponse,
  type ProjectResponse,
  type WorkspaceFileResponse
} from "../api/workspace.api";

type DatasetKind = "load_profile" | "pv_profile";

type SnapshotDataset = {
  source?: string;
  dataset_id?: string | null;
  load_dataset_id?: string | null;
  file_id?: string | null;
  file_name?: string | null;
  file_version?: number | null;
  dataset_version?: number | null;
  sha256?: string | null;
  sha256_short?: string | null;
  dataset_status?: string | null;
  status?: string | null;
  rows?: number | null;
  valid_rows?: number | null;
  interval_minutes?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  uploaded_at?: string | null;
};

type ProjectDataFilesPanelProps = {
  project: ProjectResponse | null;
  datasets: DatasetResponse[];
  files: WorkspaceFileResponse[];
  analysisRun?: AnalysisRunResponse | null;
};

export function ProjectDataFilesPanel({ project, datasets, files, analysisRun }: ProjectDataFilesPanelProps) {
  const items = (["load_profile", "pv_profile"] as const).map((kind) =>
    buildDatasetItem(kind, project, datasets, files, analysisRun)
  );

  return (
    <Card className="rounded-xl p-5 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-navy">Bộ dữ liệu đầu vào</h2>
          <p className="mt-1 text-xs font-medium text-brand-muted">
            File nguồn được lưu theo phiên bản; kết quả phân tích ghi lại đúng dataset đã dùng.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
          Persistent storage
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            className={cn(
              "rounded-xl border p-4",
              item.dataset ? "border-brand-line bg-slate-50" : "border-dashed border-brand-line bg-white"
            )}
            key={item.kind}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-brand-blue">
                  {item.kind === "load_profile" ? <FileSpreadsheet size={20} /> : <RadioTower size={20} />}
                </span>
                <div className="min-w-0">
                  <strong className="block text-sm text-brand-navy">{item.label}</strong>
                  <p className="mt-1 break-words text-xs font-semibold text-brand-muted">
                    {item.fileName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  item.isActive ? "bg-green-50 text-brand-green" : "bg-slate-100 text-brand-muted"
                )}>
                  {item.isActive ? "Active" : "Inactive"}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-blue">
                  {item.statusLabel}
                </span>
              </div>
            </div>

            {item.dataset ? (
              <>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
                  <DataMetric label="File version" value={`v${item.fileVersion}`} />
                  <DataMetric label="Dataset version" value={`v${item.datasetVersion}`} />
                  <DataMetric label="Loại" value={item.typeLabel} />
                  <DataMetric label="Dòng hợp lệ" value={`${formatNumber(item.validRows)}/${formatNumber(item.rows)}`} />
                  <DataMetric label="Chu kỳ" value={item.intervalMinutes ? `${item.intervalMinutes} phút` : "—"} />
                  <DataMetric label="Checksum" value={item.sha256Short} mono />
                  <DataMetric label="Từ" value={formatDate(item.startAt)} />
                  <DataMetric label="Đến" value={formatDate(item.endAt)} />
                  <DataMetric label="Upload" value={formatDate(item.uploadedAt)} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-brand-muted">
                    <ShieldCheck size={15} />
                    {item.sourceLabel}
                  </span>
                  {item.fileId ? (
                    <button
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                      onClick={() => { if (item.fileId) void downloadFile(item.fileId); }}
                      type="button"
                    >
                      <Download size={15} />Tải file
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm font-medium leading-6 text-brand-muted">{item.emptyText}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

async function downloadFile(fileId: string) {
  try {
    await filesApi.download(fileId);
  } catch (error) {
    toast.error(readWorkspaceApiError(error));
  }
}

function buildDatasetItem(
  kind: DatasetKind,
  project: ProjectResponse | null,
  datasets: DatasetResponse[],
  files: WorkspaceFileResponse[],
  analysisRun?: AnalysisRunResponse | null
) {
  const snapshot = readSnapshotDataset(analysisRun, kind);
  const activeDatasetId = kind === "load_profile" ? project?.active_load_dataset_id : project?.active_pv_dataset_id;
  const snapshotDatasetId = snapshot?.dataset_id ?? null;
  const dataset = datasets.find((item) => item.id === snapshotDatasetId)
    ?? datasets.find((item) => item.id === activeDatasetId)
    ?? datasets.find((item) => item.dataset_type === kind)
    ?? null;
  const file = files.find((item) => item.id === (snapshot?.file_id ?? dataset?.file_id))
    ?? files.find((item) => item.kind === kind)
    ?? null;
  const isCombinedPv = kind === "pv_profile" && snapshot?.source === "load_profile_combined_or_zero_pv";
  const isActive = Boolean(dataset?.id && dataset.id === activeDatasetId);

  return {
    kind,
    label: kind === "load_profile" ? "Phụ tải" : "Điện mặt trời",
    dataset,
    fileId: file?.id ?? snapshot?.file_id ?? null,
    fileName: snapshot?.file_name ?? file?.original_name ?? (isCombinedPv ? "Đọc từ file phụ tải khi có cột P_pv_kW" : "Chưa có dataset"),
    fileVersion: snapshot?.file_version ?? file?.version ?? 1,
    datasetVersion: snapshot?.dataset_version ?? dataset?.version ?? 1,
    typeLabel: kind === "load_profile" ? "Load profile" : "PV profile",
    statusLabel: formatDatasetStatus(snapshot?.dataset_status ?? dataset?.status ?? snapshot?.status ?? "not_provided"),
    rows: snapshot?.rows ?? dataset?.row_count ?? 0,
    validRows: snapshot?.valid_rows ?? dataset?.valid_row_count ?? 0,
    intervalMinutes: snapshot?.interval_minutes ?? dataset?.interval_minutes ?? null,
    sha256Short: snapshot?.sha256_short ?? snapshot?.sha256?.slice(0, 12) ?? file?.sha256.slice(0, 12) ?? "—",
    startAt: snapshot?.start_at ?? dataset?.start_at ?? null,
    endAt: snapshot?.end_at ?? dataset?.end_at ?? null,
    uploadedAt: snapshot?.uploaded_at ?? file?.created_at ?? null,
    isActive,
    sourceLabel: formatSource(snapshot?.source, isActive),
    emptyText: isCombinedPv
      ? "Không có file PV riêng. Optimizer dùng cột P_pv_kW trong file phụ tải nếu có; nếu không có thì PV được xem là 0."
      : "Chưa có dataset cho loại dữ liệu này.",
  };
}

function readSnapshotDataset(analysisRun: AnalysisRunResponse | null | undefined, kind: DatasetKind): SnapshotDataset | null {
  const activeDatasets = analysisRun?.input_snapshot?.active_datasets;
  if (!activeDatasets || typeof activeDatasets !== "object" || Array.isArray(activeDatasets)) return null;
  const value = (activeDatasets as Record<string, unknown>)[kind];
  return value && typeof value === "object" && !Array.isArray(value) ? value as SnapshotDataset : null;
}

function DataMetric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span className="min-w-0 rounded-lg bg-white p-3">
      <small className="block text-[11px] font-bold uppercase text-brand-muted">{label}</small>
      <strong className={cn("mt-1 block break-words text-sm text-brand-navy", mono && "font-mono text-xs")}>{value}</strong>
    </span>
  );
}

function formatDatasetStatus(value: string) {
  const labels: Record<string, string> = {
    ready: "Sẵn sàng",
    warning: "Cần kiểm tra",
    invalid: "Không hợp lệ",
    validated: "Đã xác thực",
    uploaded: "Đã upload",
    implicit_optional: "Nguồn kết hợp",
    not_provided: "Chưa có",
  };
  return labels[value] ?? value;
}

function formatSource(value: string | undefined, isActive: boolean) {
  if (value === "project_active") return "Dataset active của project tại thời điểm chạy.";
  if (value === "legacy_latest_valid") return "Dataset hợp lệ mới nhất đã được backfill active.";
  if (value === "load_profile_combined_or_zero_pv") return "PV lấy từ file Load nếu có cột P_pv_kW.";
  return isActive ? "Dataset active hiện tại của project." : "Dataset lịch sử hoặc chưa active.";
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}
