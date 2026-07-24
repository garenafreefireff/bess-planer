from enum import StrEnum


class AuthTokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"
