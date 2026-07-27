from app.modules.reports.repository import ReportRepository
from app.modules.reports.schemas import (
    NotificationOutboxCreate,
    NotificationOutboxResponse,
)
from app.shared.schemas.pagination import PageMeta, PageResponse


class ReportService:
    def __init__(self, report_repository: ReportRepository) -> None:
        self.report_repository = report_repository

    async def enqueue_notification(
        self,
        payload: NotificationOutboxCreate,
    ) -> NotificationOutboxResponse:
        notification = await self.report_repository.enqueue_notification(payload)
        return NotificationOutboxResponse.model_validate(notification)

    async def list_notifications_admin(
        self,
        *,
        page: int,
        page_size: int,
        skip: int,
        status: str | None,
    ) -> PageResponse[NotificationOutboxResponse]:
        total = await self.report_repository.count_notifications(status)
        notifications = await self.report_repository.list_notifications(
            skip=skip,
            limit=page_size,
            status=status,
        )
        return PageResponse[NotificationOutboxResponse](
            items=[NotificationOutboxResponse.model_validate(item) for item in notifications],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )
