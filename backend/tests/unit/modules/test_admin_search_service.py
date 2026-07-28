from typing import Any

import pytest

from app.modules.admin_search.service import AdminSearchService


class FakeAdminSearchRepository:
    def __init__(self) -> None:
        self.last_queries: list[str] = []

    async def search_users(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        self.last_queries.append(query)
        return [{"_id": "u1", "representative_name": "Nguyễn Ngọc", "email": "nguyen@example.com", "company_name": "DataInsight", "role": "admin", "status": "active"}][:limit]

    async def search_projects(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        self.last_queries.append(query)
        return [{"_id": "p1", "name": "Nhà máy ABC", "project_type": "bess_planning", "status": "active", "configuration": {"location": "Hà Nội", "industry": "Steel"}}][:limit]

    async def search_files(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        self.last_queries.append(query)
        return [{"_id": "f1", "original_name": "load_july_2026.csv", "sha256": "abcdef", "extension": "csv", "kind": "load_profile", "version": 3, "size_bytes": 1234, "status": "validated"}][:limit]

    async def search_leads(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        self.last_queries.append(query)
        return [{"_id": "l1", "full_name": "Lead A", "email": "lead@example.com", "company_name": "Lead Co", "phone": "0916848638", "sources": ["quick_sizing"], "status": "new"}][:limit]


@pytest.mark.asyncio
async def test_global_search_returns_all_groups_with_target_urls() -> None:
    repository = FakeAdminSearchRepository()
    service = AdminSearchService(repository)  # type: ignore[arg-type]

    response = await service.search(query=" load ", limit_per_group=5)

    assert response.query == "load"
    assert response.total_matches == 4
    assert response.groups.users[0].target_url == "/admin/users?user_id=u1"
    assert response.groups.projects[0].target_url == "/admin/projects?project_id=p1"
    assert response.groups.files[0].target_url == "/admin/files?file_id=f1"
    assert response.groups.leads[0].target_url == "/admin/leads?lead_id=l1"


@pytest.mark.asyncio
async def test_global_search_trims_and_limits_query_length() -> None:
    repository = FakeAdminSearchRepository()
    service = AdminSearchService(repository)  # type: ignore[arg-type]

    await service.search(query=" x" * 200, limit_per_group=5)

    assert all(len(query) <= 160 for query in repository.last_queries)


@pytest.mark.asyncio
async def test_global_search_respects_limit_per_group() -> None:
    service = AdminSearchService(FakeAdminSearchRepository())  # type: ignore[arg-type]

    response = await service.search(query="abc", limit_per_group=0)

    assert response.total_matches == 0
