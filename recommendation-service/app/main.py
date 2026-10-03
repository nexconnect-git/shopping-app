import hmac

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.model_store import model_store
from app.schemas import (
    HealthResponse,
    RecommendationResponse,
    RefreshResponse,
    SimilarProductsRequest,
    SimilarStoresRequest,
    StoreRecommendationRequest,
    StoreRecommendationResponse,
    UserRecommendationRequest,
)

app = FastAPI(title="Nextou Recommendation Service", version="1.0.0")
admin_bearer = HTTPBearer(auto_error=False)


def require_model_admin(credentials: HTTPAuthorizationCredentials | None = Depends(admin_bearer)):
    if not settings.model_admin_token:
        raise HTTPException(status_code=503, detail='Manual model refresh is disabled.')
    if not credentials or not hmac.compare_digest(credentials.credentials, settings.model_admin_token):
        raise HTTPException(status_code=401, detail='A valid model administration token is required.')


def current_model():
    model = model_store.current_recommender()
    if model is None:
        raise HTTPException(status_code=503, detail='Recommendation model is not trained yet.')
    return model


@app.on_event("startup")
def startup() -> None:
    loaded = model_store.load()
    if not loaded and settings.train_on_startup:
        model_store.train_and_save()


@app.get("/health/", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        backend=model_store.backend_name,
        model_loaded=model_store.loaded,
        model_version=model_store.model_version,
    )


@app.post("/v1/recommendations/user", response_model=RecommendationResponse)
def user_recommendations(payload: UserRecommendationRequest) -> RecommendationResponse:
    model = current_model()
    items = model.recommend_for_user(
        user_id=payload.user_id,
        limit=payload.limit,
        recommendation_type=payload.recommendation_type,
        location=payload.location,
    )
    return RecommendationResponse(
        backend=model.backend_name,
        model_version=model.model_version or "",
        items=items,
        fallback_used=False,
    )


@app.post("/v1/recommendations/similar-products", response_model=RecommendationResponse)
def similar_products(payload: SimilarProductsRequest) -> RecommendationResponse:
    model = current_model()
    items = model.similar_products(
        product_id=payload.product_id,
        user_id=payload.user_id,
        limit=payload.limit,
        location=payload.location,
    )
    return RecommendationResponse(
        backend=model.backend_name,
        model_version=model.model_version or "",
        items=items,
        fallback_used=False,
    )


@app.post("/v1/recommendations/stores", response_model=StoreRecommendationResponse)
def store_recommendations(payload: StoreRecommendationRequest) -> StoreRecommendationResponse:
    model = current_model()
    items = model.recommend_stores_for_user(
        user_id=payload.user_id,
        limit=payload.limit,
        location=payload.location,
    )
    return StoreRecommendationResponse(
        backend=model.backend_name,
        model_version=model.model_version or "",
        items=items,
        fallback_used=False,
    )


@app.post("/v1/recommendations/similar-stores", response_model=StoreRecommendationResponse)
def similar_stores(payload: SimilarStoresRequest) -> StoreRecommendationResponse:
    model = current_model()
    items = model.similar_stores(
        store_id=payload.store_id,
        user_id=payload.user_id,
        limit=payload.limit,
        location=payload.location,
    )
    return StoreRecommendationResponse(
        backend=model.backend_name,
        model_version=model.model_version or "",
        items=items,
        fallback_used=False,
    )


@app.post("/v1/model/refresh", response_model=RefreshResponse, dependencies=[Depends(require_model_admin)])
def refresh_model() -> RefreshResponse:
    return model_store.train_and_save()
