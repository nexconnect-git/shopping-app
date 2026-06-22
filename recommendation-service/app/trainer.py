import argparse
import logging
import time

from app.config import settings
from app.model_store import model_store

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def train_once() -> None:
    result = model_store.train_and_save()
    logger.info(
        "Recommendation model trained: backend=%s version=%s products=%s interactions=%s",
        result.backend,
        result.model_version,
        result.product_count,
        result.interaction_count,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--loop", action="store_true", help="Train forever on the configured interval.")
    args = parser.parse_args()

    if not args.loop:
        train_once()
        return

    while True:
        try:
            train_once()
        except Exception:
            logger.exception("Recommendation training failed.")
        time.sleep(settings.trainer_interval_seconds)


if __name__ == "__main__":
    main()
