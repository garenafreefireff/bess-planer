from fastapi import APIRouter

from app.modules.analyses.router import router as analyses_router
from app.modules.audit_logs.router import router as audit_logs_router
from app.modules.auth.router import router as auth_router
from app.modules.bess_catalog.router import router as bess_catalog_router
from app.modules.datasets.router import router as datasets_router
from app.modules.files.router import router as files_router
from app.modules.leads.router import admin_router as admin_leads_router
from app.modules.leads.router import router as leads_router
from app.modules.projects.router import router as projects_router
from app.modules.reports.router import router as reports_router
from app.modules.sites.router import router as sites_router
from app.modules.system_settings.router import router as system_settings_router
from app.modules.tariffs.router import router as tariffs_router
from app.modules.users.router import router as users_router

api_router = APIRouter()


@api_router.get("/status", tags=["system"])
async def api_status() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(sites_router, prefix="/sites", tags=["sites"])
api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
api_router.include_router(tariffs_router, prefix="/tariffs", tags=["tariffs"])
api_router.include_router(bess_catalog_router, prefix="/bess-catalog", tags=["bess-catalog"])
api_router.include_router(files_router, prefix="/files", tags=["files"])
api_router.include_router(datasets_router, prefix="/datasets", tags=["datasets"])
api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
api_router.include_router(leads_router, prefix="/leads", tags=["leads"])
api_router.include_router(admin_leads_router, prefix="/admin/leads", tags=["admin-leads"])
api_router.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(
    system_settings_router,
    prefix="/system-settings",
    tags=["system-settings"],
)
api_router.include_router(analyses_router, prefix="/analyses", tags=["analyses"])
