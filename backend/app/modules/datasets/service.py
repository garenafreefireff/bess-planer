from app.modules.datasets.repository import DatasetRepository


class DatasetService:
    def __init__(self, dataset_repository: DatasetRepository) -> None:
        self.dataset_repository = dataset_repository
