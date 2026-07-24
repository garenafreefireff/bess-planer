from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService


def get_audit_log_repository(database: DatabaseDep) -> AuditLogRepository:
    return AuditLogRepository(database)


def get_audit_log_service(
    audit_log_repository: Annotated[AuditLogRepository, Depends(get_audit_log_repository)],
) -> AuditLogService:
    return AuditLogService(audit_log_repository)


AuditLogRepositoryDep = Annotated[AuditLogRepository, Depends(get_audit_log_repository)]
AuditLogServiceDep = Annotated[AuditLogService, Depends(get_audit_log_service)]
