# Nextou Direct-Store Transformation Audit (Phase 0)

Date: 2026-06-02
Workspace: `D:\Projects\NexConnect\shopping-app`
Scope audited: `frontend/projects/customer-app`, `frontend/projects/vendor-app`, `frontend/projects/delivery-app`, `frontend/projects/admin-panel`, `frontend/projects/shared`, `backend`
Repository state at audit time: parent repo reports `frontend` modified; frontend submodule contains a large pre-existing dirty working tree. This Phase 0 update is documentation-only in the parent repo.

## 1. Apps Found
1. `frontend/projects/customer-app` (customer storefront)
2. `frontend/projects/vendor-app` (vendor operations)
3. `frontend/projects/delivery-app` (delivery operations)
4. `frontend/projects/admin-panel` (admin control center)
5. `frontend/projects/shared` (models/guards/interceptors/services/components)
6. `backend` (Django REST API + Channels + RQ)
7. `backend/files` (uploaded file API mounted at `/api/files/`)
8. `packages/*` (customer domain utility packages: pricing, checkout, search, validation, tokens, etc.)

## 2. Route Map Per App
### customer-app
- `/`, `/new-home`
- `/stores`, `/store/:id`
- `/search`
- `/category/:id`
- `/product/:id`
- `/cart`, `/checkout`
- `/orders`, `/tracking/:id`, `/order-finished/:id`
- `/order/:id/help`, `/order/:id/issue`, `/order/:id/rating`
- `/profile`, `/addresses`, `/offers`, `/wallet`, `/wishlist`, `/referral`
- `/notifications`, `/issues`, `/help`, `/issue/:issueId`

### vendor-app
- `/login`, `/register`, `/change-password`, `/pending-approval`
- `/`
- `/live-orders`
- `/inventory`
- `/products`, `/products/new`, `/products/:id/edit`, `/products/edit/:id`
- `/catalog-requests`
- `/orders`, `/orders/:id`, `/orders/:id/prep`
- `/analytics`
- `/payouts`
- `/promotions`
- `/support`
- `/reviews`
- `/notifications`
- `/store-settings` and `/store/settings`

### delivery-app
- `/login`, `/change-password`
- `/`
- `/available`
- `/active`
- `/history`
- `/earnings`
- `/profile`

### admin-panel
- `/login`, `/setup`, `/change-password`
- `/`
- `/dispatch`
- `/vendors`, `/vendors/onboard`, `/vendors/:id`, `/vendors/:id/edit`, `/vendors/:id/review`
- `/customers`, `/customers/:id`, `/customers/:id/edit`, `/customers/:id/review`
- `/delivery-partners`, `/delivery-partners/onboard`, `/delivery-partners/:id`, `/delivery-partners/:id/edit`, `/delivery-partners/:id/review`
- `/orders`, `/orders/:id`
- `/products`, `/catalog`, `/catalog-requests`, `/vendor-variant-approvals`, `/categories`
- `/assets`, `/payouts`, `/payments`, `/reconciliation`
- `/scheduled-tasks`
- `/platform-settings`, `/settings/page-feature-management`, `/production-readiness`
- `/audit-logs`
- `/issues`
- `/coupons`, `/banners`, `/customer-content`
- `/notifications`
- `/admin-users`

## 3. Service Map Per App
### customer-app local
- `app-state.service.ts` (auth-aware cart/checkout/address/location/payment orchestration)
- `catalog.service.ts` (store/product/category discovery + mapping)
- `order.service.ts` (order list/detail/rating/reorder orchestration)
- `customer-cart-api.service.ts`, `customer-account-api.service.ts`, `customer-catalog-api.service.ts`
- `ui.service.ts`, `customer-content-config.service.ts`

### vendor-app local
- `vendor-order-actions.service.ts` (accept/reject/prepare/ready/search/OTP action wrapper)
- `vendor-product-create.service.ts` (catalog inheritance draft/submission workflow)
- `vendor-product-edit.service.ts` (edit + approval-aware save flow)
- `vendor-store-settings.service.ts` (store open/accepting/delivery radius/pickup coordinates)

### delivery-app
- no dedicated domain services; pages call shared `ApiService` directly

### admin-panel
- mostly shared `ApiService` + local page state
- explicit `page-feature-management.service.ts` for config/publish/polling

### shared cross-app
- `ApiService`, `AuthService`, `NotificationPollingService`, `GoogleMapsService`, `LocationService`, `CurrencyService`
- guards: `authGuard`, `roleGuard`, `pageFeatureGuard`, `approvedVendorGuard`, `portalUnauthGuard`
- interceptors: `authInterceptor`, `cacheInterceptor`
- `models/adapters.ts` exists in the dirty frontend submodule and normalizes order/payment/delivery statuses plus parent catalog, vendor product, and feature flag payloads.

## 4. Shared Model List
From `frontend/projects/shared/src/lib/models/index.ts`:
- catalog: `CatalogProduct`, `CatalogProductImage`, `CatalogProposal`, `CatalogProposalItem`
- vendor/store: `Vendor`, `VendorOperationsSummary`, `VendorAnalytics`
- sellable product: `Product`, `ProductImage`
- order/cart/payment: `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderTracking`, `DeliveryFeePreview`
- delivery: `DeliveryAssignment`, `DeliveryPartner`, `DeliveryDashboard`
- account/support: `User`, `Address`, `SupportTicket`, `Notification`
- feature config: `FeatureFlag`
- direct-store contract types already added: `ParentCatalogItem`, `VendorProduct`, `Inventory`, `OrderItemSnapshot`, `OrderStatus`, `PaymentStatus`, `DeliveryStatus`, `StoreStatus`, `CatalogRequestStatus`, `VendorProductApprovalStatus`

## 5. Existing Direct-Store Logic
- Customer location drives store/product discovery through lat/lng + area query params.
- Backend checkout enforces single-store cart (`multi_store_cart` error when mixed).
- Store open-hours and holiday checks are enforced during checkout preview and order creation.
- Store serviceability and delivery-fee quoting are calculated from vendor pickup coordinates to customer address coordinates.
- Delivery partner search is vendor-triggered from `ready` orders (`start-delivery-search`), not automatic on order placement.
- Checkout/order creation also validate address fields, COD/UPI confirmation, payment method availability, coupons, stock, wallet balance, loyalty redemption, schedule slots, far-delivery confirmation, and customer active state.

## 6. Existing Parent Catalog / Vendor Product Logic
- Parent/master catalog exists as `products.CatalogProduct` (admin CRUD exposed under `/api/admin/catalog-products/*`).
- Vendor sellable products (`products.Product`) support `catalog_product` inheritance link, approval status, and image inheritance mode.
- Vendor flow already supports:
  - fetch approved catalog products
  - create inherited draft batch
  - update inherited variants
  - submit variants for admin approval
- Admin flow already supports pending vendor product review and approve/reject endpoints.
- `catalog_product` remains nullable for historical/draft safety, but sellable active/approved/customer-visible variants are now guarded by model, serializer, action, and public-query checks.

## 7. Existing Cart / Checkout / Order / Payment Logic
- Cart API:
  - `GET /api/orders/cart/`
  - `POST /api/orders/cart/add/`
  - `PATCH /api/orders/cart/items/:id/`
  - `POST /api/orders/cart/clear/`
- Cart model:
  - `orders.Cart` is one-to-one with user and derives store/vendor from `CartItem.product.vendor`
- no explicit `store_id` or coupon field is persisted on cart, but store is derived from cart item vendor and `CartItem.price_at_add` is now persisted.
- Checkout API:
  - `POST /api/orders/delivery-fee-preview/`
  - `POST /api/orders/checkout-preview/`
  - `GET /api/orders/available-slots/`
  - `GET /api/orders/payment-methods/`
- Order API:
  - `POST /api/orders/create/`
  - `GET /api/orders/list/`
  - `GET /api/orders/:id/`, `/tracking/`, `/rate/`, `/reorder/`, `/tip/`
- Payment:
  - Razorpay create/verify + webhook
- payment session model present
- order-level idempotency key present (`client_idempotency_key` unique per customer+vendor)
- Order items now persist direct-store snapshot fields including parent catalog, vendor/store, brand, unit, pack size, SKU, slug, compare price, unit price, quantity, and subtotal.

## 8. Existing Delivery Assignment / Tracking Logic
- Assignment model states: `searching`, `notified`, `accepted`, `timed_out`, `failed`, `cancelled`.
- Radius-expansion logic exists: starts 2 km, grows by 2 km, max 20 km, cycles with partner-list reset.
- Timeout path exists: partner notifications auto-expire; vendor notified to reinitiate.
- Safety check exists in retry loop: `refresh_from_db()` before re-queueing to avoid overwriting accepted/cancelled states.
- WebSocket tracking endpoint exists at `ws/delivery/<order_id>/tracking/`.
- OTP flow:
  - vendor verifies pickup OTP
  - delivery verifies drop OTP + proof photo
- `DeliveryAssignment` tracks radius search and accepted partner, while pickup/drop coordinates and OTP fields currently live mostly on `orders.Order` and related tracking rows rather than on the assignment entity itself.

## 9. Existing Admin Approval Logic
- Vendor onboarding and status approval/rejection endpoints exist.
- Catalog proposal item approve/reject endpoints exist.
- Vendor variant approvals endpoints exist.
- Page-feature management endpoints exist (`/api/admin/settings/page-features/`) and guard enforcement exists client-side.
- Admin audit log endpoint exists (`/api/admin/audit-logs/`).

## 10. Current UI Systems
- Customer app: hybrid desktop + mobile-first system with dedicated `mobile-ui/*` components and legacy shared components still present.
- Vendor app: operational dashboard + workflow pages with heavy status/actions.
- Delivery app: task board + map-centric active delivery flows.
- Admin panel: data tables, approval queues, onboarding forms, command-center patterns.
- Shared style system: `design-system` variables + `fd-*`, `nc-*`, plus app-level alias variables.

## 11. Duplicate or Conflicting UI Systems
- `vendor-app` and `admin-panel` global stylesheets contain very large override blocks with repeated token aliases and repeated selector groups.
- Customer has overlapping UI primitives:
  - classic shared blocks (`shared/*`, `components/*`)
  - separate `mobile-ui/*` component families.
- Cross-app token aliasing duplicates:
  - `--primary`, `--primary-light`, `--surface`, `--text-*`, etc. repeatedly reassigned across app styles.
- Resulting risk: style bleed, hard-to-predict precedence, and difficult responsive consistency.

## 12. Risky Legacy Paths
- `vendors.Vendor.fulfillment_type` still allows non-direct-store platform-fulfillment mode.
- `products.Product.catalog_product` nullable; direct-store catalog inheritance can be bypassed by manual product creation paths.
- Delivery API keeps both assignment-based and legacy direct accept endpoints.
- Backend layering intent exists (actions/data/views), but many views still perform direct ORM calls (`Model.objects`) instead of repository/action-only flow.
- No repository-wide backend source test suite detected (`tests.py` / source `tests/` files are absent or empty in the current tree; only `__pycache__` test artifacts were found).
- `backend/backend/test_settings.py` and `backend/backend/test_urls.py` referenced in AGENTS instructions are not present in current codebase.

## 13. Missing APIs / Contract Gaps
1. Inventory reservation ledger
- Existing: direct decrement/increment stock field updates plus `orders.InventoryReservation` records for reserve/commit/release audit.
- Remaining gap: no pre-payment temporary hold endpoint yet; reservations are recorded during order creation.

2. Strict parent-catalog inheritance enforcement
- Existing: inherited-product endpoints, approval flow, and hard guards for sellable/customer-visible vendor products.
- Remaining gap: legacy draft/historical product rows can still carry null catalog links by design.

3. Dispatch reassignment control endpoint
- Existing: assignment acceptance/cancel/retry flows plus `POST /api/admin/delivery/orders/<order_id>/reassign/` with audit metadata.

4. Unified order/delivery state payload contract
- Existing: frontend supports both normalized and legacy statuses; backend order and assignment serializers now expose normalized status fields additively.

5. Server-side feature-flag enforcement breadth
- Existing: page-feature guard mostly in frontend + some backend config APIs
- Gap: sensitive actions still rely on route-level access; not all feature toggles are enforced at action boundary

6. Cart/order snapshot persistence
- Existing: runtime checkout validation is strong and same-store enforced; cart price-at-add and order item direct-store snapshots now support audit, reorder, refund, and historical price/catalog reconstruction.

## 14. Files Likely to Be Changed
### Frontend shared
- `frontend/projects/shared/src/lib/models/index.ts`
- `frontend/projects/shared/src/lib/services/api.service.ts`
- `frontend/projects/shared/src/lib/services/page-feature-access.service.ts`
- `frontend/projects/shared/src/lib/interceptors/*`

### customer-app
- `frontend/projects/customer-app/src/app/pages/home/*`
- `frontend/projects/customer-app/src/app/pages/search/*`
- `frontend/projects/customer-app/src/app/pages/stores/*`
- `frontend/projects/customer-app/src/app/pages/store-detail/*`
- `frontend/projects/customer-app/src/app/pages/cart/*`
- `frontend/projects/customer-app/src/app/pages/checkout/*`
- `frontend/projects/customer-app/src/app/pages/orders/*`
- `frontend/projects/customer-app/src/app/pages/tracking/*`
- `frontend/projects/customer-app/src/app/services/app-state.service.ts`
- `frontend/projects/customer-app/src/app/services/catalog.service.ts`

### vendor-app
- `frontend/projects/vendor-app/src/app/pages/live-orders/*`
- `frontend/projects/vendor-app/src/app/pages/order-detail/*`
- `frontend/projects/vendor-app/src/app/pages/inventory/*`
- `frontend/projects/vendor-app/src/app/pages/products/*`
- `frontend/projects/vendor-app/src/app/pages/store-settings/*`
- `frontend/projects/vendor-app/src/app/shared/vendor-product-create/*`

### delivery-app
- `frontend/projects/delivery-app/src/app/pages/available-orders/*`
- `frontend/projects/delivery-app/src/app/pages/active-delivery/*`
- `frontend/projects/delivery-app/src/app/pages/dashboard/*`
- `frontend/projects/delivery-app/src/app/pages/history/*`

### admin-panel
- `frontend/projects/admin-panel/src/app/pages/catalog/*`
- `frontend/projects/admin-panel/src/app/pages/catalog-requests/*`
- `frontend/projects/admin-panel/src/app/pages/vendor-variant-approvals/*`
- `frontend/projects/admin-panel/src/app/pages/dispatch-board/*`
- `frontend/projects/admin-panel/src/app/pages/orders/*`
- `frontend/projects/admin-panel/src/app/pages/platform-settings/*`
- `frontend/projects/admin-panel/src/app/shared/page-feature-management/*`

### backend
- `backend/products/models/catalog.py`
- `backend/products/models/product.py`
- `backend/orders/models/cart.py`
- `backend/orders/models/order.py`
- `backend/orders/actions/checkout.py`
- `backend/orders/actions/ordering.py`
- `backend/delivery/models/delivery_assignment.py`
- `backend/delivery/actions/*`
- related serializers, actions, data repositories, views, urls, and migrations
- `backend/backend/test_settings.py` and `backend/backend/test_urls.py` if Windows-safe backend tests are restored per repository instructions

## 15. Recommended Implementation Order
1. Contract and enum normalization in shared + backend response serializers.
2. Backend hard enforcement:
   - strict parent catalog inheritance
   - inventory reservation lifecycle
   - idempotent payment/checkout consistency
3. Customer app store-first UI and workflow unification.
4. Vendor app operational flow hardening (prep/search/inventory/catalog inheritance).
5. Delivery app lifecycle hardening (assignment states, OTP, map/task UX).
6. Admin governance hardening (approval queues, audit, feature and dispatch control).
7. Consolidated QA/performance/security pass across all apps + backend.

## Phase 0 Acceptance Notes
- Audit completed across all requested apps/modules.
- Runtime behavior unchanged (documentation-only updates in this phase).
- Build/test execution deferred in this phase because no runtime code paths were modified.
