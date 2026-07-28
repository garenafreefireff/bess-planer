"use client";

import { useCallback, useEffect, useState } from "react";

import { readAdminApiError } from "@/lib/api/admin.api";
import { adminDashboardApi } from "../api/admin-dashboard.api";
import type {
  AdminDashboardOverview,
  DashboardFilters
} from "../data/admin-dashboard.types";

export function useAdminDashboard(filters: DashboardFilters) {
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const overview = await adminDashboardApi.getOverview(filters);
      setData(overview);
    } catch (loadError) {
      setError(readAdminApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    error,
    loading,
    reload: load
  };
}
