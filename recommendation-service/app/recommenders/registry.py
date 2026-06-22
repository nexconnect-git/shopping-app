from app.recommenders.base import BaseRecommender
from app.recommenders.sklearn_hybrid import SklearnHybridRecommender


def get_recommender(name: str) -> BaseRecommender:
    normalized = (name or "sklearn_hybrid").strip().lower()
    if normalized == "sklearn_hybrid":
        return SklearnHybridRecommender()
    if normalized == "deep_embedding":
        raise ValueError("deep_embedding backend is reserved for a future implementation.")
    raise ValueError(f"Unknown recommendation backend: {name}")
