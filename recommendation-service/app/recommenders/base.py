from abc import ABC, abstractmethod
from pathlib import Path

from app.data_loader import TrainingData
from app.schemas import (
    LocationContext,
    RecommendationItem,
    RecommendationType,
    StoreRecommendationItem,
)


class BaseRecommender(ABC):
    backend_name: str
    model_version: str | None = None

    @abstractmethod
    def train(self, data: TrainingData) -> None:
        raise NotImplementedError

    @abstractmethod
    def save(self, path: Path) -> None:
        raise NotImplementedError

    @abstractmethod
    def load(self, path: Path) -> None:
        raise NotImplementedError

    @abstractmethod
    def recommend_for_user(
        self,
        user_id: str | None,
        limit: int,
        recommendation_type: RecommendationType,
        location: LocationContext | None = None,
    ) -> list[RecommendationItem]:
        raise NotImplementedError

    @abstractmethod
    def similar_products(
        self,
        product_id: str,
        limit: int,
        user_id: str | None = None,
        location: LocationContext | None = None,
    ) -> list[RecommendationItem]:
        raise NotImplementedError

    @abstractmethod
    def recommend_stores_for_user(
        self,
        user_id: str | None,
        limit: int,
        location: LocationContext | None = None,
    ) -> list[StoreRecommendationItem]:
        raise NotImplementedError

    @abstractmethod
    def similar_stores(
        self,
        store_id: str,
        limit: int,
        user_id: str | None = None,
        location: LocationContext | None = None,
    ) -> list[StoreRecommendationItem]:
        raise NotImplementedError
