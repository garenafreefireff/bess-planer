from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.system_settings.repository import SystemSettingRepository
from app.modules.system_settings.service import SystemSettingService


def get_system_setting_repository(database: DatabaseDep) -> SystemSettingRepository:
    return SystemSettingRepository(database)


def get_system_setting_service(
    system_setting_repository: Annotated[
        SystemSettingRepository,
        Depends(get_system_setting_repository),
    ],
) -> SystemSettingService:
    return SystemSettingService(system_setting_repository)


SystemSettingRepositoryDep = Annotated[
    SystemSettingRepository,
    Depends(get_system_setting_repository),
]
SystemSettingServiceDep = Annotated[SystemSettingService, Depends(get_system_setting_service)]
