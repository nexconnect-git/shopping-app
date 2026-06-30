# Instant Delivery Transformation Plan

## Baseline Snapshot

This document records the Phase 0 audit for transforming the current Nextou customer experience from a store-first marketplace into a Blinkit-style instant-delivery flow. The current codebase is healthy enough to build, but the customer architecture is still centered on vendor stores, with location used as a filter rather than the first hard system boundary.

Baseline checks run on 2026-06-24:

- Backend: `..\venv\Scripts\python.exe manage.py check --settings=backend.config.local_sqlite` from `backend/`, with local SMTP environment values set. Result: pass, `System check identified no issues (1 silenced).`
- Frontend: `npx.cmd ng build customer-app --configuration development` from `frontend/`. Result: pass, output at `frontend/dist/customer-app`.
- `frontend/node_modules` already existed, so `npm install` was not run during this audit.
- No `customer-app-complete-architecture.pdf` or matching architecture PDF was found in the workspace; this audit is based on the live source tree.

Current dirty workspace noticed before changes:

- `frontend` submodule is modified.
- `packages/customer-errors/src/index.ts` is modified.
- `.codex-visual-validation/` is untracked.
- `docs/customer-app-architecture.md` is untracked.

These files were treated as existing work and were not reverted.

## Current Customer Route Map

The customer app routes live in `frontend/projects/customer-app/src/app/app.routes.ts`.

- `/location`: location selection and serviceability check page.
- `/`: customer home.
- `/explore` and `/explore/:categoryId`: product/store discovery.
- `/store/:id`: store detail and product listing.
- `/product/:id`: product detail.
- `/cart`: cart page.
- `/checkout`: checkout page.
- `/orders`: order history.
- `/order-confirmed/:id`: protected confirmation page.
- `/tracking/:id`: protected tracking page.
- `/order-finished/:id`: protected completion page.
- `/account`, `/profile`, `/addresses`: account surfaces.
- Multiple old URLs redirect into `/explore`, `/account`, or order routes.

Gap: `/location` exists, but it is not yet a mandatory gateway for first-time users. `HomeComponent.hasLocation` currently returns `true`, so the first screen can render before a valid serviceable promise is established.

## Current Frontend State And Services

Primary customer state lives in `frontend/projects/customer-app/src/app/services/app-state.service.ts`.

- Owns location label, cart, addresses, payment methods, active address, coupon, delivery fee preview, checkout price breakup, serviceability, active order, and mini-cart state.
- Initializes saved/manual location through `LocationService`.
- Calls `CatalogService.loadHome`, `loadCategories`, `loadStores`, and `checkServiceability` when a location is present.
- Enforces local checkout blocking for empty cart, mixed store cart, minimum order amount, and store availability.
- Handles backend cart conflict code `cart_store_conflict`.

Catalog state lives in `frontend/projects/customer-app/src/app/services/catalog.service.ts`.

- Loads banners, coupons, categories, stores, products, home composition, vendor detail, recommendations, and explore data.
- Store discovery can use a fallback query plan when enabled.
- Home sections map backend `nearby_stores`, `recommended_products`, `flash_deals`, `buy_again`, `coupons`, `banners`, and `hero`.

Startup logic lives in `frontend/projects/customer-app/src/app/services/customer-app-startup.service.ts`.

- Loads customer content configuration and feature flags.
- Starts notification polling when authenticated.
- Does not currently enforce location-first routing.

Gap: state is still a broad god service. The facades exist, but location, catalog, cart, checkout, and active order side effects are still coupled inside `AppStateService`.

## Current Customer Composition APIs

Customer composition endpoints live in `backend/backend/routes/customer.py` and `backend/backend/views/customer_views.py`.

- `GET /api/customer/home/`: home composition.
- `GET|POST /api/customer/location/serviceability/`: location serviceability.
- `GET /api/customer/explore/`: explore/search composition.
- `GET /api/customer/buy-again/`: authenticated buy-again rail.
- `GET /api/customer/cart/suggestions/`: authenticated cart suggestions.
- `GET|POST /api/customer/cart/apply-best-coupon/`: best coupon.
- `GET /api/customer/checkout/slots/`: checkout slots.
- `GET /api/customer/orders/active/`: active order summary.
- `GET /api/customer/orders/<uuid>/confirmation/`: confirmation payload.

The shared client maps these in `packages/customer-api-client/src/index.ts` as `customerHome`, `customerServiceability`, `customerExplore`, and related customer endpoints.

Backend composition actions live under `backend/backend/actions/customer_flow/`.

- `location.py`: computes serviceability by quoting approved, open, accepting vendors against a request address.
- `home.py`: builds hero, categories, nearby stores, flash deals, recommended products, buy again, coupons, and sections.
- `explore.py`: searches products and stores.
- `confirmation.py`, `tracking.py`, `checkout_slots.py`, and related actions handle customer post-order flows.

Gap: serviceability returns store-level counts and nearest store information, not a fulfillment-node promise. Home/explore still expose `nearby_stores` and products through vendor-store availability, not inventory/promise availability at a node level.

## Current Checkout And Order Flow

Checkout logic lives mainly in `backend/orders/actions/checkout.py` and `backend/orders/actions/ordering/create_orders.py`.

Current protections:

- Validates active account.
- Validates complete delivery address with latitude/longitude.
- Validates enabled payment method.
- Requires COD-UPI confirmation when configured.
- Loads and locks cart/product rows.
- Enforces single-vendor cart through `validate_single_vendor_cart`.
- Enforces vendor minimum order through `validate_vendor_minimum_order`.
- Validates vendor hours, holidays, and schedule slots.
- Quotes delivery via `quote_vendor_delivery`.
- Applies free delivery when subtotal meets `PlatformSetting.free_delivery_above`.
- Applies coupon, wallet, loyalty, platform, packaging, small-cart, surge, and tax amounts.
- Creates inventory reservations and commits/decrements stock during order creation.

Gap: the checkout invariant is single vendor, not single fulfillment node or promise. Free delivery and minimum order are now calculated server-side, but customer-facing discovery still needs to be driven by the same promise/quote source so UI messaging cannot drift from checkout.

## Cart Invariant

Cart endpoints live in `backend/orders/views/cart_views.py`.

Current invariant:

- Authenticated cart only for backend cart APIs.
- `AddToCartView` rejects products outside `ProductRepository.customer_visible_filter()`.
- Existing cart items must all belong to the same vendor.
- Cross-store add returns `409` with code `cart_store_conflict`.
- Quantity changes validate stock.
- Replace cart clears previous items and adds the incoming product.

Gap: an instant-delivery app should express this as one active fulfillment promise. For V1, a vendor store can be adapted as a temporary fulfillment node, but the public contract should move toward `fulfillment_node_id`, `promise_id`, and `availability_context`.

## Store And Vendor Discovery Model

Current query layer is `backend/backend/data/customer_flow_repository.py`.

- `open_approved_stores()` returns vendors with `status='approved'`, `is_open=True`, and `is_accepting_orders=True`.
- `customer_visible_products()` filters active customer categories and orders by featured, orders, rating, and name.
- `searchable_products()` filters approved vendors and accepting orders.
- `searchable_stores()` searches vendors and product fields.

Home serviceability uses `quote_vendor_delivery()` for every open approved store and sorts by ETA/distance. Home product rails are filtered to nearby store IDs when a request address exists, and cleared when not serviceable.

Gap: vendor store is the inventory/fulfillment unit. There is no dark-store, hub, zone, node capacity, SLA promise, or per-node sellable inventory abstraction.

## Tracking

The customer tracking page lives in `frontend/projects/customer-app/src/app/pages/tracking/tracking.component.ts`.

- Uses REST polling through `CustomerOrderApiService.getOrderTracking()`.
- Shows Google Maps when available.
- Computes route stage from order status and partner coordinates.

The backend websocket route exists in `backend/backend/config/asgi.py`:

- `ws/delivery/<uuid:order_id>/tracking/`

`backend/delivery/consumers.py` authenticates websocket users and allows admin, customer, vendor, and accepted delivery partner access.

Gap: customer tracking does not yet use the websocket. It polls REST and misses lower-latency route/ETA events already supported by the backend channel.

## Inventory Reservation

Inventory reservation model: `backend/orders/models/inventory_reservation.py`.

- Tracks cart/order/order-item reservation records.
- States: `reserved`, `committed`, `released`, `expired`.
- Default expiry: 15 minutes.
- Indexed by product/status, vendor/status, status/reserved_until, and order/status.

Order creation uses locked products, validates stock, creates reservations, commits reservations, and decreases product stock.

Gap: reservations are product/vendor scoped. They need to evolve to product/fulfillment-node scoped once nodes exist.

## Runtime Dependencies

Backend runtime:

- Django REST API.
- PostgreSQL by default, SQLite local smoke settings available.
- Redis for RQ jobs and Channels.
- RQ worker/scheduler for delivery assignment and scheduled jobs.
- Channels websocket server for support, delivery tracking, vendor operations, and admin stats.

Frontend runtime:

- Angular 19 standalone apps.
- Customer app depends on shared `@shared` services and packages such as `@nexconnect/customer-core`, `customer-location`, `customer-search`, `customer-products`, `customer-checkout`, and `customer-validation`.
- Google Maps is loaded on tracking where configured.

## Target Architecture

The target customer app should be promise-first:

1. Location is mandatory before shopping.
2. Serviceability resolves a fulfillment node and delivery promise.
3. Home/explore/category/product APIs return only products sellable from that node for the selected promise.
4. Cart is tied to one active fulfillment promise.
5. Checkout revalidates the same promise, stock, fees, minimum order, coupons, and payment rules.
6. Tracking streams live order state and ETA.

For V1 migration, an approved accepting vendor store can serve as a compatibility fulfillment node while the database and APIs are moved toward a true node model.

## Phase Plan

### Phase 1: Location Gateway And Promise Contract

- Add serviceability response fields: `fulfillment_node`, `promise`, and `availability_summary`.
- Treat current vendor stores as `type='vendor_store'` compatibility nodes.
- Update frontend serviceability model to understand the new fields.
- Make `/location` the first-run gateway unless a usable location and serviceable promise are already known.
- Ensure home/explore do not render store/product rails when `is_serviceable=false`.
- Remove state/city fallback for instant views unless the user explicitly broadens search.

Acceptance:

- A user without location lands on `/location`.
- A non-serviceable location renders no stores/products.
- A serviceable location shows the promise and only promise-compatible products.

### Phase 2: Fulfillment Node Domain

- Add backend models for fulfillment nodes, node service zones, node inventory, node operating status, and node capacity.
- Link vendors/stores to nodes without breaking existing vendor APIs.
- Add repositories/actions for node lookup, stock availability, and promise generation.
- Migrate serviceability from vendor quote iteration to node promise selection.

Acceptance:

- The customer composition layer no longer depends on vendor-store discovery as its primary availability source.
- Product availability is evaluated per node.

### Phase 3: Product-Level Instant Discovery

- Replace store-first home sections with product-first sections: essentials, deals, repeat buys, recommended for you, category shelves, and recently viewed.
- Keep store pages available only as secondary provenance, not the core shopping unit.
- Add strict location/promise parameters to product search and category listing.
- Ensure recommendation service rankings are hydrated only after backend serviceability and stock filters.

Acceptance:

- Product cards never leak from unserviceable stores.
- Store cards do not appear as the primary empty-state fallback for instant shopping.

### Phase 4: Cart And Checkout Promise Lock

- Add `promise_id`, `fulfillment_node_id`, and `promise_expires_at` to cart/checkout contracts.
- Revalidate promise at add-to-cart, cart update, checkout preview, and order creation.
- Make minimum order, free delivery, small-cart fee, surge, coupon, and ETA messages come from backend preview only.
- Add a clear replacement flow when the user changes location/node.

Acceptance:

- UI cannot display free delivery or minimum-order progress that checkout will not honor.
- Changing location invalidates or revalidates the active cart.

### Phase 5: Live Tracking And ETA

- Connect customer tracking to `ws/delivery/<order_id>/tracking/`.
- Keep REST polling as fallback.
- Stream driver coordinates, ETA changes, and status transitions.
- Display promise vs live ETA clearly.

Acceptance:

- Customer tracking updates without waiting for polling when websocket is available.

### Phase 6: Performance And Cleanup

- Split `AppStateService` into focused facades/services after behavior is stable.
- Remove dead redirects and duplicated discovery paths after telemetry/import checks.
- Add targeted backend tests for serviceability, promise filtering, cart promise invariant, checkout preview, and order creation.
- Add frontend tests for location gateway, non-serviceable empty state, dynamic checkout fees, and responsive cart/checkout screens.

Acceptance:

- Builds pass for customer app and affected packages.
- Backend local smoke check passes.
- Removed features have no imports, routes, nav links, or active product flow usage.

## Risk Register

- Store-first assumptions are spread across backend serializers, checkout, Angular models, product cards, store pages, and cart conflict UI.
- The app has both customer `/customer/*` composition APIs and legacy `/products`, `/vendors`, `/orders` endpoints. During migration, Django should remain the public API boundary and keep backward-compatible response fields.
- Existing dirty files indicate parallel work; changes should stay scoped and avoid reverting unrelated edits.
- The recommendation microservice can rank product IDs, but Django must always hydrate and filter by serviceability, stock, approval, and active node status.

## Immediate Implementation Slice

The safest first slice is additive and backward compatible:

- Extend serviceability payloads with fulfillment-node and promise metadata derived from the current nearest serviceable vendor.
- Extend frontend serviceability types to consume those fields.
- Improve the location page display to show the resolved node/promise without removing existing store fields.
- Preserve existing response fields so current home/explore/components keep building.

## Phase 1 Progress

Implemented after the baseline audit:

- Customer shopping routes now require a selected, serviceable location before rendering home, explore, store, product, cart, or checkout pages.
- The location guard redirects to `/location` with a `returnUrl` so the user returns to the intended shopping route after selecting a serviceable location.
- `CatalogService` no longer eagerly loads generic stores/products before location is known.
- Guest/manual and saved-address locations now share a single customer location query helper.
- Search, store detail, and product detail now hydrate with the selected location context.
- Serviceability responses now include additive `fulfillment_node`, `promise`, and `availability_summary` fields while preserving the old store/count fields.

## Phase 2 Progress

Implemented backend fulfillment-node foundation:

- Added `FulfillmentNode`, `FulfillmentNodeServiceArea`, and `FulfillmentNodeInventory` under the `vendors` domain.
- Added a deterministic migration for the new node, service-area, and node-inventory tables.
- Added admin registration for node operations.
- Added repository classes for active node lookup, address service-area matching, and node inventory counting.
- Customer serviceability now resolves configured active fulfillment nodes first.
- Existing vendor-store serviceability remains as a compatibility fallback only when no active fulfillment nodes are configured.
- Added admin API CRUD endpoints for fulfillment nodes, node service areas, and node inventory.

Additional Phase 2 completion:

- Inventory reservations, orders, order items, checkout preview, and order creation now carry node-level traceability.
- Platform dark-store and hub nodes can expose sellable products through node inventory even when the node is not one-to-one with a vendor store.

Admin endpoints added:

- `GET|POST /api/admin/fulfillment-nodes/`
- `GET|PATCH|PUT|DELETE /api/admin/fulfillment-nodes/<uuid>/`
- `GET|POST /api/admin/fulfillment-nodes/<uuid>/service-areas/`
- `GET|PATCH|PUT|DELETE /api/admin/fulfillment-service-areas/<uuid>/`
- `GET|POST /api/admin/fulfillment-nodes/<uuid>/inventory/`
- `GET|PATCH|PUT|DELETE /api/admin/fulfillment-inventory/<uuid>/`
- `GET /api/admin/fulfillment-reports/stock-comparison/`
- `GET /api/admin/fulfillment-reports/cart-events/`

## Cart And Checkout Promise Lock Progress

Implemented the first promise-lock slice:

- Cart now stores `fulfillment_node`, `fulfillment_promise_id`, `fulfillment_promise_expires_at`, and `fulfillment_locked_at`.
- Add/replace cart accepts optional fulfillment context from the customer app.
- Cart rejects mixed fulfillment promises with `cart_fulfillment_conflict`.
- Cart validates node status, node/vendor product ownership, and node inventory when node inventory records exist.
- Checkout preview and order creation revalidate the cart fulfillment lock, promise expiry, node status, vendor match, and node stock.
- Customer app sends the selected serviceability `fulfillment_node` and `promise` when adding, replacing, or syncing cart items.

Cart/checkout phase is complete for the V1 promise-lock contract.

## Node-Scoped Reservation Progress

Implemented node-level traceability and stock movement:

- `Order`, `OrderItem`, and `InventoryReservation` now persist `fulfillment_node`.
- `Order` also snapshots `fulfillment_promise_id` and `fulfillment_promise_expires_at`.
- Order serializers now expose fulfillment-node fields for read APIs.
- Order creation locks and decrements node inventory rows when the cart is node-locked and matching node inventory exists.
- Product-level stock decrement remains in place for compatibility with existing vendor product inventory.
- Cart fulfillment lock is cleared after successful order creation.

Additional reservation completion:

- Added a shared reservation release action used by customer cancellation and admin cancellation.
- Added reservation reconciliation for expired reservations, cancelled orders, and failed Razorpay payment sessions.
- Added a scheduled-task registry entry for `reconcile_inventory_reservations`.
- Added admin stock comparison reporting across product stock and fulfillment-node stock.

## Cart Invalidation Progress

Implemented customer-facing stale-promise handling:

- Cart responses now include the locked fulfillment node name.
- Customer app tracks the active cart fulfillment node for logged-in and guest carts.
- Guest carts persist fulfillment node metadata in local storage.
- Location/serviceability changes compare the new fulfillment node against the cart's locked node.
- If the node changes while the cart has items, the app prompts the customer to clear the cart for the new location.
- Checkout is blocked with a clear message while the cart belongs to a different fulfillment node than the selected location.
- Cart and checkout pages now render dedicated stale-fulfillment banners with a direct clear-cart action.
- Same-node serviceability refreshes now rehydrate the cart's fulfillment promise automatically.
- Backend exposes a guarded cart fulfillment refresh endpoint that revalidates node status, vendor match, stock, and promise expiry before updating the cart lock.
- Customer cart fulfillment conflicts, invalidations, keep-cart choices, rehydrations, and refresh failures now emit typed customer analytics events.
- Signed-in customer cart fulfillment events are persisted through a constrained backend audit endpoint into the existing audit log.

Additional invalidation/reporting completion:

- Added admin cart fulfillment audit reporting over persisted cart fulfillment analytics events.

## Product Discovery Hardening Progress

Completed Phase 3 backend filtering:

- Customer home product rails now hydrate from the resolved fulfillment node and hide store cards when no active node can serve the selected location.
- Product list, featured products, product detail, search, vendor recommendations, store detail products, and category listings now apply fulfillment-node stock filters when a selected location or node is present.
- Store discovery and nearby-store APIs now constrain store cards to the active fulfillment node, including platform nodes that stock products from multiple vendors.
- Recommendation service results remain internal rankings only; Django hydrates and filters them again by node, serviceability, stock, approval, and active store status.

## Live Tracking Progress

Completed Phase 5 customer tracking:

- Customer tracking now opens the authenticated `ws/delivery/<order_id>/tracking/` websocket using the shared JWT subprotocol helper.
- Live driver coordinate messages update the tracking timeline and map marker.
- Live ETA messages override stale order ETA text.
- Existing REST polling remains as a fallback and recovery path.
- Sockets reconnect while an order is active and close when the page unloads or the order reaches a terminal state.

## Phase Completion Snapshot

As of 2026-06-25, all six planned implementation phases have been completed for the V1 instant-delivery architecture:

- Phase 1: location gateway and fulfillment promise contract.
- Phase 2: fulfillment node domain, admin operations, node inventory, and node traceability.
- Phase 3: product-level discovery and recommendation hydration hardening.
- Phase 4: cart and checkout promise lock with dynamic backend validation.
- Phase 5: live websocket tracking with REST fallback.
- Phase 6: cleanup, audit reporting, and verification pass.

Verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Frontend apps: `npx.cmd ng build customer-app --configuration development`, `vendor-app`, `delivery-app`, and `admin-panel` all passed.
- Browser sanity: `http://127.0.0.1:4201/` redirected to `/location?returnUrl=%2F`, rendered the location gate without runtime console errors, and showed no store/product cards before a serviceable location was selected.

## Phase 7: Launch Readiness Rollout

Implemented the first operational rollout slice:

- Added `BackfillVendorFulfillmentNodesAction` to create vendor-store fulfillment nodes from existing approved vendors.
- Added node-inventory backfill from existing vendor product stock.
- Existing node and inventory records are preserved by default; operators must pass `--sync-existing` before the command updates them.
- Added `--dry-run` support so production can preview node and inventory counts before applying changes.
- Added a single-vendor option for controlled rollout.

Management command:

```bash
python manage.py backfill_fulfillment_nodes --dry-run
python manage.py backfill_fulfillment_nodes
python manage.py backfill_fulfillment_nodes --sync-existing
python manage.py backfill_fulfillment_nodes --vendor-id <vendor_uuid> --dry-run
```

Phase 7 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py backfill_fulfillment_nodes --help --settings=backend.config.local_sqlite` rendered command help successfully.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.

## Phase 8: Operational Readiness Audit

Implemented a read-only readiness gate for rollout and support operations:

- Added `FulfillmentReadinessAuditAction` for a single source of truth across CLI and admin API.
- Added CLI command `audit_fulfillment_readiness`.
- Added admin endpoint `GET /api/admin/fulfillment-reports/readiness/`.
- The audit reports:
  - Approved vendors missing active vendor-store fulfillment nodes.
  - Sellable products missing sellable active node inventory.
  - Active nodes with no sellable stock.
  - Over-reserved node inventory.
  - Vendor-store node inventory pointing at products from another vendor.
  - Node inventory marked visible for products that are not customer-sellable.

Management command:

```bash
python manage.py audit_fulfillment_readiness --sample-limit 20
python manage.py audit_fulfillment_readiness --fail-on-issues
```

Phase 8 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: local SQLite smoke DB was migrated for command execution.
- Backend: `python manage.py audit_fulfillment_readiness --sample-limit 2 --settings=backend.config.local_sqlite` ran successfully.
- Local seed-data result was `blocked`, with 8 approved vendors missing active fulfillment nodes and 2 sellable products missing node inventory. This confirms the audit catches the expected pre-backfill rollout blocker.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.

## Phase 9: Rollout Automation Gate

Implemented a combined rollout command for deployment and operations:

- Added `prepare_fulfillment_rollout`.
- The command can preview the backfill, apply the backfill, run readiness audit, and fail deployment when critical blockers remain.
- Dry-run mode reports planned node/inventory creation without writing to the database.
- A real run fails by default if readiness remains blocked; `--allow-blocked` is available only for explicit manual override.
- `--fail-on-issues` can make dry-run checks fail in CI when blockers are present.

Management command:

```bash
python manage.py prepare_fulfillment_rollout --dry-run --sample-limit 20
python manage.py prepare_fulfillment_rollout --sync-existing
python manage.py prepare_fulfillment_rollout --fail-on-issues --dry-run
python manage.py prepare_fulfillment_rollout --allow-blocked
```

Phase 9 verification run on 2026-06-25:

- Backend: `python manage.py prepare_fulfillment_rollout --help --settings=backend.config.local_sqlite` rendered command help successfully.
- Backend: `python manage.py prepare_fulfillment_rollout --dry-run --sample-limit 2 --settings=backend.config.local_sqlite` ran successfully.
- Local dry-run preview found 8 vendor-store nodes and 16 node-inventory rows to create, while current readiness remained blocked until actual backfill is applied.
- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.

## Phase 10: Admin Fulfillment Operations UI

Implemented an admin-panel surface for fulfillment rollout operations:

- Added shared admin API methods for fulfillment readiness, stock comparison, and cart fulfillment event reports.
- Added the admin route `/fulfillment-ops`.
- Added the sidebar entry `Operate > Fulfillment Ops`.
- The page shows:
  - Readiness status, critical issues, and warning counts.
  - Approved store, active node, sellable product, missing node, missing inventory, and empty-node metrics.
  - Sample readiness issue tables.
  - Stock mismatch report rows.
  - Recent cart fulfillment analytics/audit events.

Phase 10 verification run on 2026-06-25:

- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 11: Admin Rollout Controls

Implemented guarded rollout actions from the admin operations surface:

- Added backend endpoint `POST /api/admin/fulfillment-rollout/prepare/`.
- The endpoint defaults to dry-run mode and returns planned backfill plus readiness audit output.
- A real apply requires `confirm=BACKFILL_FULFILLMENT`.
- Every preview/apply request writes an admin audit log entry.
- Added shared frontend API method `prepareAdminFulfillmentRollout`.
- Added controls to `/fulfillment-ops`:
  - Preview backfill.
  - Apply backfill after browser confirmation.
  - Optional sync of existing node/inventory rows.
  - Inline result summary after preview/apply.

Phase 11 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 12: Admin Reservation Recovery Controls

Implemented guarded reservation reconciliation controls for fulfillment operations:

- Added dry-run support to `ReconcileInventoryReservationsAction`.
- Added backend endpoint `POST /api/admin/fulfillment-reservations/reconcile/`.
- The endpoint defaults to dry-run mode.
- A real apply requires `confirm=RECONCILE_RESERVATIONS`.
- Every preview/apply request writes an admin audit log entry.
- Added shared frontend API method `reconcileAdminFulfillmentReservations`.
- Added controls to `/fulfillment-ops`:
  - Preview stale reservation reconciliation.
  - Apply reconciliation after browser confirmation.
  - Inline recovery result summary for expired reservations, cancelled-order releases, failed-payment releases, product units restored, and node units restored.

Phase 12 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: direct dry-run action invocation returned a zero-change reconciliation result on the local smoke DB.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 13: Staged Rollout Safety

Implemented safer node-first enforcement for partial rollout:

- Added fulfillment-node rollout-area detection.
- Product, category, search, nearby-store, and store-discovery endpoints now enforce node-first emptiness only when the selected location is inside an active fulfillment-node rollout area.
- Locations outside configured node rollout areas can continue using vendor-store fallback serviceability while rollout is staged city-by-city or area-by-area.
- Customer home categories now respect the resolved fulfillment node and are cleared when serviceability is false.
- Fulfillment readiness reports now include active rollout-area count and samples.
- Fulfillment Ops page now shows a rollout-area metric.

Phase 13 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py audit_fulfillment_readiness --sample-limit 2 --settings=backend.config.local_sqlite` ran successfully and included rollout-area metrics.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 14: Admin Rollout Area Management

Implemented direct rollout-area administration inside Fulfillment Ops:

- Added shared admin API methods for active fulfillment nodes and node-scoped service areas.
- Added a node selector to `/fulfillment-ops`.
- Added a compact service-area creation form for label, city, state, postal code, and radius.
- Added the current service-area list for the selected node, including active/inactive status.
- New service-area creation refreshes the selected node areas and readiness reports so rollout-area counts update immediately.
- Reused the existing backend nested endpoint `POST /api/admin/fulfillment-nodes/<node_id>/service-areas/`; no new backend API surface was required.

Phase 14 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 15: Rollout Area Lifecycle Controls

Implemented service-area correction controls inside Fulfillment Ops:

- Added shared admin API methods to update and delete fulfillment service areas.
- Added row-level actions for rollout areas:
  - Pause active rollout areas.
  - Reactivate inactive rollout areas.
  - Delete incorrect rollout areas after confirmation.
- Service-area lifecycle actions reuse existing backend detail endpoints and admin audit logging.
- After each lifecycle action, the selected node's service-area list and readiness report refresh automatically.
- The rollout-area table was widened and styled to keep actions usable without disrupting operational density.

Phase 15 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 16: Node Inventory Correction Controls

Implemented selected-node inventory correction inside Fulfillment Ops:

- Added shared admin API methods to list inventory for a fulfillment node and update individual inventory rows.
- Added a node inventory table under the selected fulfillment node.
- Admins can now edit:
  - Total node stock.
  - Low-stock threshold.
  - Customer availability flag.
- Inline validation prevents negative stock, invalid thresholds, and stock lower than currently reserved quantity.
- Inventory saves refresh the selected node inventory plus stock mismatch/cart event reports.
- The controls reuse existing backend inventory detail endpoints and admin audit logging.

Phase 16 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 17: Node Inventory Creation Controls

Implemented missing node-inventory creation inside Fulfillment Ops:

- Added a shared admin API method to create inventory rows for a selected fulfillment node.
- Added product search using the existing admin product list API.
- Added a selected-product inventory creation form for:
  - Initial stock.
  - Low-stock threshold.
  - Customer availability flag.
- The creation flow filters product search by selected node vendor when the node is vendor-backed.
- Inline validation prevents empty product selection, duplicate node-product inventory rows, negative stock, and invalid thresholds.
- Successful creation refreshes selected-node inventory plus readiness, stock mismatch, and cart event reports.
- The controls reuse existing backend node-inventory create endpoints and admin audit logging.

Phase 17 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 18: Fulfillment Node Lifecycle Controls

Implemented node lifecycle and promise tuning inside Fulfillment Ops:

- Added a shared admin API method to update fulfillment nodes.
- The Fulfillment Ops node selector now loads all nodes, not only active nodes, so paused or disabled nodes can be restored.
- Added selected-node controls for:
  - Node status: active, paused, maintenance, disabled.
  - Accepting-orders toggle.
  - Instant radius.
  - Maximum delivery radius.
  - Base preparation time.
  - Delivery minutes per km.
  - Daily order capacity.
- Added validation so node capacity and promise fields must be non-negative numbers.
- Saves refresh readiness and keep the selected-node form aligned with the backend response.

Phase 18 verification run on 2026-06-25:

- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 19: Readiness Issue Quick Fixes

Implemented direct readiness issue actions from Fulfillment Ops:

- Added quick-fix buttons to readiness issue sample rows.
- Missing vendor node and missing product inventory samples can trigger a guarded vendor-scoped rollout backfill.
- Node and inventory issue samples can select the affected fulfillment node for inspection.
- Vendor backfill quick fixes use the existing `BACKFILL_FULFILLMENT` confirmation contract and refresh nodes, readiness, stock mismatch, and cart event reports afterward.

Phase 19 verification run on 2026-06-25:

- Frontend packages: `npm.cmd run build:packages` passed.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.
- Authenticated browser QA confirmed the Fulfillment Ops route rendered after local admin login and quick-fix actions were present when readiness samples existed.

## Phase 20: Browser QA And Responsive Polish

Completed browser QA against the local admin app:

- Started the local Django backend with `backend.config.local_sqlite`.
- Created/reused a local-only `browserqa_admin` admin user in the smoke SQLite database.
- Logged into the admin panel at `http://127.0.0.1:4203/login`.
- Opened `/fulfillment-ops` and verified:
  - The page rendered without authentication errors.
  - Desktop viewport had no horizontal page overflow.
  - Rollout Areas, Save Node, Node Inventory, and Add Inventory controls rendered after local backfill.
  - Mobile viewport had no horizontal page overflow.
  - Wide operational tables stayed contained inside table scroll wrappers.

Phase 20 verification run on 2026-06-25:

- Browser: desktop Fulfillment Ops route rendered at `http://127.0.0.1:4203/fulfillment-ops` with no page-level horizontal overflow.
- Browser: mobile viewport `390x844` rendered the route with no page-level horizontal overflow.
- Admin panel: `npx.cmd ng build admin-panel --configuration development` passed.

## Phase 21: End-To-End Rollout Smoke

Completed a local rollout smoke over the fulfillment flow:

- Ran rollout dry-run with local SQLite settings.
- Applied local rollout backfill with `--allow-blocked --sync-existing`.
- Confirmed local backfill created 8 fulfillment nodes and 16 node inventory rows.
- Ran readiness audit after backfill.
- Verified customer-facing discovery for Bengaluru:
  - `GET /api/vendors/nearby/?lat=12.9716&lng=77.5946&radius=10` returned the E2E demo serviceable store.
  - `GET /api/products/list/?lat=12.9716&lng=77.5946&radius=10` returned the two E2E demo products.
- Verified a far-away location:
  - `GET /api/vendors/nearby/?lat=8.5241&lng=76.9366&radius=10` returned no stores.
  - Initial product smoke exposed a product leak for the same far-away location.
- Fixed the product leak by adding a serviceable-vendor fallback filter when product endpoints receive `lat/lng` but no fulfillment node applies.
- Rechecked the far-away product endpoint and confirmed it now returns an empty paginated result.

Phase 21 verification run on 2026-06-25:

- Backend: `python manage.py prepare_fulfillment_rollout --dry-run --sample-limit 2 --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py prepare_fulfillment_rollout --allow-blocked --sync-existing --sample-limit 2 --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py audit_fulfillment_readiness --sample-limit 2 --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py check --settings=backend.config.local_sqlite` passed.
- Backend: `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite` reported no changes.
- Browser/API smoke: serviceable Bengaluru returned one store and two products.
- Browser/API smoke: far-away Thiruvananthapuram coordinates returned zero stores and zero products after the leak fix.
