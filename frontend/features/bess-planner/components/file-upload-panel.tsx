"use client";

import {
  CheckCircle2,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Info,
  LineChart,
  Trash2,
  Upload
} from "lucide-react";
import { useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadedFile = {
  name: string;
  meta: string;
};

type UploadPanelProps = {
  defaultFile: UploadedFile;
  iconTone: "blue" | "orange";
  required?: boolean;
  sampleName: string;
  title: string;
};

function formatFileMeta(file: File) {
  const sizeInMb = file.size / (1024 * 1024);
  const size = sizeInMb >= 0.1 ? `${sizeInMb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;

  return `${size}  •  Chưa kiểm tra bản ghi`;
}

export function UploadPanel({ defaultFile, iconTone, required, sampleName, title }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<UploadedFile | null>(defaultFile);
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (nextFile?: File) => {
    if (!nextFile) {
      return;
    }

    setFile({
      name: nextFile.name,
      meta: formatFileMeta(nextFile)
    });
  };

  const openFormatGuide = () => {
    alert("Định dạng hỗ trợ: CSV/XLSX. Cột thời gian nên dùng mốc 15 phút, dữ liệu công suất/điện năng dùng đơn vị kW/kWh.");
  };

  return (
    <div className="rounded-md border border-brand-line bg-white p-3.5">
      <h3 className="flex items-center gap-3 text-base font-extrabold text-brand-navy">
        <LineChart className={iconTone === "blue" ? "text-brand-blue" : "text-amber-500"} size={25} />
        {title} {required ? <span className="text-red-500">*</span> : null}
      </h3>
      <div
        className={cn(
          "mt-3 grid h-[132px] place-items-center rounded-md border border-dashed bg-white text-center transition-colors",
          isDragging ? "border-brand-blue bg-blue-50" : "border-blue-300"
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          acceptFile(event.dataTransfer.files.item(0) ?? undefined);
        }}
      >
        <div>
          <CloudUpload className="mx-auto text-brand-blue" size={34} />
          <p className="mt-2 text-sm font-semibold text-brand-muted">Kéo & thả file vào đây</p>
          <p className="text-sm font-semibold text-brand-muted">hoặc</p>
          <input
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(event) => acceptFile(event.target.files?.item(0) ?? undefined)}
            ref={inputRef}
            type="file"
          />
          <button
            className={buttonVariants({ className: "mt-1.5 h-9 bg-brand-blue text-white hover:bg-brand-blue/90" })}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <Upload size={16} />
            Tải lên CSV/XLSX
          </button>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-4">
        <a
          className={buttonVariants({ variant: "secondary", className: "h-8" })}
          download={sampleName}
          href="data:text/csv;charset=utf-8,timestamp,value%0A2024-01-01%2000%3A00,100%0A2024-01-01%2000%3A15,120%0A"
        >
          <Download size={16} />
          Tải file mẫu
        </a>
        <button className={buttonVariants({ variant: "secondary", className: "h-8" })} onClick={openFormatGuide} type="button">
          <Info size={16} />
          Hướng dẫn định dạng
        </button>
      </div>
      {file ? (
        <div className="mt-3 grid grid-cols-[40px_1fr_auto_auto] items-center gap-4 rounded-md border border-green-100 bg-green-50/60 px-4 py-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-brand-green text-white">
            <FileSpreadsheet size={20} />
          </span>
          <span>
            <strong className="block text-sm text-brand-navy">{file.name}</strong>
            <small className="font-semibold text-brand-muted">{file.meta}</small>
          </span>
          <CheckCircle2 className="text-brand-green" size={20} />
          <button
            aria-label={`Xóa ${file.name}`}
            className="text-brand-muted transition-colors hover:text-red-500"
            onClick={() => {
              setFile(null);
              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
            type="button"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-blue-200 bg-blue-50/40 px-4 py-3 text-sm font-semibold text-brand-muted">
          Chưa có file. Bấm tải lên hoặc kéo thả CSV/XLSX vào khung phía trên.
        </div>
      )}
    </div>
  );
}
