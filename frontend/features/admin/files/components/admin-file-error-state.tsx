import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminFileErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-red-700" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={20} />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Không thể tải dữ liệu</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
        </div>
        <Button onClick={onRetry} type="button" variant="secondary">Thử lại</Button>
      </div>
    </div>
  );
}
