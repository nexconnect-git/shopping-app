from typing import Literal

from pydantic import BaseModel, Field


RecommendationType = Literal["recommended", "flash_deals"]


class LocationContext(BaseModel):
    lat: float | None = None
    lng: float | None = None
    city: str = ""
    state: str = ""
    postal_code: str = ""


class UserRecommendationRequest(BaseModel):
    user_id: str | None = None
    limit: int = Field(default=16, ge=1, le=100)
    recommendation_type: RecommendationType = "recommended"
    location: LocationContext | None = None


class SimilarProductsRequest(BaseModel):
    product_id: str
    user_id: str | None = None
    limit: int = Field(default=12, ge=1, le=100)
    location: LocationContext | None = None


class StoreRecommendationRequest(BaseModel):
    user_id: str | None = None
    limit: int = Field(default=12, ge=1, le=100)
    location: LocationContext | None = None


class SimilarStoresRequest(BaseModel):
    store_id: str
    user_id: str | None = None
    limit: int = Field(default=12, ge=1, le=100)
    location: LocationContext | None = None


class RecommendationItem(BaseModel):
    product_id: str
    score: float
    reason: str


class StoreRecommendationItem(BaseModel):
    store_id: str
    score: float
    reason: str


class RecommendationResponse(BaseModel):
    backend: str
    model_version: str
    items: list[RecommendationItem]
    fallback_used: bool = False


class StoreRecommendationResponse(BaseModel):
    backend: str
    model_version: str
    items: list[StoreRecommendationItem]
    fallback_used: bool = False


class RefreshResponse(BaseModel):
    backend: str
    model_version: str
    product_count: int
    store_count: int
    interaction_count: int
    status: str


class HealthResponse(BaseModel):
    status: str
    backend: str
    model_loaded: bool
    model_version: str | None = None
