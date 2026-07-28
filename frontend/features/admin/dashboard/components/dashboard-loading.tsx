import { Card } from "@/components/ui/card";

export function DashboardLoading() {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card className="rounded-xl bg-white p-5 shadow-panel" key={index}>
            <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-[1.35fr_0.85fr] gap-4 max-xl:grid-cols-1">
        <Card className="rounded-xl bg-white p-5 shadow-panel">
          <div className="h-[320px] animate-pulse rounded-lg bg-slate-100" />
        </Card>
        <Card className="rounded-xl bg-white p-5 shadow-panel">
          <div className="h-[320px] animate-pulse rounded-lg bg-slate-100" />
        </Card>
      </div>
    </div>
  );
}
