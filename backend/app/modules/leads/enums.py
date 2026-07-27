from enum import StrEnum


class LeadSource(StrEnum):
    CONTACT_FORM = "contact_form"
    QUICK_SIZING = "quick_sizing"
    REGISTRATION = "registration"
    BESS_PLANNER = "bess_planner"


class LeadStatus(StrEnum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    CONVERTED = "converted"
    LOST = "lost"
