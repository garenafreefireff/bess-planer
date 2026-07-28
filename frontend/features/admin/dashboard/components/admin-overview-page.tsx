"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/lib/utils";
import { AdminShell } from "../../components/admin-pages";
import {
  formatDateTime,
  getCurrentMonthFilters,
  normalizeTimezone
} from "../data/admin-dashboard-format";
import type { DashboardFilters } from "../data/admin-dashboard.types";
import { useAdminDashboard } from "../hooks/use-admin-dashboard";
import { DashboardDateRange } from "./dashboard-date-range";
import { DashboardDistributionChart } from "./dashboard-distribution-chart";
import { DashboardErrorState } from "./dashboard-error-state";
import { DashboardGrowthChart } from "./dashboard-growth-chart";
import { DashboardLoading } from "./dashboard-loading";
import { DashboardMetricGrid } from "./dashboard-metric-grid";
import { DashboardQuickStatusPanel } from "./dashboard-quick-status";
import { RecentDomainActivity } from "./recent-domain-activity";
import { TopStorageCompanies } from "./top-storage-companies";

export function AdminOverviewPage() {
  const userTimezone = useAuthStore((state) => state.user?.preferences.timezone);
  const timezone = normalizeTimezone(userTimezone);
  const initialFilters = useMemo(() => getCurrentMonthFilters(timezone), [timezone]);
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const { data, error, loading, reload } = useAdminDashboard(filters);

  useEffect(() => {
    setFilters((current) => current.timezone === timezone ? current : getCurrentMonthFilters(timezone));
  }, [timezone]);

  return (
    <AdminShell
      activeItem="Tổng quan"
      title="Tổng quan hệ thống"
      subtitle="Dashboard quản trị được tổng hợp trực tiếp từ dữ liệu MongoDB của EnergyInsight."
      action={
        <Button disabled={loading} onClick={() => void reload()} type="button" variant="secondary">
          <RefreshCw className={cn(loading && "animate-spin")} size={17} />
          Làm mới
        </Button>
      }
    >
      <DashboardDateRange filters={filters} loading={loading} onApply={setFilters} />

      {error && !data ? <DashboardErrorState message={error} onRetry={() => void reload()} /> : null}
      {loading && !data ? <DashboardLoading /> : null}

      {data ? (
        <>
          {error ? <DashboardErrorState message={error} onRetry={() => void reload()} /> : null}
          <DashboardMetricGrid metrics={data.metrics} />
          <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] gap-4 max-xl:grid-cols-1">
            <DashboardGrowthChart series={data.growth_series} />
            <div className="grid min-w-0 gap-4">
              <DashboardDistributionChart
                centerLabel="tài khoản"
                centerValue={data.metrics.total_users.value}
                items={data.user_role_distribution}
                title="Phân bổ tài khoản theo vai trò"
              />
              <DashboardDistributionChart
                centerLabel="dự án"
                centerValue={data.metrics.total_projects.value}
                items={data.project_status_distribution}
                title="Phân bổ trạng thái dự án"
              />
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 max-2xl:grid-cols-2 max-xl:grid-cols-1">
            <TopStorageCompanies rows={data.top_companies_by_storage} />
            <RecentDomainActivity items={data.recent_activity} />
            <DashboardQuickStatusPanel status={data.quick_status} />
          </div>
          <div className="pb-2 text-center text-sm font-medium text-brand-muted">
            Dữ liệu được tổng hợp lúc {formatDateTime(data.generated_at, data.period.timezone)}
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}
