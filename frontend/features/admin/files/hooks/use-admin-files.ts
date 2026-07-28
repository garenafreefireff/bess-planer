"use client";

import { useCallback, useEffect, useState } from "react";

import { readAdminApiError } from "@/lib/api/admin.api";
import { adminFilesApi } from "../api/admin-files.api";
import type {
  AdminFileDetail,
  AdminFileFilters,
  AdminFileListResponse,
  AdminFilesOverview
} from "../data/admin-file.types";

export function useAdminFiles(params: AdminFileFilters) {
  const [data, setData] = useState<AdminFileListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFilesApi.list(params);
      setData(response);
    } catch (loadError) {
      setError(readAdminApiError(loadError) || "Không thể tải danh sách file.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}

export function useAdminFilesOverview(params: { date_from?: string; date_to?: string; timezone?: string }) {
  const [data, setData] = useState<AdminFilesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFilesApi.overview(params);
      setData(response);
    } catch (loadError) {
      setError(readAdminApiError(loadError) || "Không thể tải tổng quan lưu trữ.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}

export function useAdminFileDetail() {
  const [data, setData] = useState<AdminFileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (fileId: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFilesApi.detail(fileId);
      setData(response);
    } catch (loadError) {
      setError(readAdminApiError(loadError) || "Không thể tải chi tiết file.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setError("");
  }, []);

  return { clear, data, error, loading, load };
}
