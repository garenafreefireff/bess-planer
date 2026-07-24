from enum import StrEnum


class FileKind(StrEnum):
    LOAD_PROFILE = "load_profile"
    PV_PROFILE = "pv_profile"
    OTHER = "other"


class FileStatus(StrEnum):
    UPLOADED = "uploaded"
    VALIDATED = "validated"
    INVALID = "invalid"
