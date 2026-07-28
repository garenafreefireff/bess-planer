import { analysesApi, datasetsApi, filesApi, projectsApi } from "./workspace.api";

export const sizingLabApi = {
  async load(projectId: string) {
    const [project, datasetPage, filePage, runPage] = await Promise.all([
      projectsApi.get(projectId),
      datasetsApi.list({ page: 1, page_size: 100, project_id: projectId }),
      filesApi.list({ page: 1, page_size: 100, project_id: projectId }),
      analysesApi.list({ page: 1, page_size: 100, type: "bess_planning" })
    ]);
    const history = runPage.items.filter((item) => item.project_id === projectId);
    const analysisRun = project.latest_analysis_run_id
      ? history.find((item) => item.id === project.latest_analysis_run_id)
        ?? await analysesApi.get(project.latest_analysis_run_id)
      : history[0] ?? null;
    return { project, datasets: datasetPage.items, files: filePage.items, analysisRun, history };
  },

  async run(projectId: string) {
    return analysesApi.createSizingLab(projectId);
  },

  async applySelection(analysisRunId: string, candidateId: string) {
    return analysesApi.applySizingSelection(analysisRunId, candidateId);
  }
};
