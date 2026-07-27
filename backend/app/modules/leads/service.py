import logging
from secrets import token_hex
from typing import Any

from app.core.config import Settings
from app.core.exceptions import NotFoundError
from app.models.lead import LeadDocument, LeadInteraction
from app.modules.leads.enums import LeadSource, LeadStatus
from app.modules.leads.repository import LeadRepository
from app.modules.leads.schemas import (
    LeadAdminUpdateRequest,
    LeadCaptureResponse,
    LeadCreateRequest,
    LeadQuickSizingConversionRequest,
    LeadResponse,
    QuickSizingLeadCreateRequest,
)
from app.modules.reports.schemas import NotificationOutboxCreate
from app.modules.reports.service import ReportService
from app.shared.schemas.pagination import PageMeta, PageResponse

logger = logging.getLogger(__name__)


class LeadService:
    def __init__(
        self,
        lead_repository: LeadRepository,
        report_service: ReportService,
        settings: Settings,
    ) -> None:
        self.lead_repository = lead_repository
        self.report_service = report_service
        self.settings = settings

    async def capture(self, payload: LeadCreateRequest) -> LeadCaptureResponse:
        lead = await self._upsert(
            source=LeadSource.CONTACT_FORM,
            email=payload.email,
            contact_updates={
                "full_name": payload.full_name,
                "phone": payload.phone,
                "company_name": payload.company_name,
                "industry": payload.industry,
                "interest": payload.interest,
                "message": payload.message,
                "privacy_consent": payload.privacy_consent,
                "marketing_consent": payload.marketing_consent,
                "training_consent": payload.training_consent,
            },
            interaction_payload={
                "interest": payload.interest,
                "message": payload.message,
                "privacy_consent": payload.privacy_consent,
                "marketing_consent": payload.marketing_consent,
                "training_consent": payload.training_consent,
                "metadata": payload.metadata,
            },
        )
        return LeadCaptureResponse(
            lead_id=lead.id or "",
            email=lead.email,
        )

    async def capture_quick_sizing(
        self,
        payload: QuickSizingLeadCreateRequest,
    ) -> LeadCaptureResponse:
        result_code = f"QS-{token_hex(4).upper()}"
        lead = await self._upsert(
            source=LeadSource.QUICK_SIZING,
            email=payload.email,
            contact_updates={
                "full_name": payload.full_name,
                "phone": payload.phone,
                "company_name": payload.company_name,
                "industry": payload.industry,
                "interest": payload.interest or "Quick Sizing report",
                "privacy_consent": payload.privacy_consent,
                "marketing_consent": payload.marketing_consent,
                "training_consent": payload.training_consent,
            },
            interaction_payload={
                "analysis_run_id": payload.analysis_run_id,
                "privacy_consent": payload.privacy_consent,
                "marketing_consent": payload.marketing_consent,
                "training_consent": payload.training_consent,
                "metadata": payload.metadata,
                "result_code": result_code,
            },
            quick_sizing_input=payload.input_snapshot,
            quick_sizing_result=payload.result_snapshot,
            result_code=result_code,
        )
        await self._enqueue_notification_safely(
            NotificationOutboxCreate(
                event_type="quick_sizing_report_ready",
                recipient=lead.email,
                subject=f"Báo cáo Quick Sizing {result_code}",
                template_key="quick_sizing_report_ready",
                payload={
                    "lead_id": lead.id,
                    "result_code": result_code,
                    "full_name": lead.full_name,
                    "company_name": lead.company_name,
                },
            )
        )
        await self._enqueue_notification_safely(
            NotificationOutboxCreate(
                event_type="sales_lead_created",
                recipient=self.settings.sales_notification_email,
                subject=f"Lead Quick Sizing mới · {lead.lead_score}/100",
                template_key="sales_lead_created",
                payload={
                    "lead_id": lead.id,
                    "email": lead.email,
                    "full_name": lead.full_name,
                    "company_name": lead.company_name,
                    "lead_score": lead.lead_score,
                    "lead_grade": lead.lead_grade,
                    "result_code": result_code,
                },
            )
        )
        return LeadCaptureResponse(
            lead_id=lead.id or "",
            email=lead.email,
            result_code=result_code,
            report_unlocked=True,
        )

    async def capture_registration(
        self,
        *,
        user_id: str,
        email: str,
        full_name: str,
        phone: str | None,
        company_name: str | None,
        industry: str | None,
    ) -> None:
        await self._upsert(
            source=LeadSource.REGISTRATION,
            email=email,
            contact_updates={
                "user_id": user_id,
                "full_name": full_name,
                "phone": phone,
                "company_name": company_name,
                "industry": industry,
            },
            interaction_payload={"user_id": user_id},
        )

    async def mark_quick_sizing_conversion(
        self,
        payload: LeadQuickSizingConversionRequest,
        *,
        user_id: str,
    ) -> LeadResponse:
        existing = await self.lead_repository.get_by_result_code(payload.result_code)
        if existing is None:
            raise NotFoundError("Quick Sizing result code not found.")
        score, grade, reasons = _score_lead(
            existing=existing,
            source=LeadSource.BESS_PLANNER,
            contact_updates={"user_id": user_id},
            quick_sizing_input=None,
            quick_sizing_result=None,
            planner_converted=True,
        )
        lead = await self.lead_repository.mark_planner_conversion(
            result_code=payload.result_code,
            user_id=user_id,
            project_id=payload.project_id,
            selected_candidate_id=payload.selected_candidate_id,
            lead_score=score,
            lead_grade=grade,
            score_reasons=reasons,
        )
        if lead is None:
            raise NotFoundError("Quick Sizing lead not found.")
        await self._enqueue_notification_safely(
            NotificationOutboxCreate(
                event_type="quick_sizing_to_bess_planner",
                recipient=self.settings.sales_notification_email,
                subject=f"Lead chuyển sang BESS Planner · {lead.lead_score}/100",
                template_key="quick_sizing_to_bess_planner",
                payload={
                    "lead_id": lead.id,
                    "email": lead.email,
                    "full_name": lead.full_name,
                    "company_name": lead.company_name,
                    "project_id": payload.project_id,
                    "selected_candidate_id": payload.selected_candidate_id,
                    "lead_score": lead.lead_score,
                    "lead_grade": lead.lead_grade,
                },
            )
        )
        return self._to_response(lead)

    async def list_admin(
        self,
        *,
        page: int,
        page_size: int,
        skip: int,
        status: LeadStatus | None,
        source: LeadSource | None,
        search: str | None,
    ) -> PageResponse[LeadResponse]:
        total = await self.lead_repository.count(status=status, source=source, search=search)
        leads = await self.lead_repository.list(
            skip=skip,
            limit=page_size,
            status=status,
            source=source,
            search=search,
        )
        return PageResponse[LeadResponse](
            items=[self._to_response(lead) for lead in leads],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )

    async def update_admin(
        self,
        lead_id: str,
        payload: LeadAdminUpdateRequest,
    ) -> LeadResponse:
        updates = payload.model_dump(mode="json", exclude_unset=True, exclude_none=False)
        if updates.get("status") is None:
            updates.pop("status", None)
        if "tags" in updates and updates["tags"] is None:
            updates["tags"] = []
        lead = await self.lead_repository.update(lead_id, updates)
        if lead is None:
            raise NotFoundError("Lead not found.")
        return self._to_response(lead)

    async def _upsert(
        self,
        *,
        source: LeadSource,
        email: str,
        contact_updates: dict[str, Any],
        interaction_payload: dict[str, Any],
        quick_sizing_input: dict[str, Any] | None = None,
        quick_sizing_result: dict[str, Any] | None = None,
        result_code: str | None = None,
    ) -> LeadDocument:
        normalized_email = email.strip().lower()
        existing = await self.lead_repository.get_by_email(normalized_email)
        score, grade, reasons = _score_lead(
            existing=existing,
            source=source,
            contact_updates=contact_updates,
            quick_sizing_input=quick_sizing_input,
            quick_sizing_result=quick_sizing_result,
            planner_converted=False,
        )
        return await self.lead_repository.upsert_by_email(
            email=normalized_email,
            source=source,
            contact_updates={
                **contact_updates,
                "lead_score": score,
                "lead_grade": grade,
                "score_reasons": reasons,
            },
            interaction=LeadInteraction(source=source, payload=interaction_payload),
            quick_sizing_input=quick_sizing_input,
            quick_sizing_result=quick_sizing_result,
            result_code=result_code,
        )

    async def _enqueue_notification_safely(
        self,
        payload: NotificationOutboxCreate,
    ) -> None:
        if not self.settings.notification_outbox_enabled:
            return
        try:
            await self.report_service.enqueue_notification(payload)
        except Exception:
            logger.exception("Could not enqueue notification event %s.", payload.event_type)

    @staticmethod
    def _to_response(lead: LeadDocument) -> LeadResponse:
        return LeadResponse.model_validate(lead)


def _score_lead(
    *,
    existing: LeadDocument | None,
    source: LeadSource,
    contact_updates: dict[str, Any],
    quick_sizing_input: dict[str, Any] | None,
    quick_sizing_result: dict[str, Any] | None,
    planner_converted: bool,
) -> tuple[int, str, list[str]]:
    sources = set(existing.sources if existing else [])
    sources.add(source)
    input_snapshot = quick_sizing_input or (existing.latest_quick_sizing_input if existing else None)
    result_snapshot = quick_sizing_result or (existing.latest_quick_sizing_result if existing else None)
    reasons: list[str] = []
    score = 5

    def contact_value(key: str) -> Any:
        value = contact_updates.get(key)
        if value is not None:
            return value
        return getattr(existing, key, None) if existing else None

    if contact_value("full_name"):
        score += 5
        reasons.append("Có người liên hệ")
    if contact_value("phone"):
        score += 10
        reasons.append("Có số điện thoại")
    if contact_value("company_name"):
        score += 10
        reasons.append("Có doanh nghiệp")
    if contact_value("industry"):
        score += 5
        reasons.append("Đã xác định ngành")
    if contact_value("marketing_consent"):
        score += 5
        reasons.append("Cho phép tư vấn")
    if contact_value("training_consent"):
        score += 3
        reasons.append("Cho phép dùng dữ liệu ẩn danh")

    if LeadSource.CONTACT_FORM in sources:
        score += 5
    if LeadSource.QUICK_SIZING in sources:
        score += 15
        reasons.append("Đã mở báo cáo Quick Sizing")
    if LeadSource.REGISTRATION in sources:
        score += 10
        reasons.append("Đã đăng ký tài khoản")
    if planner_converted or LeadSource.BESS_PLANNER in sources or (existing and existing.planner_conversion_at):
        score += 20
        reasons.append("Đã chuyển sang BESS Planner")

    basic_info = _nested_dict(input_snapshot, "basic_info") or _nested_dict(input_snapshot, "step1")
    if basic_info:
        budget_range = basic_info.get("budgetRange") or basic_info.get("budget_range")
        custom_budget = basic_info.get("customBudgetVnd") or basic_info.get("custom_budget_vnd")
        if budget_range or _positive_number(custom_budget):
            score += 10
            reasons.append("Đã xác định ngân sách")
        if _positive_number(basic_info.get("monthlyElectricityBillVnd") or basic_info.get("monthly_electricity_bill_vnd")):
            score += 5
            reasons.append("Có dữ liệu tiền điện")
        if _positive_number(basic_info.get("estimatedPeakDemandKw") or basic_info.get("estimated_peak_demand_kw")):
            score += 5
            reasons.append("Có ước tính phụ tải đỉnh")
        objectives = basic_info.get("bessObjectives") or basic_info.get("bess_objectives")
        if isinstance(objectives, list) and objectives:
            score += 5
            reasons.append("Đã xác định mục tiêu BESS")

    selected = _nested_dict(result_snapshot, "selected_candidate")
    if selected:
        if _positive_number(selected.get("project_npv_vnd") or selected.get("npv_vnd")):
            score += 5
            reasons.append("Project NPV dương")
        if _positive_number(selected.get("equity_npv_vnd")):
            score += 5
            reasons.append("Equity NPV dương")
        minimum_dscr = selected.get("minimum_dscr")
        if isinstance(minimum_dscr, (int, float)) and minimum_dscr >= 1:
            score += 5
            reasons.append("DSCR đạt từ 1,0x")
        if selected.get("budget_status") == "within_budget":
            score += 5
            reasons.append("Phương án trong ngân sách")

    normalized_score = min(100, max(0, int(score)))
    grade = "hot" if normalized_score >= 70 else "warm" if normalized_score >= 40 else "cold"
    return normalized_score, grade, list(dict.fromkeys(reasons))[:20]


def _nested_dict(value: dict[str, Any] | None, key: str) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    nested = value.get(key)
    return nested if isinstance(nested, dict) else None


def _positive_number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return number if number > 0 else None
