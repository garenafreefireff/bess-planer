from app.modules.system_settings.repository import SystemSettingRepository


class SystemSettingService:
    def __init__(self, system_setting_repository: SystemSettingRepository) -> None:
        self.system_setting_repository = system_setting_repository
