import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { assumptions, tariffRows } from "../data/quick-sizing-content";

export function AssumptionsPanel() {
  return (
    <Card className="bg-white p-5 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-brand-navy">Giả định Quick Sizing</h2>
        <span className="rounded-full bg-green-50 px-4 py-1.5 text-sm font-extrabold text-brand-green">Mặc định</span>
      </div>

      <div className="divide-y divide-brand-line">
        {assumptions.map(({ icon: Icon, label, value }) => (
          <div className="grid h-[35px] grid-cols-[28px_1fr_auto] items-center text-sm font-semibold text-brand-navy" key={label}>
            <Icon className="text-brand-blue" size={18} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-extrabold text-brand-navy">Giá điện mẫu (VNĐ/kWh)</h3>
        <div className="rounded-lg bg-green-50/60 px-5 py-1.5">
          {tariffRows.map((row) => (
            <div className="flex h-7 items-center justify-between text-sm font-semibold text-brand-navy" key={row.label}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-md bg-blue-50 px-4 py-2.5 text-sm font-semibold text-brand-muted">
        <Info className="text-brand-blue" size={18} />
        <span>Bạn có thể thay đổi giả định ở bước tiếp theo.</span>
      </div>
    </Card>
  );
}
