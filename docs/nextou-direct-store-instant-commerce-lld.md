# Nextou Direct-Store Instant Commerce LLD

## 1. Core Entities

### ParentCatalogItem
Fields:
- id
- name
- brand
- categoryId
- subcategoryId
- unit
- description
- imageUrls
- attributes
- status
- createdByAdminId
- createdAt
- updatedAt

Rules:
- Created by admin only.
- Does not contain store price.
- Does not contain store stock.
- Does not belong to one vendor.

Current model mapping:
- `products.CatalogProduct`
- `products.CatalogProductImage`

### VendorProduct
Fields:
- id
- storeId
- vendorId
- parentCatalogItemId
- sku
- packSize
- price
- comparePrice
- stockQty
- reservedQty
- lowStockThreshold
- visibility
- approvalStatus
- instantDelivery
- scheduledDelivery
- active
- createdAt
- updatedAt

Rules:
- Must link to ParentCatalogItem.
- Belongs to store/vendor.
- Contains selling fields.

Current model mapping:
- `products.Product` (requires strict non-null `catalog_product` for sellable states)

### Store
Fields:
- id
- vendorId
- name
- categoryIds
- address
- latitude
- longitude
- deliveryRadiusKm
- minOrderAmount
- prepTimeMinutes
- openingHours
- isOpen
- acceptingOrders
- status

Current model mapping:
- `vendors.Vendor`
- `vendors.VendorServiceableArea`

### Cart
Fields:
- customerId
- storeId
- items
- couponCode
- updatedAt

Current model mapping:
- `orders.Cart`
- `orders.CartItem`

### CartItem
Fields:
- vendorProductId
- parentCatalogItemId
- quantity
- priceAtAdd

Current model mapping:
- `orders.CartItem` with `price_at_add`

### Order
Fields:
- id
- orderNumber
- customerId
- storeId
- vendorId
- deliveryPartnerId
- addressId
- status
- paymentStatus
- paymentMethod
- itemTotal
- deliveryFee
- platformFee
- discountAmount
- totalAmount
- createdAt
- updatedAt

Current model mapping:
- `orders.Order`

### OrderItemSnapshot
Fields:
- id
- orderId
- vendorProductId
- parentCatalogItemId
- productName
- brand
- packSize
- unitPrice
- quantity
- totalPrice
- storeId

Current model mapping:
- `orders.OrderItem` with direct-store snapshot fields:
  - `catalog_product`
  - `vendor`
  - `product_brand`
  - `product_unit`
  - `product_pack_size`
  - `product_sku`
  - `product_slug`
  - `product_compare_price`

### InventoryReservation
Fields:
- id
- cartId
- orderId
- orderItemId
- vendorProductId
- storeId/vendorId
- quantity
- priceAtReservation
- status
- reservedUntil
- committedAt
- releasedAt
- createdAt
- updatedAt

Rules:
- Created during checkout/order creation.
- Committed after stock decrement succeeds.
- Released when committed stock is restored on cancellation.

Current model mapping:
- `orders.InventoryReservation`

### DeliveryAssignment
Fields:
- id
- orderId
- storeId
- deliveryPartnerId
- status
- pickupOtp
- deliveryOtp
- pickupLatitude
- pickupLongitude
- dropLatitude
- dropLongitude
- assignedAt
- acceptedAt
- pickedUpAt
- deliveredAt

Current model mapping:
- `delivery.DeliveryAssignment`
- `orders.Order` pickup/delivery OTP and delivery lat/lng fields

## 2. Order State Machine
States:
- CREATED
- PENDING_PAYMENT
- CONFIRMED
- VENDOR_ACCEPTED
- PREPARING
- PACKED
- READY_FOR_PICKUP
- DELIVERY_ASSIGNED
- PICKED_UP
- OUT_FOR_DELIVERY
- ARRIVED_AT_CUSTOMER
- DELIVERED
- CANCELLED
- REFUNDED

Current status mapping in code:
- placed
- confirmed
- preparing
- ready
- picked_up
- on_the_way
- delivered
- cancelled

Ownership:
- Customer: created/payment/tracking completion
- Vendor: accepted/preparing/ready
- Delivery: assignment/pickup/transit/delivery
- Admin: monitoring and controlled overrides

## 3. Delivery State Machine
States:
- AVAILABLE
- ASSIGNED
- ACCEPTED
- ARRIVED_AT_STORE
- PICKUP_VERIFIED
- PICKED_UP
- ON_THE_WAY
- ARRIVED_AT_CUSTOMER
- DELIVERY_VERIFIED
- DELIVERED
- CANCELLED
- TIMED_OUT

Current status mapping:
- `delivery_assignment`: searching/notified/accepted/timed_out/failed/cancelled
- `order`: ready/picked_up/on_the_way/delivered/cancelled

## 4. Payment State Machine
States:
- CREATED
- PENDING
- SUCCESS
- FAILED
- REFUND_INITIATED
- REFUNDED

Current mapping:
- `orders.Order.is_payment_verified`
- `orders.Order.refund_status` (none/initiated/processed/failed)
- payment sessions and Razorpay flows

## 5. Catalog Lifecycle
1. Admin creates parent catalog item
2. Parent catalog item active
3. Vendor inherits item into vendor product
4. Vendor product draft
5. Pending approval
6. Approved
7. Visible to customer when serviceable and in-stock

Catalog request lifecycle:
1. Vendor submits catalog request
2. Admin reviews
3. Approved -> creates parent catalog item
4. Rejected -> vendor sees reason

## 6. Inventory Lifecycle
1. Vendor updates stock
2. Available stock changes
3. Customer product availability updates
4. Customer adds to cart
5. Checkout/order creation records reservation ledger rows
6. Stock decrement commits reservations
7. Payment/order confirmation keeps committed inventory history

Failure behavior:
- payment failed -> release reservation
- order cancelled -> release/refund stock by state
- vendor rejects -> release stock/refund as required

## 7. Required APIs (Target)

### Customer APIs (target contract)
- `GET /api/customer/home`
- `GET /api/customer/stores/nearby?lat=&lng=`
- `GET /api/customer/stores/:storeId`
- `GET /api/customer/stores/:storeId/products`
- `GET /api/customer/categories`
- `GET /api/customer/search?q=&lat=&lng=`
- `GET /api/customer/products/:vendorProductId`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:vendorProductId`
- `DELETE /api/cart/items/:vendorProductId`
- `POST /api/cart/replace`
- `POST /api/cart/apply-coupon`
- `POST /api/checkout/preview`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/orders/:id/tracking`
- `POST /api/orders/:id/rate`
- `POST /api/orders/:id/reorder`

Current equivalent endpoints exist under `/api/vendors`, `/api/products`, `/api/orders`, and `/api/orders/issues`.

### Vendor APIs (target contract)
- `GET /api/vendor/dashboard`
- `GET /api/vendor/store`
- `PATCH /api/vendor/store/settings`
- `GET /api/vendor/orders/live`
- `PATCH /api/vendor/orders/:id/status`
- `POST /api/vendor/orders/:id/ready-for-pickup`
- `GET /api/vendor/parent-catalog/search`
- `POST /api/vendor/products/from-catalog`
- `GET /api/vendor/products`
- `PATCH /api/vendor/products/:id`
- `PATCH /api/vendor/products/:id/inventory`
- `POST /api/vendor/catalog-requests`
- `GET /api/vendor/catalog-requests`
- `GET /api/vendor/payouts`
- `GET /api/vendor/support/tickets`

Current equivalent endpoints exist under `/api/vendors/*`.

### Delivery APIs (target contract)
- `GET /api/delivery/dashboard`
- `POST /api/delivery/availability`
- `GET /api/delivery/available-orders`
- `POST /api/delivery/orders/:id/accept`
- `POST /api/delivery/orders/:id/reject`
- `GET /api/delivery/active-order`
- `PATCH /api/delivery/orders/:id/status`
- `POST /api/delivery/orders/:id/verify-pickup-otp`
- `POST /api/delivery/orders/:id/verify-delivery-otp`
- `POST /api/delivery/location`
- `GET /api/delivery/earnings`
- `GET /api/delivery/history`

Current equivalent endpoints exist under `/api/delivery/*` and assignment endpoints.

### Admin APIs (target contract)
- `GET /api/admin/dashboard`
- `GET /api/admin/vendors`
- `PATCH /api/admin/vendors/:id/approve`
- `PATCH /api/admin/vendors/:id/reject`
- `GET /api/admin/stores`
- `PATCH /api/admin/stores/:id`
- `GET /api/admin/parent-catalog`
- `POST /api/admin/parent-catalog`
- `PATCH /api/admin/parent-catalog/:id`
- `GET /api/admin/catalog-requests`
- `PATCH /api/admin/catalog-requests/:id/approve`
- `PATCH /api/admin/catalog-requests/:id/reject`
- `GET /api/admin/vendor-products`
- `PATCH /api/admin/vendor-products/:id/approve`
- `PATCH /api/admin/vendor-products/:id/reject`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`
- `POST /api/admin/delivery/reassign`
- `GET /api/admin/coupons`
- `POST /api/admin/coupons`
- `GET /api/admin/banners`
- `POST /api/admin/banners`
- `GET /api/admin/support/tickets`
- `GET /api/admin/feature-flags`
- `PATCH /api/admin/feature-flags`

Current equivalents exist under `/api/admin/*`, with naming differences.

### API review matrix (existing/missing, app usage, DTO/model, priority)

| Domain | Target API | Current equivalent | Status | Primary app(s) | Request/Response DTO notes | Backend model/action needed | Priority |
|---|---|---|---|---|---|---|---|
| Customer home | `GET /api/customer/home` | stitched via `vendors/list`, `products/list`, `orders/banners`, `orders/coupons` | Missing unified endpoint | customer-app | Aggregate home payload DTO missing | Aggregation action + serializer | P1 |
| Store nearby | `GET /api/customer/stores/nearby` | `GET /api/vendors/list/?search_mode=nearby` | Exists (different naming) | customer-app | Query DTO exists; normalize response envelope | optional alias route | P2 |
| Store detail products | `GET /api/customer/stores/:id/products` | `GET /api/vendors/:id` with embedded `products` | Partially exists | customer-app | Embedded payload can be heavy/variable | dedicated store-products serializer | P2 |
| Cart replace | `POST /api/cart/replace` | `POST /api/orders/cart/replace/` | Exists | customer-app | `product_id`, `quantity` | atomic replace view + serializer | P2 |
| Checkout preview | `POST /api/checkout/preview` | `POST /api/orders/checkout-preview/` | Exists (different naming) | customer-app | core DTO exists; normalize naming | alias route optional | P3 |
| Vendor parent catalog search | `GET /api/vendor/parent-catalog/search` | `GET /api/vendors/catalog-products/available/` | Exists (different naming) | vendor-app | DTO exists | alias route optional | P3 |
| Vendor create from catalog | `POST /api/vendor/products/from-catalog` | `POST /api/vendors/products/from-catalog/` | Exists | vendor-app | DTO exists | strict validation for parent link | P1 |
| Inventory reservation | n/a | `orders.InventoryReservation` ledger | Exists | customer+vendor+backend | internal ledger, no public DTO needed yet | commit/release in order lifecycle | P1 |
| Delivery active order | `GET /api/delivery/active-order` | `GET /api/delivery/dashboard/` + active_orders array | Partially exists | delivery-app | explicit active-order DTO missing | optional focused endpoint | P2 |
| Delivery OTP verify pickup | `POST /api/delivery/orders/:id/verify-pickup-otp` | vendor-side pickup verify endpoint exists; delivery side implicit | Partial | vendor+delivery | contract split is unclear | explicit delivery pickup verify endpoint | P2 |
| Admin dispatch reassign | `POST /api/admin/delivery/reassign` | `POST /api/admin/delivery/orders/:id/reassign/` | Exists | admin-panel | optional `delivery_partner_id`, `reason`; returns normalized order | reassignment action + audit | P1 |
| Admin feature flags | `PATCH /api/admin/feature-flags` | `/api/admin/feature-flags/` CRUD exists | Exists | admin-panel | DTO exists but enforcement breadth varies | action-level guard audit | P2 |
| Unified status payload | all order/delivery endpoints | normalized order/payment/delivery fields added to order and assignment serializers | Exists additively | all apps | legacy status preserved with normalized fields | helper-backed serializer normalization | P1 |

## 8. UI Component Design
### Customer components
- mobile-topbar
- location-pill
- search-bar
- category-tabs
- promo-banner
- store-card
- product-card
- product-row
- quantity-stepper
- mini-cart
- price-summary
- checkout-stepper
- tracking-timeline
- bottom-nav
- bottom-sheet
- toast

### Vendor components
- kpi-card
- store-status-card
- order-prep-card
- order-kanban
- inventory-editor
- product-approval-badge
- catalog-selector
- catalog-request-form
- settings-section-card
- payout-ledger

### Delivery components
- online-toggle
- delivery-request-card
- route-summary
- active-delivery-map
- phase-timeline
- primary-action-footer
- otp-sheet
- earnings-card

### Admin components
- admin-sidebar
- admin-topbar
- kpi-card
- data-table
- filter-bar
- detail-drawer
- approval-modal
- status-chip
- bulk-action-toolbar
- audit-timeline
- dispatch-board

## 9. Events and Notifications
Events:
- customer.created
- vendor.registered
- vendor.approved
- catalog.requested
- catalog.approved
- catalog.rejected
- vendor_product.submitted
- vendor_product.approved
- vendor_product.rejected
- order.created
- payment.success
- payment.failed
- vendor.order_received
- vendor.order_ready
- delivery.assignment_created
- delivery.assignment_accepted
- delivery.picked_up
- delivery.delivered
- order.cancelled
- refund.created
- support.ticket_created
- feature_flag.updated

Notification channels:
- in-app
- push
- email
- SMS/OTP
- websocket for live order/tracking

## 10. Testing Plan
- Customer flow tests
- Vendor flow tests
- Delivery flow tests
- Admin flow tests
- Backend unit/integration tests
- UI responsive and state tests
- Performance checks for critical paths
- Security/permission and idempotency checks

## 11. Priority Engineering Gaps
1. Broaden automated tests around direct-store checkout, inventory reservation release, and dispatch reassignment.
2. Consolidate legacy and assignment delivery acceptance paths into one public contract.
3. Add optional alias routes for target `/api/customer/*`, `/api/vendor/*`, and `/api/admin/parent-catalog/*` naming.
4. Tune frontend initial bundle budgets for vendor, delivery, and admin apps.
5. Add fuller server-side feature-flag enforcement for sensitive action boundaries.

## 12. Test Baseline Reality
- No backend source tests are kept in the repository.
- `backend.config.local_sqlite` is available for Windows-safe smoke checks.
- `python manage.py check --settings=backend.config.local_sqlite` runs Django system checks without RQ fork usage.
