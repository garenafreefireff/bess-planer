import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DashboardErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="rounded-xl border-red-100 bg-red-50 p-5 text-red-800 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" size={22} />
          <div className="min-w-0">
            <strong className="block text-sm">Không thể tải tổng quan hệ thống</strong>
            <p className="mt-1 text-sm font-medium leading-6">{message}</p>
          </div>
        </div>
        <Button className="h-10 bg-white text-red-700 hover:bg-red-100" onClick={onRetry} type="button" variant="outline">
          <RefreshCw size={16} />
          Thử lại
        </Button>
      </div>
    </Card>
  );
}
