import type { PageResponse } from "@/lib/api/types";
import {
  analysesApi,
  bessCatalogApi,
  projectsApi,
  sitesApi,
  tariffsApi,
  type AnalysisRunResponse,
  type BessCatalogResponse,
  type ProjectResponse,
  type SiteResponse,
  type TariffResponse
} from "@/features/bess-planner/api/workspace.api";

const PAGE_SIZE = 100;

async function loadAllPages<T>(
  loader: (page: number, pageSize: number) => Promise<PageResponse<T>>
): Promise<T[]> {
  const first = await loader(1, PAGE_SIZE);
  const pageCount = Math.ceil(first.meta.total / PAGE_SIZE);

  if (pageCount <= 1) return first.items;

  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      loader(index + 2, PAGE_SIZE)
    )
  );

  return [first.items, ...remaining.map((page) => page.items)].flat();
}

export type PortalOverviewData = {
  projects: ProjectResponse[];
  analyses: AnalysisRunResponse[];
  sites: SiteResponse[];
  tariffs: TariffResponse[];
  bessCatalog: BessCatalogResponse[];
};

export async function loadPortalOverview(): Promise<PortalOverviewData> {
  const [projects, analyses, sites, tariffs, bessCatalog] = await Promise.all([
    loadAllPages((page, pageSize) => projectsApi.list({ page, page_size: pageSize })),
    loadAllPages((page, pageSize) => analysesApi.list({ page, page_size: pageSize })),
    loadAllPages((page, pageSize) => sitesApi.list({ page, page_size: pageSize })),
    loadAllPages((page, pageSize) => tariffsApi.list({ page, page_size: pageSize })),
    loadAllPages((page, pageSize) => bessCatalogApi.list({ page, page_size: pageSize }))
  ]);

  return { projects, analyses, sites, tariffs, bessCatalog };
}
