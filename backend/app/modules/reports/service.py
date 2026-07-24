from app.modules.reports.repository import ReportRepository


class ReportService:
    def __init__(self, report_repository: ReportRepository) -> None:
        self.report_repository = report_repository
