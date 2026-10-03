from pathlib import Path
from threading import RLock
import logging
import os
from tempfile import NamedTemporaryFile

from app.config import settings
from app.data_loader import load_training_data
from app.recommenders import get_recommender
from app.recommenders.base import BaseRecommender
from app.schemas import RefreshResponse


logger = logging.getLogger(__name__)


class ModelStore:
    def __init__(self):
        self._lock = RLock()
        self.recommender: BaseRecommender = get_recommender(settings.model_backend)
        self.loaded = False
        self._artifact_signature = None

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
            signature = self._signature(model_path)
            candidate = get_recommender(settings.model_backend)
            candidate.load(model_path)
            self.recommender = candidate
            self._artifact_signature = signature
            self.loaded = True
        return True

    @staticmethod
    def _signature(path):
        stat = path.stat()
        return stat.st_mtime_ns, stat.st_size, stat.st_ino

    def current_recommender(self):
        with self._lock:
            try:
                if settings.model_path.exists() and self._signature(settings.model_path) != self._artifact_signature:
                    self.load()
            except Exception:
                # Keep serving the previous snapshot if a replacement cannot load.
                logger.exception('Could not reload the recommendation model.')
            return self.recommender if self.loaded else None

    def train_and_save(self) -> RefreshResponse:
        data = load_training_data()
        candidate = get_recommender(settings.model_backend)
        candidate.train(data)
        settings.model_path.parent.mkdir(parents=True, exist_ok=True)
        with NamedTemporaryFile(dir=settings.model_path.parent, suffix='.joblib', delete=False) as temporary:
            temporary_path = Path(temporary.name)
        try:
            candidate.save(temporary_path)
            with self._lock:
                os.replace(temporary_path, settings.model_path)
                self._artifact_signature = self._signature(settings.model_path)
                self.recommender = candidate
                self.loaded = True
        finally:
            temporary_path.unlink(missing_ok=True)
        return RefreshResponse(
            backend=candidate.backend_name,
            model_version=candidate.model_version or "",
            product_count=len(data.products),
            store_count=len(getattr(candidate, "store_ids", [])),
            interaction_count=len(data.interactions),
            status="trained",
        )


model_store = ModelStore()
