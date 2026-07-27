from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BESS Planner API"
    environment: str = "local"
    debug: bool = Field(default=False, validation_alias="APP_DEBUG")
    api_v1_prefix: str = "/api/v1"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "bess_planner"
    cors_allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    log_level: str = "INFO"
    request_id_header: str = "X-Request-ID"
    auth_secret_key: str = "local-dev-insecure-secret-change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    refresh_cookie_name: str = "bess_refresh_token"
    refresh_cookie_secure: bool = False
    refresh_cookie_samesite: str = "lax"
    refresh_cookie_domain: str | None = None
    password_hash_iterations: int = 210_000
    storage_directory: str = "storage/uploads"
    max_upload_size_mb: int = 50
    rate_limit_enabled: bool = True
    rate_limit_trust_proxy_headers: bool = True
    rate_limit_login_per_minute: int = 10
    rate_limit_register_per_minute: int = 6
    rate_limit_quick_sizing_per_minute: int = 20
    rate_limit_lead_capture_per_minute: int = 10
    rate_limit_sizing_lab_per_minute: int = 4
    analysis_max_concurrency: int = 2
    analysis_timeout_seconds: int = 300
    notification_outbox_enabled: bool = True
    sales_notification_email: str = "sales@datainsight.vn"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
