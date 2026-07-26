import { analysesApi, projectsApi } from "./workspace.api";

export const sizingLabApi = {
  async load(projectId: string) {
    const [project, runPage] = await Promise.all([
      projectsApi.get(projectId),
      analysesApi.list({ page: 1, page_size: 100, type: "bess_planning" })
    ]);
    const history = runPage.items.filter((item) => item.project_id === projectId);
    const analysisRun = project.latest_analysis_run_id
      ? history.find((item) => item.id === project.latest_analysis_run_id)
        ?? await analysesApi.get(project.latest_analysis_run_id)
      : history[0] ?? null;
    return { project, datasets: [], analysisRun, history };
  },

  async run(projectId: string) {
    return analysesApi.createSizingLab(projectId);
  },

  async applySelection(analysisRunId: string, candidateId: string) {
    return analysesApi.applySizingSelection(analysisRunId, candidateId);
  }
};
