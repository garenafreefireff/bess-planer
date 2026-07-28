"use client";

import { useEffect, useState } from "react";

import { readAdminApiError } from "@/lib/api/admin.api";
import { adminSearchApi } from "../api/admin-search.api";
import type { AdminSearchResponse } from "../data/admin-search.types";

export function useAdminGlobalSearch(query: string, enabled: boolean) {
  const [data, setData] = useState<AdminSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const normalized = query.trim();
    if (!enabled || normalized.length < 2) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      adminSearchApi.search(normalized, 5)
        .then((response) => {
          if (!cancelled) setData(response);
        })
        .catch((searchError) => {
          if (!cancelled) {
            setError(readAdminApiError(searchError) || "Không thể tìm kiếm dữ liệu quản trị.");
            setData(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, query]);

  return { data, error, loading };
}
