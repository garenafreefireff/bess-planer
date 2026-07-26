"use client";

import { useCallback, useEffect, useState } from "react";
import { sizingLabApi } from "../api/sizing-lab.api";
import { readWorkspaceApiError, type AnalysisRunResponse, type DatasetResponse, type ProjectResponse } from "../api/workspace.api";
import { isSizingLabResult, type SizingLabResult } from "../data/sizing-lab.types";

export function useSizingLab(projectId: string | null) {
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [datasets, setDatasets] = useState<DatasetResponse[]>([]);
  const [analysisRun, setAnalysisRun] = useState<AnalysisRunResponse | null>(null);
  const [history, setHistory] = useState<AnalysisRunResponse[]>([]);
  const [result, setResult] = useState<SizingLabResult | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await sizingLabApi.load(projectId);
      setProject(response.project);
      setDatasets(response.datasets);
      setAnalysisRun(response.analysisRun);
      setHistory(response.history);
      setResult(response.analysisRun && isSizingLabResult(response.analysisRun.result) ? response.analysisRun.result : null);
    } catch (cause) {
      setError(readWorkspaceApiError(cause));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(async () => {
    if (!projectId) return null;
    setRunning(true);
    setError("");
    try {
      const nextRun = await sizingLabApi.run(projectId);
      setAnalysisRun(nextRun);
      setResult(isSizingLabResult(nextRun.result) ? nextRun.result : null);
      return nextRun;
    } catch (cause) {
      setError(readWorkspaceApiError(cause));
      return null;
    } finally {
      setRunning(false);
    }
  }, [projectId]);

  return { project, datasets, analysisRun, history, result, loading, running, error, reload: load, run };
}
