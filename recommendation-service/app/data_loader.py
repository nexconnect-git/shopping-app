from dataclasses import dataclass

import pandas as pd

from app.db import get_connection


@dataclass
class TrainingData:
    products: pd.DataFrame
    interactions: pd.DataFrame


PRODUCT_QUERY = """
SELECT
    p.id::text AS product_id,
    p.vendor_id::text AS vendor_id,
    p.category_id::text AS category_id,
    p.name,
    COALESCE(p.description, '') AS description,
    COALESCE(p.search_keywords, '') AS search_keywords,
    COALESCE(p.brand, '') AS brand,
    COALESCE(p.price, 0) AS price,
    COALESCE(p.compare_price, 0) AS compare_price,
    COALESCE(p.stock, 0) AS stock,
    COALESCE(p.is_featured, false) AS is_featured,
    COALESCE(p.average_rating, 0) AS average_rating,
    COALESCE(p.total_ratings, 0) AS total_ratings,
    COALESCE(p.total_orders, 0) AS total_orders,
    COALESCE(c.name, '') AS category_name,
    COALESCE(v.store_name, '') AS store_name,
    COALESCE(v.city, '') AS vendor_city,
    COALESCE(v.state, '') AS vendor_state,
    COALESCE(v.latitude, 0) AS vendor_latitude,
    COALESCE(v.longitude, 0) AS vendor_longitude,
    COALESCE(v.instant_delivery_radius_km, 0) AS instant_delivery_radius_km,
    COALESCE(v.max_delivery_radius_km, 0) AS max_delivery_radius_km
FROM products_product p
JOIN vendors_vendor v ON p.vendor_id = v.id
LEFT JOIN products_category c ON p.category_id = c.id
WHERE p.approval_status = 'approved'
  AND p.status = 'active'
  AND p.is_available = true
  AND p.stock > 0
  AND p.catalog_product_id IS NOT NULL
  AND v.status = 'approved'
  AND v.is_open = true
  AND v.is_accepting_orders = true
  AND (c.id IS NULL OR (c.is_active = true AND c.show_in_customer_ui = true))
"""

ORDER_INTERACTION_QUERY = """
SELECT
    o.customer_id::text AS user_id,
    oi.product_id::text AS product_id,
    SUM(oi.quantity)::float AS strength,
    'purchase' AS event_type
FROM orders_orderitem oi
JOIN orders_order o ON oi.order_id = o.id
WHERE oi.product_id IS NOT NULL
  AND o.status <> 'cancelled'
GROUP BY o.customer_id, oi.product_id
"""

CART_INTERACTION_QUERY = """
SELECT
    c.user_id::text AS user_id,
    ci.product_id::text AS product_id,
    SUM(ci.quantity)::float AS strength,
    'cart' AS event_type
FROM orders_cartitem ci
JOIN orders_cart c ON ci.cart_id = c.id
GROUP BY c.user_id, ci.product_id
"""

WISHLIST_INTERACTION_QUERY = """
SELECT
    user_id::text AS user_id,
    product_id::text AS product_id,
    1.0 AS strength,
    'wishlist' AS event_type
FROM products_wishlist
"""

REVIEW_INTERACTION_QUERY = """
SELECT
    customer_id::text AS user_id,
    product_id::text AS product_id,
    rating::float AS strength,
    'rating' AS event_type
FROM products_productreview
"""


def load_training_data() -> TrainingData:
    with get_connection() as connection:
        products = pd.read_sql_query(PRODUCT_QUERY, connection)
        interaction_frames = [
            pd.read_sql_query(ORDER_INTERACTION_QUERY, connection),
            pd.read_sql_query(CART_INTERACTION_QUERY, connection),
            pd.read_sql_query(WISHLIST_INTERACTION_QUERY, connection),
            pd.read_sql_query(REVIEW_INTERACTION_QUERY, connection),
        ]

    interactions = pd.concat(interaction_frames, ignore_index=True)
    if not products.empty and not interactions.empty:
        visible_ids = set(products["product_id"].astype(str))
        interactions = interactions[interactions["product_id"].astype(str).isin(visible_ids)]
    return TrainingData(products=products, interactions=interactions)
