from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

from app.data_loader import TrainingData
from app.recommenders.base import BaseRecommender
from app.schemas import LocationContext, RecommendationItem, RecommendationType, StoreRecommendationItem


EVENT_WEIGHTS = {
    "purchase": 5.0,
    "cart": 3.0,
    "wishlist": 2.0,
    "rating": 1.5,
}


@dataclass
class ProductMeta:
    product_id: str
    vendor_id: str
    vendor_state: str
    vendor_latitude: float
    vendor_longitude: float
    max_delivery_radius_km: float
    discount_ratio: float


@dataclass
class StoreMeta:
    store_id: str
    store_state: str
    store_latitude: float
    store_longitude: float
    max_delivery_radius_km: float


class SklearnHybridRecommender(BaseRecommender):
    backend_name = "sklearn_hybrid"

    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), min_df=1)
        self.scaler = MinMaxScaler()
        self.product_ids: list[str] = []
        self.product_meta: dict[str, ProductMeta] = {}
        self.store_ids: list[str] = []
        self.store_meta: dict[str, StoreMeta] = {}
        self.product_text_matrix = None
        self.store_text_matrix = None
        self.popularity_scores = np.array([])
        self.store_popularity_scores = np.array([])
        self.discount_scores = np.array([])
        self.store_discount_scores = np.array([])
        self.has_discount = np.array([])
        self.featured_scores = np.array([])
        self.store_featured_scores = np.array([])
        self.user_interactions: dict[str, dict[str, float]] = {}
        self.store_user_interactions: dict[str, dict[str, float]] = {}
        self.model_version = None

    def train(self, data: TrainingData) -> None:
        products = data.products.copy()
        if products.empty:
            self._reset_empty()
            return

        products["product_id"] = products["product_id"].astype(str)
        products = products.drop_duplicates(subset=["product_id"]).reset_index(drop=True)
        self.product_ids = products["product_id"].tolist()
        products["content_text"] = products.apply(self._content_text, axis=1)
        self.product_text_matrix = self.vectorizer.fit_transform(products["content_text"])
        stores = self._build_store_frame(products)
        self.store_ids = stores["store_id"].tolist()
        self.store_text_matrix = self.vectorizer.transform(stores["content_text"]) if self.store_ids else None

        total_orders = pd.to_numeric(products["total_orders"], errors="coerce").fillna(0)
        average_rating = pd.to_numeric(products["average_rating"], errors="coerce").fillna(0)
        total_ratings = pd.to_numeric(products["total_ratings"], errors="coerce").fillna(0)
        price = pd.to_numeric(products["price"], errors="coerce").fillna(0)
        compare_price = pd.to_numeric(products["compare_price"], errors="coerce").fillna(0)
        discount = np.where(compare_price > price, (compare_price - price) / compare_price, 0)

        popularity_raw = np.log1p(total_orders) + (average_rating / 5.0) + np.log1p(total_ratings) * 0.25
        self.popularity_scores = self._normalize(popularity_raw.to_numpy())
        self.discount_scores = self._normalize(discount)
        self.has_discount = discount > 0
        self.featured_scores = products["is_featured"].astype(float).to_numpy()
        self.store_popularity_scores = self._normalize(stores["popularity_raw"].to_numpy()) if self.store_ids else np.array([])
        self.store_discount_scores = self._normalize(stores["discount_ratio"].to_numpy()) if self.store_ids else np.array([])
        self.store_featured_scores = stores["is_featured"].astype(float).to_numpy() if self.store_ids else np.array([])
        self.product_meta = {
            row.product_id: ProductMeta(
                product_id=row.product_id,
                vendor_id=str(row.vendor_id),
                vendor_state=str(row.vendor_state or ""),
                vendor_latitude=float(row.vendor_latitude or 0),
                vendor_longitude=float(row.vendor_longitude or 0),
                max_delivery_radius_km=float(row.max_delivery_radius_km or 0),
                discount_ratio=float(discount[index] or 0),
            )
            for index, row in products.iterrows()
        }
        self.store_meta = {
            row.store_id: StoreMeta(
                store_id=row.store_id,
                store_state=str(row.vendor_state or ""),
                store_latitude=float(row.vendor_latitude or 0),
                store_longitude=float(row.vendor_longitude or 0),
                max_delivery_radius_km=float(row.max_delivery_radius_km or 0),
            )
            for row in stores.itertuples()
        }
        self.user_interactions = self._build_user_interactions(data.interactions)
        self.store_user_interactions = self._build_store_user_interactions(data.interactions)
        self.model_version = datetime.now(timezone.utc).isoformat()

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "vectorizer": self.vectorizer,
                "product_ids": self.product_ids,
                "product_meta": self.product_meta,
                "store_ids": self.store_ids,
                "store_meta": self.store_meta,
                "product_text_matrix": self.product_text_matrix,
                "store_text_matrix": self.store_text_matrix,
                "popularity_scores": self.popularity_scores,
                "store_popularity_scores": self.store_popularity_scores,
                "discount_scores": self.discount_scores,
                "store_discount_scores": self.store_discount_scores,
                "has_discount": self.has_discount,
                "featured_scores": self.featured_scores,
                "store_featured_scores": self.store_featured_scores,
                "user_interactions": self.user_interactions,
                "store_user_interactions": self.store_user_interactions,
                "model_version": self.model_version,
            },
            path,
        )

    def load(self, path: Path) -> None:
        artifact = joblib.load(path)
        self.vectorizer = artifact["vectorizer"]
        self.product_ids = artifact["product_ids"]
        self.product_meta = artifact["product_meta"]
        self.store_ids = artifact.get("store_ids", [])
        self.store_meta = artifact.get("store_meta", {})
        self.product_text_matrix = artifact["product_text_matrix"]
        self.store_text_matrix = artifact.get("store_text_matrix")
        self.popularity_scores = artifact["popularity_scores"]
        self.store_popularity_scores = artifact.get("store_popularity_scores", np.array([]))
        self.discount_scores = artifact["discount_scores"]
        self.store_discount_scores = artifact.get("store_discount_scores", np.array([]))
        self.has_discount = artifact.get("has_discount", self.discount_scores > 0)
        self.featured_scores = artifact["featured_scores"]
        self.store_featured_scores = artifact.get("store_featured_scores", np.array([]))
        self.user_interactions = artifact["user_interactions"]
        self.store_user_interactions = artifact.get("store_user_interactions", {})
        self.model_version = artifact["model_version"]

    def recommend_for_user(
        self,
        user_id: str | None,
        limit: int,
        recommendation_type: RecommendationType,
        location: LocationContext | None = None,
    ) -> list[RecommendationItem]:
        if not self.product_ids:
            return []

        user_scores = self._user_affinity_scores(user_id)
        scores = (
            0.55 * user_scores
            + 0.25 * self.popularity_scores
            + 0.15 * self.discount_scores
            + 0.05 * self.featured_scores
        )

        if recommendation_type == "flash_deals":
            scores = scores + (0.4 * self.discount_scores)
            allowed = self.has_discount
        else:
            allowed = np.ones(len(self.product_ids), dtype=bool)

        allowed = allowed & self._location_mask(location)
        ranked = self._rank(scores, allowed, limit)
        return [
            RecommendationItem(
                product_id=self.product_ids[index],
                score=round(float(scores[index]), 6),
                reason=self._reason(index, recommendation_type, user_scores[index]),
            )
            for index in ranked
        ]

    def similar_products(
        self,
        product_id: str,
        limit: int,
        user_id: str | None = None,
        location: LocationContext | None = None,
    ) -> list[RecommendationItem]:
        if product_id not in self.product_ids or self.product_text_matrix is None:
            return []
        base_index = self.product_ids.index(product_id)
        scores = cosine_similarity(
            self.product_text_matrix[base_index],
            self.product_text_matrix,
        ).ravel()
        if user_id:
            scores = (0.8 * scores) + (0.2 * self._user_affinity_scores(user_id))
        allowed = self._location_mask(location)
        allowed[base_index] = False
        ranked = self._rank(scores, allowed, limit)
        return [
            RecommendationItem(
                product_id=self.product_ids[index],
                score=round(float(scores[index]), 6),
                reason="Similar product",
            )
            for index in ranked
        ]

    def recommend_stores_for_user(
        self,
        user_id: str | None,
        limit: int,
        location: LocationContext | None = None,
    ) -> list[StoreRecommendationItem]:
        if not self.store_ids:
            return []

        user_scores = self._store_user_affinity_scores(user_id)
        scores = (
            0.55 * user_scores
            + 0.25 * self.store_popularity_scores
            + 0.10 * self.store_discount_scores
            + 0.10 * self.store_featured_scores
        )
        allowed = self._store_location_mask(location)
        ranked = self._rank(scores, allowed, limit)
        return [
            StoreRecommendationItem(
                store_id=self.store_ids[index],
                score=round(float(scores[index]), 6),
                reason=self._store_reason(index, user_scores[index]),
            )
            for index in ranked
        ]

    def similar_stores(
        self,
        store_id: str,
        limit: int,
        user_id: str | None = None,
        location: LocationContext | None = None,
    ) -> list[StoreRecommendationItem]:
        if store_id not in self.store_ids or self.store_text_matrix is None:
            return []
        base_index = self.store_ids.index(store_id)
        scores = cosine_similarity(
            self.store_text_matrix[base_index],
            self.store_text_matrix,
        ).ravel()
        if user_id:
            scores = (0.8 * scores) + (0.2 * self._store_user_affinity_scores(user_id))
        allowed = self._store_location_mask(location)
        allowed[base_index] = False
        ranked = self._rank(scores, allowed, limit)
        return [
            StoreRecommendationItem(
                store_id=self.store_ids[index],
                score=round(float(scores[index]), 6),
                reason="Similar store",
            )
            for index in ranked
        ]

    def _reset_empty(self) -> None:
        self.product_ids = []
        self.product_meta = {}
        self.store_ids = []
        self.store_meta = {}
        self.product_text_matrix = None
        self.store_text_matrix = None
        self.popularity_scores = np.array([])
        self.store_popularity_scores = np.array([])
        self.discount_scores = np.array([])
        self.store_discount_scores = np.array([])
        self.has_discount = np.array([])
        self.featured_scores = np.array([])
        self.store_featured_scores = np.array([])
        self.user_interactions = {}
        self.store_user_interactions = {}
        self.model_version = datetime.now(timezone.utc).isoformat()

    def _content_text(self, row) -> str:
        fields = [
            row.get("name", ""),
            row.get("brand", ""),
            row.get("category_name", ""),
            row.get("search_keywords", ""),
            row.get("description", ""),
            row.get("store_name", ""),
        ]
        text = " ".join(str(value or "").lower() for value in fields).strip()
        return text or "product"

    def _build_store_frame(self, products: pd.DataFrame) -> pd.DataFrame:
        if products.empty:
            return pd.DataFrame()
        products = products.copy()
        products["discount_ratio"] = np.where(
            pd.to_numeric(products["compare_price"], errors="coerce").fillna(0)
            > pd.to_numeric(products["price"], errors="coerce").fillna(0),
            (
                pd.to_numeric(products["compare_price"], errors="coerce").fillna(0)
                - pd.to_numeric(products["price"], errors="coerce").fillna(0)
            )
            / pd.to_numeric(products["compare_price"], errors="coerce").fillna(1).replace(0, 1),
            0,
        )
        store_rows = []
        for vendor_id, group in products.groupby("vendor_id", dropna=True):
            total_orders = pd.to_numeric(group["total_orders"], errors="coerce").fillna(0)
            total_ratings = pd.to_numeric(group["total_ratings"], errors="coerce").fillna(0)
            average_rating = pd.to_numeric(group["average_rating"], errors="coerce").fillna(0)
            weighted_rating = (
                float((average_rating * total_ratings).sum() / max(total_ratings.sum(), 1))
                if len(group)
                else 0
            )
            category_text = " ".join(sorted(set(group["category_name"].fillna("").astype(str))))
            product_text = " ".join(group["name"].fillna("").astype(str).head(30))
            brand_text = " ".join(sorted(set(group["brand"].fillna("").astype(str))))
            first = group.iloc[0]
            store_rows.append({
                "store_id": str(vendor_id),
                "store_name": str(first.get("store_name") or ""),
                "vendor_city": str(first.get("vendor_city") or ""),
                "vendor_state": str(first.get("vendor_state") or ""),
                "vendor_latitude": float(first.get("vendor_latitude") or 0),
                "vendor_longitude": float(first.get("vendor_longitude") or 0),
                "max_delivery_radius_km": float(first.get("max_delivery_radius_km") or 0),
                "is_featured": float(bool(group["is_featured"].astype(bool).any())),
                "discount_ratio": float(pd.to_numeric(group["discount_ratio"], errors="coerce").fillna(0).mean()),
                "popularity_raw": float(np.log1p(total_orders.sum()) + (weighted_rating / 5.0) + np.log1p(total_ratings.sum()) * 0.25),
                "content_text": " ".join([
                    str(first.get("store_name") or ""),
                    str(first.get("vendor_city") or ""),
                    str(first.get("vendor_state") or ""),
                    category_text,
                    brand_text,
                    product_text,
                ]).lower().strip() or "store",
            })
        return pd.DataFrame(store_rows)

    def _build_user_interactions(self, interactions: pd.DataFrame) -> dict[str, dict[str, float]]:
        if interactions.empty:
            return {}
        interactions = interactions.copy()
        interactions["product_id"] = interactions["product_id"].astype(str)
        interactions["user_id"] = interactions["user_id"].astype(str)
        interactions["strength"] = pd.to_numeric(interactions["strength"], errors="coerce").fillna(1.0)
        interactions["event_weight"] = interactions["event_type"].map(EVENT_WEIGHTS).fillna(1.0)
        interactions["weighted_strength"] = interactions["strength"] * interactions["event_weight"]

        grouped = interactions.groupby(["user_id", "product_id"])["weighted_strength"].sum().reset_index()
        user_map: dict[str, dict[str, float]] = {}
        for row in grouped.itertuples():
            if row.product_id in self.product_ids:
                user_map.setdefault(row.user_id, {})[row.product_id] = float(row.weighted_strength)
        return user_map

    def _build_store_user_interactions(self, interactions: pd.DataFrame) -> dict[str, dict[str, float]]:
        if interactions.empty or not self.store_ids:
            return {}
        product_to_store = {
            product_id: meta.vendor_id
            for product_id, meta in self.product_meta.items()
        }
        interactions = interactions.copy()
        interactions["product_id"] = interactions["product_id"].astype(str)
        interactions["user_id"] = interactions["user_id"].astype(str)
        interactions["store_id"] = interactions["product_id"].map(product_to_store)
        interactions = interactions[interactions["store_id"].isin(self.store_ids)]
        if interactions.empty:
            return {}
        interactions["strength"] = pd.to_numeric(interactions["strength"], errors="coerce").fillna(1.0)
        interactions["event_weight"] = interactions["event_type"].map(EVENT_WEIGHTS).fillna(1.0)
        interactions["weighted_strength"] = interactions["strength"] * interactions["event_weight"]

        grouped = interactions.groupby(["user_id", "store_id"])["weighted_strength"].sum().reset_index()
        user_map: dict[str, dict[str, float]] = {}
        for row in grouped.itertuples():
            user_map.setdefault(row.user_id, {})[row.store_id] = float(row.weighted_strength)
        return user_map

    def _user_affinity_scores(self, user_id: str | None) -> np.ndarray:
        if not user_id or user_id not in self.user_interactions or self.product_text_matrix is None:
            return self.popularity_scores.copy()

        interactions = self.user_interactions[user_id]
        weighted_vectors = []
        weights = []
        for product_id, weight in interactions.items():
            try:
                index = self.product_ids.index(product_id)
            except ValueError:
                continue
            weighted_vectors.append(self.product_text_matrix[index])
            weights.append(weight)

        if not weighted_vectors:
            return self.popularity_scores.copy()

        profile = sum(vector.multiply(weight) for vector, weight in zip(weighted_vectors, weights)) / max(sum(weights), 1.0)
        similarity = cosine_similarity(profile, self.product_text_matrix).ravel()
        return self._normalize(similarity)

    def _store_user_affinity_scores(self, user_id: str | None) -> np.ndarray:
        if not user_id or user_id not in self.store_user_interactions or self.store_text_matrix is None:
            return self.store_popularity_scores.copy()

        interactions = self.store_user_interactions[user_id]
        weighted_vectors = []
        weights = []
        for store_id, weight in interactions.items():
            try:
                index = self.store_ids.index(store_id)
            except ValueError:
                continue
            weighted_vectors.append(self.store_text_matrix[index])
            weights.append(weight)

        if not weighted_vectors:
            return self.store_popularity_scores.copy()

        profile = sum(vector.multiply(weight) for vector, weight in zip(weighted_vectors, weights)) / max(sum(weights), 1.0)
        similarity = cosine_similarity(profile, self.store_text_matrix).ravel()
        return self._normalize(similarity)

    def _rank(self, scores: np.ndarray, allowed: np.ndarray, limit: int) -> list[int]:
        if len(scores) == 0:
            return []
        masked_scores = np.where(allowed, scores, -np.inf)
        ranked = np.argsort(masked_scores)[::-1]
        return [int(index) for index in ranked if np.isfinite(masked_scores[index])][:limit]

    def _location_mask(self, location: LocationContext | None) -> np.ndarray:
        if not location or location.lat is None or location.lng is None:
            return np.ones(len(self.product_ids), dtype=bool)
        return np.array([
            self._is_serviceable(self.product_meta[product_id], location)
            for product_id in self.product_ids
        ])

    def _is_serviceable(self, meta: ProductMeta, location: LocationContext) -> bool:
        if location.state and meta.vendor_state and location.state.strip().lower() != meta.vendor_state.strip().lower():
            return False
        max_distance = meta.max_delivery_radius_km or 0
        if max_distance <= 0:
            return False
        distance = self._haversine(meta.vendor_latitude, meta.vendor_longitude, location.lat or 0, location.lng or 0)
        return distance <= max_distance

    def _store_location_mask(self, location: LocationContext | None) -> np.ndarray:
        if not location or location.lat is None or location.lng is None:
            return np.ones(len(self.store_ids), dtype=bool)
        return np.array([
            self._is_store_serviceable(self.store_meta[store_id], location)
            for store_id in self.store_ids
        ])

    def _is_store_serviceable(self, meta: StoreMeta, location: LocationContext) -> bool:
        if location.state and meta.store_state and location.state.strip().lower() != meta.store_state.strip().lower():
            return False
        max_distance = meta.max_delivery_radius_km or 0
        if max_distance <= 0:
            return False
        distance = self._haversine(meta.store_latitude, meta.store_longitude, location.lat or 0, location.lng or 0)
        return distance <= max_distance

    @staticmethod
    def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        radius_km = 6371.0
        dlat = radians(lat2 - lat1)
        dlng = radians(lng2 - lng1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
        return 2 * radius_km * asin(sqrt(a))

    @staticmethod
    def _normalize(values) -> np.ndarray:
        array = np.asarray(values, dtype=float)
        if array.size == 0:
            return array
        minimum = np.nanmin(array)
        maximum = np.nanmax(array)
        if not np.isfinite(minimum) or not np.isfinite(maximum) or maximum == minimum:
            return np.zeros_like(array, dtype=float)
        return (array - minimum) / (maximum - minimum)

    def _reason(self, index: int, recommendation_type: RecommendationType, affinity_score: float) -> str:
        if recommendation_type == "flash_deals" and self.discount_scores[index] > 0:
            return "Discounted pick"
        if affinity_score > 0.2:
            return "Based on your activity"
        if self.featured_scores[index] > 0:
            return "Featured nearby"
        return "Popular nearby"

    def _store_reason(self, index: int, affinity_score: float) -> str:
        if affinity_score > 0.2:
            return "Based on your shopping activity"
        if self.store_featured_scores[index] > 0:
            return "Featured nearby store"
        if self.store_discount_scores[index] > 0:
            return "Deals at this store"
        return "Popular nearby store"
