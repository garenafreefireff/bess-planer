from app.modules.audit_logs.repository import AuditLogRepository


class AuditLogService:
    def __init__(self, audit_log_repository: AuditLogRepository) -> None:
        self.audit_log_repository = audit_log_repository
