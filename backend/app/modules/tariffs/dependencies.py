from typing import Annotated

from fastapi import Depends

from app.dependencies.database import DatabaseDep
from app.modules.tariffs.repository import TariffRepository
from app.modules.tariffs.service import TariffService


def get_tariff_repository(database: DatabaseDep) -> TariffRepository:
    return TariffRepository(database)


def get_tariff_service(
    tariff_repository: Annotated[TariffRepository, Depends(get_tariff_repository)],
) -> TariffService:
    return TariffService(tariff_repository)


TariffRepositoryDep = Annotated[TariffRepository, Depends(get_tariff_repository)]
TariffServiceDep = Annotated[TariffService, Depends(get_tariff_service)]
