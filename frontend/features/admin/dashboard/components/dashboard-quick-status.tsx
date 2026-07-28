import { BarChart3, Mail, UploadCloud, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBytes, formatCount } from "../data/admin-dashboard-format";
import type { DashboardQuickStatus } from "../data/admin-dashboard.types";

type QuickStatusCard = {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: string;
  value: string;
};

export function DashboardQuickStatusPanel({ status }: { status: DashboardQuickStatus }) {
  const cards: QuickStatusCard[] = [
    {
      detail: `${formatCount(status.file_uploads_today.count)} file · ${formatBytes(status.file_uploads_today.total_size_bytes)}`,
      icon: UploadCloud,
      label: "Upload hôm nay",
      tone: "bg-blue-50 text-brand-blue",
      value: formatCount(status.file_uploads_today.count)
    },
    {
      detail: status.analyses_completed_today.detail,
      icon: BarChart3,
      label: "Phân tích hoàn thành hôm nay",
      tone: "bg-green-50 text-brand-green",
      value: formatCount(status.analyses_completed_today.count)
    },
    {
      detail: status.new_leads.detail,
      icon: UserPlus,
      label: "Lead mới",
      tone: "bg-violet-50 text-violet-700",
      value: formatCount(status.new_leads.count)
    },
    {
      detail: status.pending_emails.detail,
      icon: Mail,
      label: "Email hệ thống đang chờ",
      tone: "bg-orange-50 text-orange-600",
      value: formatCount(status.pending_emails.count)
    }
  ];

  return (
    <Card className="min-w-0 rounded-xl bg-white p-5 shadow-panel">
      <h2 className="text-base font-bold text-brand-navy">Trạng thái nhanh</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="min-w-0 rounded-lg border border-brand-line p-4" key={card.label}>
              <span className={cn("grid size-10 place-items-center rounded-full", card.tone)}>
                <Icon size={20} />
              </span>
              <span className="mt-3 block text-xs font-bold text-brand-muted">{card.label}</span>
              <strong className="mt-1 block text-2xl font-bold text-brand-navy">{card.value}</strong>
              <small className="mt-2 block text-xs font-semibold text-brand-muted">{card.detail}</small>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
