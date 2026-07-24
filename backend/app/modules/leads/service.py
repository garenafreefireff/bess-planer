from app.modules.leads.repository import LeadRepository


class LeadService:
    def __init__(self, lead_repository: LeadRepository) -> None:
        self.lead_repository = lead_repository
