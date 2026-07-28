import Link from "next/link";
import { BarChart3, CloudUpload, FileText, Folder, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "../data/admin-dashboard-format";
import type { ActivityType, RecentActivityItem } from "../data/admin-dashboard.types";
import { DashboardEmptyState } from "./dashboard-empty-state";

const activityConfig: Record<ActivityType, { icon: LucideIcon; tone: string }> = {
  analysis_completed: { icon: BarChart3, tone: "bg-green-50 text-brand-green" },
  file_uploaded: { icon: CloudUpload, tone: "bg-orange-50 text-orange-600" },
  lead_created: { icon: FileText, tone: "bg-violet-50 text-violet-700" },
  project_created: { icon: Folder, tone: "bg-blue-50 text-brand-blue" },
  user_created: { icon: UserPlus, tone: "bg-green-50 text-brand-green" }
};

export function RecentDomainActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card className="min-w-0 rounded-xl bg-white p-5 shadow-panel">
      <h2 className="text-base font-bold text-brand-navy">Hoạt động dữ liệu gần đây</h2>
      {!items.length ? (
        <div className="mt-4">
          <DashboardEmptyState description="Chưa có hoạt động dữ liệu nào được ghi nhận." />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item) => <ActivityRow item={item} key={item.id} />)}
        </div>
      )}
    </Card>
  );
}

function ActivityRow({ item }: { item: RecentActivityItem }) {
  const config = activityConfig[item.type];
  const Icon = config.icon;
  const content = (
    <>
      <span className={cn("grid size-9 place-items-center rounded-full", config.tone)}>
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-sm text-brand-navy">{item.title}</strong>
        <small className="mt-1 block truncate text-xs font-semibold text-brand-muted">{item.description}</small>
      </span>
      <small className="whitespace-nowrap text-xs font-semibold text-brand-muted">{formatRelativeTime(item.occurred_at)}</small>
    </>
  );

  if (item.target_url) {
    return (
      <Link className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-transparent p-2 transition hover:border-blue-100 hover:bg-blue-50/40" href={item.target_url}>
        {content}
      </Link>
    );
  }

  return <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg p-2">{content}</div>;
}
