from dataclasses import dataclass
import os
from pathlib import Path


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _bool_env(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    db_name: str = os.environ.get("DB_NAME", "nc_shopping_app")
    db_user: str = os.environ.get("DB_USER", "postgres")
    db_password: str = os.environ.get("DB_PASSWORD", "admin")
    db_host: str = os.environ.get("DB_HOST", "db")
    db_port: int = _int_env("DB_PORT", 5432)
    model_backend: str = os.environ.get("RECOMMENDER_MODEL_BACKEND", "sklearn_hybrid")
    model_dir: Path = Path(os.environ.get("RECOMMENDER_MODEL_DIR", "/models"))
    model_filename: str = os.environ.get("RECOMMENDER_MODEL_FILENAME", "sklearn_hybrid.joblib")
    trainer_interval_seconds: int = _int_env("RECOMMENDER_TRAIN_INTERVAL_SECONDS", 3600)
    train_on_startup: bool = _bool_env("RECOMMENDER_TRAIN_ON_STARTUP", False)

    @property
    def model_path(self) -> Path:
        return self.model_dir / self.model_filename


settings = Settings()
