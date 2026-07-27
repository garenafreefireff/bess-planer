from typing import Any

import pytest
from pydantic import ValidationError

from app.models.lead import LeadDocument
from app.modules.leads.enums import LeadSource, LeadStatus
from app.modules.leads.schemas import LeadCaptureResponse, QuickSizingLeadCreateRequest
from app.modules.leads.service import LeadService


class FakeLeadRepository:
    def __init__(self) -> None:
        self.last_upsert: dict[str, Any] | None = None

    async def upsert_by_email(self, **kwargs: Any) -> LeadDocument:
        self.last_upsert = kwargs
        return LeadDocument(
            _id="64b000000000000000000001",
            email=kwargs["email"],
            full_name=kwargs["contact_updates"].get("full_name"),
            phone=kwargs["contact_updates"].get("phone"),
            company_name=kwargs["contact_updates"].get("company_name"),
            sources=[kwargs["source"]],
            privacy_consent=True,
            marketing_consent=False,
            result_code=kwargs.get("result_code"),
            latest_quick_sizing_input=kwargs.get("quick_sizing_input"),
            latest_quick_sizing_result=kwargs.get("quick_sizing_result"),
            interactions=[kwargs["interaction"]],
        )


@pytest.mark.asyncio
async def test_quick_sizing_capture_unlocks_report_and_saves_snapshots() -> None:
    repository = FakeLeadRepository()
    service = LeadService(repository)  # type: ignore[arg-type]
    payload = QuickSizingLeadCreateRequest(
        full_name="Nguyen Van A",
        email="A@Example.com",
        phone="0916848638",
        company_name="DataInsight customer",
        privacy_consent=True,
        marketing_consent=False,
        input_snapshot={"industry": "manufacturing", "bill": 100_000_000},
        result_snapshot={"power_kw": 500, "energy_kwh": 1000},
    )

    response = await service.capture_quick_sizing(payload)

    assert response.report_unlocked is True
    assert response.result_code is not None
    assert response.result_code.startswith("QS-")
    assert response.email == "a@example.com"
    assert response.lead_id == "64b000000000000000000001"
    assert repository.last_upsert is not None
    assert repository.last_upsert["source"] == LeadSource.QUICK_SIZING
    assert repository.last_upsert["quick_sizing_input"] == payload.input_snapshot
    assert repository.last_upsert["quick_sizing_result"] == payload.result_snapshot


@pytest.mark.asyncio
async def test_registration_capture_uses_same_email_pipeline() -> None:
    repository = FakeLeadRepository()
    service = LeadService(repository)  # type: ignore[arg-type]

    await service.capture_registration(
        user_id="64b000000000000000000002",
        email="USER@example.com",
        full_name="Registered User",
        phone=None,
        company_name="Example Co",
        industry="Factory",
    )

    assert repository.last_upsert is not None
    assert repository.last_upsert["email"] == "user@example.com"
    assert repository.last_upsert["source"] == LeadSource.REGISTRATION
    assert repository.last_upsert["contact_updates"]["user_id"] == "64b000000000000000000002"
    assert "privacy_consent" not in repository.last_upsert["contact_updates"]


def test_quick_sizing_capture_requires_privacy_consent() -> None:
    with pytest.raises(ValidationError):
        QuickSizingLeadCreateRequest(
            full_name="Nguyen Van A",
            email="a@example.com",
            phone="0916848638",
            privacy_consent=False,
            input_snapshot={"industry": "manufacturing"},
            result_snapshot={"power_kw": 500},
        )


def test_public_capture_response_has_no_internal_crm_fields() -> None:
    response = LeadCaptureResponse(
        lead_id="64b000000000000000000001",
        email="a@example.com",
        result_code="QS-12345678",
        report_unlocked=True,
    )

    payload = response.model_dump()
    assert "admin_note" not in payload
    assert "interactions" not in payload
    assert "latest_quick_sizing_result" not in payload


def test_pipeline_statuses_cover_sales_flow() -> None:
    assert list(LeadStatus) == [
        LeadStatus.NEW,
        LeadStatus.CONTACTED,
        LeadStatus.QUALIFIED,
        LeadStatus.PROPOSAL,
        LeadStatus.CONVERTED,
        LeadStatus.LOST,
    ]
