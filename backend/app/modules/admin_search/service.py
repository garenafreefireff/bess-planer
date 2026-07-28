from typing import Any

from app.modules.admin_search.repository import AdminSearchRepository
from app.modules.admin_search.schemas import AdminSearchGroups, AdminSearchItem, AdminSearchResponse

MAX_QUERY_LENGTH = 160


class AdminSearchService:
    def __init__(self, repository: AdminSearchRepository) -> None:
        self.repository = repository

    async def search(self, *, query: str, limit_per_group: int) -> AdminSearchResponse:
        normalized_query = query.strip()[:MAX_QUERY_LENGTH]
        users = await self.repository.search_users(normalized_query, limit=limit_per_group)
        projects = await self.repository.search_projects(normalized_query, limit=limit_per_group)
        files = await self.repository.search_files(normalized_query, limit=limit_per_group)
        leads = await self.repository.search_leads(normalized_query, limit=limit_per_group)
        groups = AdminSearchGroups(
            users=[_user_item(row) for row in users],
            projects=[_project_item(row) for row in projects],
            files=[_file_item(row) for row in files],
            leads=[_lead_item(row) for row in leads],
        )
        total = sum(len(group) for group in [groups.users, groups.projects, groups.files, groups.leads])
        return AdminSearchResponse(query=normalized_query, groups=groups, total_matches=total)


def _user_item(row: dict[str, Any]) -> AdminSearchItem:
    user_id = str(row.get("_id") or "")
    email = str(row.get("email") or "")
    company = str(row.get("company_name") or "Chưa cập nhật công ty")
    title = str(row.get("representative_name") or email or "Người dùng")
    return AdminSearchItem(
        id=user_id,
        type="user",
        title=title,
        subtitle=" · ".join(part for part in [email, company] if part),
        metadata={"email": email, "company_name": company, "role": row.get("role"), "status": row.get("status")},
        target_url=f"/admin/users?user_id={user_id}",
    )


def _project_item(row: dict[str, Any]) -> AdminSearchItem:
    project_id = str(row.get("_id") or "")
    config = row.get("configuration") if isinstance(row.get("configuration"), dict) else {}
    project_type = str(row.get("project_type") or "")
    status = str(row.get("status") or "")
    location = str(config.get("location") or "")
    industry = str(config.get("industry") or "")
    subtitle = " · ".join(part for part in [project_type, status, location or industry] if part)
    return AdminSearchItem(
        id=project_id,
        type="project",
        title=str(row.get("name") or "Dự án"),
        subtitle=subtitle,
        metadata={"project_type": project_type, "status": status, "location": location, "industry": industry},
        target_url=f"/admin/projects?project_id={project_id}",
    )


def _file_item(row: dict[str, Any]) -> AdminSearchItem:
    file_id = str(row.get("_id") or "")
    kind = str(row.get("kind") or "other")
    version = int(row.get("version") or 1)
    size_bytes = int(row.get("size_bytes") or 0)
    extension = str(row.get("extension") or "")
    return AdminSearchItem(
        id=file_id,
        type="file",
        title=str(row.get("original_name") or "File"),
        subtitle=f"{kind} · v{version} · {size_bytes} bytes",
        metadata={"kind": kind, "version": version, "size_bytes": size_bytes, "extension": extension, "status": row.get("status")},
        target_url=f"/admin/files?file_id={file_id}",
    )


def _lead_item(row: dict[str, Any]) -> AdminSearchItem:
    lead_id = str(row.get("_id") or "")
    full_name = str(row.get("full_name") or "")
    company = str(row.get("company_name") or "")
    email = str(row.get("email") or "")
    title = company or full_name or email or "Lead"
    source = _first_source(row.get("sources"))
    subtitle = " · ".join(part for part in [full_name, email, source, str(row.get("status") or "")] if part)
    return AdminSearchItem(
        id=lead_id,
        type="lead",
        title=title,
        subtitle=subtitle,
        metadata={"email": email, "company_name": company, "phone": row.get("phone"), "source": source, "status": row.get("status")},
        target_url=f"/admin/leads?lead_id={lead_id}",
    )


def _first_source(value: Any) -> str:
    if isinstance(value, list) and value:
        return str(value[0])
    return ""
