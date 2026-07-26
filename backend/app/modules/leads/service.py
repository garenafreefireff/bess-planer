from secrets import token_hex
from typing import Any

from app.core.exceptions import NotFoundError
from app.models.lead import LeadDocument, LeadInteraction
from app.modules.leads.enums import LeadSource, LeadStatus
from app.modules.leads.repository import LeadRepository
from app.modules.leads.schemas import (
    LeadAdminUpdateRequest,
    LeadCaptureResponse,
    LeadCreateRequest,
    LeadResponse,
    QuickSizingLeadCreateRequest,
)
from app.shared.schemas.pagination import PageMeta, PageResponse


class LeadService:
    def __init__(self, lead_repository: LeadRepository) -> None:
        self.lead_repository = lead_repository

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
        return await self.lead_repository.upsert_by_email(
            email=email.strip().lower(),
            source=source,
            contact_updates=contact_updates,
            interaction=LeadInteraction(source=source, payload=interaction_payload),
            quick_sizing_input=quick_sizing_input,
            quick_sizing_result=quick_sizing_result,
            result_code=result_code,
        )

    @staticmethod
    def _to_response(lead: LeadDocument) -> LeadResponse:
        return LeadResponse.model_validate(lead)
