from pathlib import Path
from threading import RLock

from app.config import settings
from app.data_loader import load_training_data
from app.recommenders import get_recommender
from app.recommenders.base import BaseRecommender
from app.schemas import RefreshResponse


class ModelStore:
    def __init__(self):
        self._lock = RLock()
        self.recommender: BaseRecommender = get_recommender(settings.model_backend)
        self.loaded = False

    @property
    def backend_name(self) -> str:
        return self.recommender.backend_name

    @property
    def model_version(self) -> str | None:
        return self.recommender.model_version

    def load(self, path: Path | None = None) -> bool:
        model_path = path or settings.model_path
        if not model_path.exists():
            return False
        with self._lock:
            self.recommender.load(model_path)
            self.loaded = True
        return True

    def train_and_save(self) -> RefreshResponse:
        data = load_training_data()
        with self._lock:
            self.recommender = get_recommender(settings.model_backend)
            self.recommender.train(data)
            self.recommender.save(settings.model_path)
            self.loaded = True
        return RefreshResponse(
            backend=self.backend_name,
            model_version=self.model_version or "",
            product_count=len(data.products),
            store_count=len(getattr(self.recommender, "store_ids", [])),
            interaction_count=len(data.interactions),
            status="trained",
        )


model_store = ModelStore()
