import { CloudUpload } from "lucide-react";

export function AdminFileEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-brand-line bg-white p-10 text-center">
      <CloudUpload className="mx-auto text-brand-muted" size={34} />
      <h3 className="mt-4 text-lg font-bold text-brand-navy">Chưa có file nào được lưu</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-brand-muted">
        Khi khách hàng upload file CSV hoặc XLSX qua luồng dự án, dữ liệu persistent upload và dataset dẫn xuất sẽ xuất hiện tại đây.
      </p>
    </div>
  );
}
