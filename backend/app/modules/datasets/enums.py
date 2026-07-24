from enum import StrEnum


class DatasetType(StrEnum):
    LOAD_PROFILE = "load_profile"
    PV_PROFILE = "pv_profile"


class DatasetStatus(StrEnum):
    READY = "ready"
    WARNING = "warning"
    INVALID = "invalid"
