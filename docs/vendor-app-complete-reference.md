# Nextou vendor app baseline reference

This is the **preimplementation snapshot from 2 October 2026**. It records the original screens, workflows, components, API contracts, and defects used to prepare the [analysis and redesign plan](vendor-app-redesign-plan.md). References to “current”, “present”, and “existing” below describe that baseline, not the redesigned working tree. For the implemented application and final verification, read the [vendor implementation report](vendor-app-implementation-report.md) and [coverage matrix](vendor-implementation-coverage.md).

The review covers vendor source and the shared/frontend/backend code used by its workflows. It does not certify the production deployment or every authenticated browser state. The earlier browser check reached the local login screen but could not authenticate with the default QA fixture; protected-page behavior described here is established from source inspection.

The latest implementation report now includes the **screenshot-led third pass from 3 October 2026**: all 24 primary destinations, page/component/API mapping, six screenshot root causes, narrow backend additions, actual mutations/live-update evidence, cold restart and explicit acceptance gaps. The baseline below is preserved rather than rewritten to imply these repairs existed at audit time.

## Purpose and scope

The vendor app is a store management workspace for sellers on Nextou. A vendor can register a store, wait for platform approval, inherit approved catalog products, manage variants and stock, process incoming orders, explicitly request a delivery partner, verify pickup, review settlements, run coupons, inspect sales and reviews, and contact support.

The present app supports one vendor profile associated with one user account. There is no active vendor staff-management screen or store-switcher workflow. Platform administration, vendor approval, catalog review, dispatch administration, bank verification, and payment processing are handled elsewhere.

| Inventory | Current implementation |
| --- | --- |
| Vendor source directory | `frontend/projects/vendor-app/src` |
| Source files | 104 |
| Component classes | 29, including the shell, reusable editors, and legacy pages |
| Route declarations | 34, including aliases, duplicate URLs, fallback, and utility routes |
| Distinct routed vendor page components | 21 |
| Additional shared routed page | Feature unavailable |
| Current Angular dependency | `@angular/core` 21.2.25; the historical Angular 19 description is outdated |
| Rendering and state | Standalone lazy-loaded components, Angular Signals, RxJS HTTP/event flows |
| Backend | Django REST Framework, JWT authentication, Channels WebSockets, RQ jobs |
| IDs | UUID strings |
| Primary theme | Light surfaces, purple brand, orange accent |
| Native vendor wrapper | No vendor Capacitor wrapper or vendor mobile build/sync scripts are configured alongside the customer and delivery wrappers |

## Navigation and complete page inventory

Desktop navigation is grouped as Operate, Catalog, Growth, and Account. Operate contains Dashboard, Live Orders, and Inventory. Catalog contains Products, Catalog Requests, Orders, and Promotions. Growth contains Analytics, Payouts, and Reviews. Account contains Support, Notifications, and Store Settings.

Mobile navigation has five destinations: Home, Orders, Stock, Inbox, and Store. Its Orders destination is the live board, rather than order history. Other pages remain accessible through the sidebar and contextual links.

The shell includes a sidebar, topbar, breadcrumbs, back control, notification dropdown, profile menu, loading overlays, and toasts. Authentication, password change, and approval screens render outside this shell. Feature configuration filters navigation links. The displayed shell store label currently derives from the username (`username's Store`), rather than the saved business name.

| Page | Route | Current functions and relevant behavior |
| --- | --- | --- |
| Login | `/login` | Username/password sign-in, vendor portal check, profile/status lookup, forced-password-change routing, approval routing. Login currently constrains identifiers to 30 characters and does not restore a protected-route return URL. |
| Registration | `/register` | Three steps for account, store details, and location; identity availability checks; contact/address validation; map coordinates; optional logo/banner upload; creates the account and vendor profile and signs the vendor in. |
| Change password | `/change-password` | Authenticated password change, including the initial forced-change flow. Route uses authentication guard only. |
| Approval status | `/pending-approval` | Approval status, reason, waiting/rejection states, and automatic checks every 30 seconds. Approved vendors enter the workspace. Some final states stop polling; no complete details/documents correction workflow exists. |
| Dashboard | `/` | Store operating controls, today/overall metrics, order-stage counts, low-stock attention, recent orders, launch checklist, and quick links. Fetches dashboard, operations summary, and settings every 15 seconds. |
| Live Orders | `/live-orders` | Nine board lanes: New, Confirmed, Preparing, Ready, Driver Search, Driver Assigned, Picked Up, Completed, Cancelled. Order actions, preparation/detail links, initial snapshot, vendor operations WebSocket, connection state and reconnect attempts. |
| Inventory | `/inventory` | Stock drafts, individual/bulk stock save, product availability toggles, and health filters: all, low stock, out of stock, paused, missing photo, category pending, ready. Currently loads one product page. |
| Products | `/products` | Paginated product table, search, category/price/stock/growth/status information, approval state, visibility blockers, edit/delete, draft submission and rejected-product resubmission. Refreshes every 15 seconds with exceptions for interaction states. |
| Product creation | `/products/new` | Choose from available catalog items, create persisted draft variants, enter brand/pack/unit/price/stock/SKU and related details, review, then submit for admin approval. Catalog selection currently fetches up to 100 entries. |
| Product editing | `/products/:id/edit` | Dedicated editor for identity, price, stock/threshold, minimum quantity, availability/status, preparation, delivery options, descriptions, ingredients/allergens, packaging and handling/compliance fields. Shows approval and rejection information. |
| Catalog Requests | `/catalog-requests` | Propose missing catalog items in a multi-row form; name, category, description, brand, unit, barcode and SKU hint; proposal history with item-level review outcomes. Loads up to 50 proposals without a complete pagination interface. |
| Order history | `/orders` | Paginated order records, status filtering, details, status actions and periodic refresh. Default page size is 20. |
| Preparation | `/orders/:id/prep` | Item checklist, local progress percentage, elapsed-order display, accept/start preparing/ready, driver search/cancel, pickup OTP verification. Checklist is held in component memory; initial order is loaded once. |
| Order detail | `/orders/:id` | Customer/delivery/order data, item and charge breakdown, status timeline/actions, driver-assignment states, live map/tracking, receipt generation/download. Refreshes nonterminal orders every 10 seconds. |
| Analytics | `/analytics` | Period-based revenue/order/AOV/repeat-customer metrics, monthly revenue, top products, coupon contribution, low-stock impact, payout metrics, CSV export. Default period is 30 days; all-time option exists. |
| Payouts | `/payouts` | Settlement history; pending approval, scheduled, paid/verify, failed and ledger views; approve/decline/verify-credit actions; settlement invoice download. Currently reads one payout page. Ledger repeats settlement records rather than wallet transactions. |
| Promotions | `/promotions` | Coupon creation/editing/deletion, duplication/reactivation, percentage/fixed/free-delivery types, validity dates, minimum order, discount caps and usage limits. Presets populate generic coupon values. |
| Support | `/support` | Create a ticket with subject, message, category and priority; inspect tickets and an admin response. This is a ticket interface, without a vendor conversation-message thread. Requires approved vendor access. |
| Reviews | `/reviews` | Store review list, average/distribution, low-rating and recent filters. Vendor reply or review moderation controls are not implemented here. |
| Notifications | `/notifications` | Full returned notification list, local category filtering, local unread count, mark-one/all read. The backend returns an unpaginated array. Inbox and header unread/list state are separate. |
| Store Settings | `/store-settings` | Store identity/contact, open/intake/auto-accept settings, daily hours, minimum order/preparation, delivery radii, address/location, packaging preferences and cancellation rules. Uses a dedicated editor/service. |

The feature-unavailable utility page is `/feature-unavailable`. It is provided by the shared library.

Aliases preserve older URLs: `/products/edit/:id` loads the product editor; `/store/settings` loads settings; `/products/health` and `/stock-management` redirect to inventory; `/profile` redirects to store settings; `/sales-report` redirects to analytics; `/wallet` and `/payments` redirect to payouts; `/coupons` redirects to promotions; `/order/:id` and `/order/:id/tracking` redirect to order detail. Unknown routes redirect to the dashboard.

Legacy implementations remain in the `profile`, `stock-management`, `wallet`, and `product-form` folders, but are not active routed screens. Their presence does not mean the current app has separate account-profile, wallet, or free-form product-creation experiences.

## Account, approval, and session workflow

1. A guest registers account and store details with an address and coordinates. File uploads use multipart form data; ordinary submissions use JSON.
2. The backend creates a vendor-role user and a vendor profile, initially `pending`, returns user/vendor/status/access-token data, and sets a refresh cookie.
3. The frontend establishes a vendor-scoped session and routes an unapproved vendor to the approval page.
4. The approval page checks status every 30 seconds while waiting. Platform staff review and change vendor status in the admin application.
5. An approved vendor can enter the workspace. Login/guard handling can require a password change first when the account has `force_password_change`.
6. Subsequent requests send the access token as Bearer authentication. A qualifying 401 triggers refresh and retries the request; failed refresh clears the session and returns the user to login.

Vendor status values are `pending`, `approved`, `rejected`, `hold`, `suspended`, `in_review`, `pending_details`, `pending_documents`, `invalid_details`, and `invalid_documents`. The status reason is separate from the status code. Approval, account identity, open state and order intake are different concepts.

Current JWT defaults are a 15-minute access lifetime and a seven-day refresh lifetime, configurable by environment. Refresh rotation and blacklisting are enabled. Normal login/registration responses expose the access token; refresh is stored in a portal-specific HttpOnly cookie, normally named `nexconnect_refresh_vendor`. Secure/SameSite/domain behavior follows backend configuration.

Frontend storage uses the `vendor` auth prefix. Access and user records use `vendor_access_token` and `vendor_user` in session/local storage. Approval cache uses `vendor_vendor_status`; refresh-session presence has its own marker. The normal refresh credential is the cookie. Older notes stating a one-day access token, a generic `vendor_status` key, or normal localStorage refresh-token persistence do not describe this implementation accurately.

The authentication interceptor uses a 15-second request timeout, global loading unless explicitly skipped, and a deduplicated refresh request. Login sends `portal: 'vendor'`. Frontend guards provide routing convenience; backend permissions and ownership checks enforce access.

`IsVendor` permits a user with a vendor profile regardless of approval, which is deliberate for profile/status access. `IsApprovedVendor` requires approved status for operations, products, orders, payouts and vendor support. Profile and store-settings GET/PATCH currently share the same broad serializer under `IsVendor`; restricting operating/policy fields is a planned correction.

## Store operation and readiness

The model has distinct fields for `is_open`, `is_accepting_orders`, opening/closing times, operating-hours JSON, and `auto_order_acceptance`. Availability helpers also calculate `is_open_now` and an availability note. The current settings editor exposes a simpler daily opening/closing pair rather than a full weekly schedule.

Dashboard opening can include an admin-configured stock check. The stock modal offers existing-stock reuse or resetting reviewed stock and submits bulk updates before opening. Closing is a direct store-status action. Backend defaults are open/intake true, 09:00 opening and 22:00 closing, but approval and availability controls still determine usable operation.

The dashboard launch checklist covers profile, location, hours, payout setup, products, inventory and opening. Its payout-completion item is hardcoded incomplete. It is a frontend checklist rather than an authoritative backend readiness assessment.

Current contract limitations matter: store-status updates persist `is_open` and optional closing time, while the dashboard also sets intake true locally. Bulk stock may return individual errors with HTTP 200, and current UI flows do not fully inspect those errors. The stock modal/inventory only load the first product page. Store opening/readiness therefore needs backend enforcement and authoritative responses before the redesigned interface can present it as reliable.

## Catalog, products, images, and inventory

The base catalog identifies platform-approved products. Vendor products inherit a catalog item and add seller-specific variant/pricing/stock/handling data. The available catalog is controlled through vendor catalog access/grants. A product missing from that catalog is requested through a proposal rather than immediately published by a vendor.

The active creation flow selects catalog entries, creates draft products on the server, edits variants, and submits product IDs for review. The frontend step labels are catalog, variant 1, variant 2, and review; later variant indices reuse the second variant label. Saving draft variants and submitting the batch are separate requests. A partial failure can leave some variants saved. The approval note in the frontend submit payload is not sent by the shared API submission method.

Catalog proposals contain item-level review decisions, rejection reasons, and links to created catalog entries. Backend proposal states include pending, partial approval, approval and rejection. Product approval and operational status are independent:

| Product state dimension | Values and meaning |
| --- | --- |
| Operational status | `active`, `draft`, `sold_out`, `coming_soon`, `archived` |
| Approval status | `draft`, `pending_approval`, `approved`, `rejected` |
| Sale switch | `is_available` |
| Stock | Integer quantity with configurable low-stock threshold |
| Catalog binding | `catalog_product` relationship |
| Image inheritance | `base_image`, `vendor_image_only`, `mixed` |

The core customer-visible repository filter requires approval `approved`, status `active`, availability true, positive stock, and a non-null catalog product. Product serializers also expose publication/visibility information. A frontend readiness label based only on price/stock/status is insufficient to promise publication.

Product fields include name, slug, category/catalog identity, brand, SKU, barcode, unit/pack weight, price, comparison price, tax rate, stock, threshold, minimum order quantity, preparation minutes, instant/scheduled delivery options, description/search terms, ingredients/allergens, shelf life, packaging/compliance notes, and perishable/cold-storage/fragile/age-restricted/returnable flags. Approval records include reviewer/time, requested time, rejection reason, change summary and batch ID. Not every frontend creation field has a matching persisted backend capability; preorder/backorder/shipping labels must be checked against their mapper and contract before expanding them.

Stock defaults to zero, threshold to ten, and minimum order quantity to one. Images may come from the catalog or vendor uploads according to inheritance policy. Image management and stock updates use owner-scoped endpoints. The backend has an AI-image endpoint, but its existence does not mean a complete AI-image workflow is connected to the current creation screen.

Inventory filters run on loaded products. Products have pagination; Inventory currently does not expose complete-store pagination. Bulk stock results contain both `updated` and `errors`, so HTTP success alone does not establish that every requested row saved.

## Orders, preparation, and delivery

The backend order status lifecycle is:

```text
placed → confirmed → preparing → ready → picked_up → on_the_way → delivered
                 cancellation is possible only while allowed by backend rules
```

The shared TypeScript model includes broader possible statuses, but those must not be interpreted as additional implemented backend transitions. Vendor actions normally accept, reject, start preparation and mark ready. Server actions lock the order and validate transitions; concurrent stale actions should use the returned result/error rather than trusting local button state.

The preparation screen checks individual order items and calculates local progress. These checks are not persisted or shared across devices. Its elapsed-time computed value has no reactive timer. Other order screens can mark ready without this checklist, so it is not a mandatory platform-wide preparation policy.

Driver assignment is a separate lifecycle from order fulfillment:

```text
searching → notified → accepted
                    → timed_out / cancelled / failed
```

1. The vendor marks an order ready. This does not automatically request a driver.
2. The vendor explicitly starts delivery search.
3. An RQ task searches nearby partners, beginning at 2 km and expanding by 2 km up to 20 km. Notified partners have one minute to accept.
4. The vendor can cancel an active search. Notifications are removed and worker retry logic refreshes assignment state to respect cancellation/acceptance.
5. Timeout/failure allows a retry through the vendor interface.
6. With a ready order and assigned partner, pickup OTP verification authorizes handoff and advances the order to picked up. Delivery confirmation occurs in the delivery workflow.

The live board combines order status and assignment status into lanes. Its current lane selection checks the driver before some fulfillment/terminal states, which can place completed or picked-up orders in Driver Assigned. The live endpoint returns the preceding 14 days, including terminal orders, with a scheduled-release filter. It is not an active-orders-only feed.

Order detail displays item snapshots, charge totals, customer/address, tracking, driver information and receipts. Order item snapshots preserve name/brand/unit/pack/SKU/price independently of later product edits. Monetary order data includes subtotal, product discount, delivery/platform/packaging/small-cart fees, tax/surge, coupon/wallet/loyalty discounts, total, tip and price-breakup metadata. Payment methods currently include COD and Razorpay; verification/refund metadata are separate from fulfillment status.

## Live updates, maps, and background refresh

| Region | Update mechanism | Current practical limit |
| --- | --- | --- |
| Dashboard | Three requests every 15 seconds | Independent timer; settings are repeatedly fetched |
| Products and order history | Refresh every 15 seconds with local interaction exceptions | No common visibility-aware coordinator |
| Approval page | Poll every 30 seconds while waiting | Certain final states stop polling |
| Live board | Initial HTTP snapshot and vendor operations WebSocket | Exponential reconnect, but no snapshot reconciliation on reconnect and no implemented polling fallback |
| Order detail | Initial fetch; 10-second polling for nonterminal orders; driver tracking socket | Tracking socket lacks a full reconnect/recovery state |
| Prep screen | Initial fetch and action responses | No continuous order/assignment subscription |
| Notifications | Shared polling at 60 seconds | Pauses when hidden, handles connectivity and backs off after errors; inbox/header list ownership remains separate |

Vendor operations socket: `/ws/vendor/operations/`. It requires an approved vendor and broadcasts vendor-owned serialized order updates with `order_created`/`order_updated` events. Tracking socket: `/ws/delivery/<order_id>/tracking/`, with location update messages. Support issue sockets also exist in the platform, but the vendor support-ticket screen is not a ticket-message WebSocket conversation.

Current sockets authenticate using `Sec-WebSocket-Protocol` values `nexconnect.jwt` and the access token. The shared client and backend middleware agree on this mechanism. The older `?token=` documentation is outdated. With a `/sa/api` API base, the helper resolves sockets under `/sa/ws/...`; relative `/api` resolves `/ws/...` on the frontend origin, requiring proxy support.

Order tracking uses Google Maps/runtime configuration, driver markers and movement animation, with throttled route requests. Checked-in environment keys/map IDs are empty; runtime deployment must supply the required configuration and map-service access. A configured map and a functioning tracking socket are separate dependencies.

## Analytics, settlements, promotions, and customer contact

Analytics filters orders by placement date for the requested period. Revenue and AOV use delivered orders; order counts include orders in the period, and repeat customers are customers with more than one period order. Monthly totals use delivered orders' placement month. Top products are ranked by revenue, capped at ten. Coupon contribution uses coupon usage linked to delivered orders. Low-stock counts describe current inventory.

The API also returns a payout summary across all time, independent of the order period. The current frontend separately fetches payouts and calculates totals from their first page instead of using that aggregate. Revenue, gross settlement sales and net payouts are different measures; revenue here is order-total revenue, not a complete vendor profit calculation.

Settlement lifecycle:

```text
pending_approval → approved → scheduled → paid → verified
                   exception/rejection handling can lead to failed
```

Vendors approve a pending settlement or decline with a reason, then verify receipt after payment is sent. Admin/payment workflows schedule and dispatch funds. Vendor decline is represented as `failed` plus rejection reason in the current backend; there is no distinct `declined` model status. A paid record awaiting verification is different from a verified bank credit. Settlement invoices use server-resolved vendor/payout ownership and amounts.

Bank details, onboarding documents and verification records exist in backend/admin models, but the current vendor payout screen has a static “Not connected” setup card. There is no active vendor self-service bank/KYC editor. The “Ledger” tab shows payout rows; the backend wallet-transaction endpoint is a separate capability.

Coupons support percentage, fixed and free-delivery discounts, title/description/code, minimum order, maximum discount, validity timestamps, total/per-user limits, active switch and usage information. Presets such as welcome/weekend/stock movement are shortcuts for generic coupon values, not proof of first-order eligibility or product-targeted campaign enforcement. Filters/summaries currently operate on loaded rows. UTC/local datetime conversion needs correction before campaign editing is reliable.

Reviews are read-only in this vendor app. Support tickets expose subject/message/category/priority/status and an admin response, rather than a full message history. Shared API code has a support-ticket PATCH helper, but the vendor backend detail view implements GET only; callers must not assume an update contract exists.

Notification model types are `order`, `delivery`, `payout`, `promo`, and `system`. The inbox filters include approval/support and omit promo, so the filter taxonomy does not match the declared backend types. The full-list endpoint is unpaginated; the header takes eight items and only refetches while its cached list is empty. Marking read in one surface does not consistently synchronize the others immediately.

## Frontend architecture and source map

```text
frontend/projects/vendor-app/src/
  main.ts                         application bootstrap
  styles.scss                     vendor global styles
  environments/                   development/production API configuration
  app/
    app.component.*               shell and header state
    app.routes.ts                 lazy pages, guards and redirects
    app.config.ts                 providers and interceptors
    config/vendor-navigation.ts   desktop/mobile navigation
    services/                     startup and order orchestration
    pages/                        active page wrappers plus legacy screens
    shared/
      vendor-product-create/      create component, service, models, mapper
      vendor-product-edit/        edit component, service, models, mapper
      vendor-store-settings/      settings component, service and models
```

The shared library is exposed through `@shared/public-api`. `VendorApi` is currently an empty subclass of the large compatibility `ApiService`; it therefore inherits methods from other domains as well. Dedicated clients such as AuthApi, NotificationApi and FeatureConfigApi also exist. The preferred next step is focused typed domain clients while preserving compatibility during migration.

`VendorAppStartupService` starts notification polling, page-feature polling, unread-count propagation and currency configuration from the vendor/user location. `VendorOrderActionsService` dispatches nine supported UI action types to the API and standardizes error messages. `VendorOrderFacade` supports order/receipt loading and download orchestration. Product create/edit and store settings services hold their own signals and DTO mapping.

Most routed operating pages use authentication, vendor role, approved-vendor and page-feature guards. Dashboard lacks an individual page-feature guard; pending approval requires authentication and vendor role without approval. Feature config is fetched from `/orders/page-features/`; normal page guards can fail open on configuration-load errors. Feature gating does not replace backend permission checks.

HTTP cache keys include authentication scope and path. Selected GETs have time-based caching, and mutations invalidate cached state. The same configured interceptor is shared across apps. Frontend model interfaces are available, but many API results still use `any`; backend decimal values can be serialized as strings even where frontend interfaces say number. Editors use numeric mapping where implemented.

## Backend entities and ownership

| Entity | Information and relationship |
| --- | --- |
| User | Authentication/account identity, role, contact, currency/country, password-change and verification flags. One-to-one vendor profile. |
| Vendor | Business identity, public store contact/address, coordinates, classification, approval/reason, ratings, operating/delivery settings, fulfillment policy and wallet balance. |
| CatalogProduct / category / grants | Platform catalog identity, category hierarchy, catalog images and vendor access. |
| Product / images | Vendor variant inheriting catalog identity, price/stock/sale/handling fields, image policy and approval metadata. |
| Catalog proposal / items | Vendor-requested catalog entries, review states, reasons and resulting catalog links. |
| Order / OrderItem / tracking | Vendor/customer/driver/address, fulfillment/payment/fee data; item identity and price snapshots; timeline entries. |
| DeliveryAssignment | Search state, notified/accepted partner information and search lifecycle, separate from order status. |
| VendorPayout | Settlement period, gross sales, commission, net payout, lifecycle timestamps, reference and rejection reason. |
| VendorWalletTransaction | Credit/debit amount, source, reference/description, balance after transaction and timestamp. |
| Coupon / CouponUsage | Vendor campaign rules, validity/limits and order-linked discount usage. |
| VendorReview | Store/customer rating and review data; vendor list access is owner/admin scoped. |
| SupportTicket | Vendor, subject/message/category/priority/status and admin response. |
| Notification | User-owned type/title/message/data/read state/date. |
| Invoice | Receipt/settlement type, order/vendor/recipient, authoritative amount/tax, PDF and issue metadata. |
| Onboarding / bank / document / service area / holiday | Backend/admin store setup and verification capabilities; not all have vendor self-service screens. |

Vendor classification includes 15 store types, from retail/kirana/supermarket to wholesale/B2B/online stores. Tiers are basic, silver, gold and platinum; fulfillment types are vendor and platform. These model choices are not all separately configurable through the current settings UI.

Required repository architecture is HTTP views → single-purpose actions → repositories for ORM access. Existing files include exceptions, particularly analytics/operations and payout view logic. Future changes should follow the repository guidance rather than reproduce these exceptions.

## API reference

Paths below are relative to `/api` locally or `/sa/api` in the production environment configuration. `{id}` is a UUID. “Approved” means authenticated approved vendor; ownership checks apply to that vendor's records. Endpoint presence is verified from source, not a claim that every deployment exposes the same revision. JSON shown in the payload column describes the important fields, not an exhaustive OpenAPI schema.

### Account and store

| Method and path | Access | Payload/query and response |
| --- | --- | --- |
| `POST /auth/login/` | Public | `{username, password, portal: 'vendor'}`; user/access data and refresh cookie |
| `POST /vendors/identity-availability/` | Public | `{field, value}` for vendor-scoped identity availability |
| `POST /vendors/register/` | Public | Account/store/address/coordinate data, optional files; `{user, vendor, vendor_status, tokens: {access}}` plus cookie |
| `POST /auth/refresh/` | Cookie refresh | `{portal: 'vendor'}` with credentials; fresh access and rotated cookie |
| `POST /auth/logout/` | Authenticated | Portal-scoped logout; blacklist refresh and clear cookie |
| `GET/PATCH /auth/profile/` | Authenticated | Shared account profile capability, distinct from store profile |
| `POST /auth/change-password/` | Authenticated | `{current_password, new_password}` |
| `GET/PATCH /vendors/profile/` | Vendor profile | Own VendorSerializer; supports pending vendors |
| `GET/PATCH /vendors/store-settings/` | Vendor profile | Same current view/serializer behavior as profile |
| `GET /vendors/dashboard/` | Approved | Overall counts/rating, ten recent orders, operating data and low-stock products |
| `GET /vendors/operations/summary/` | Approved | Store, today, order-stage, delivery and alert aggregates plus update time |
| `POST /vendors/store-status/` | Approved | `{is_open, closing_time?}`; returns persisted open state/closing time |
| `POST /vendors/bulk-update-stock/` | Approved | `{updates: [{id, stock}]}`; `{updated, errors}` including possible partial errors |
| `GET /orders/page-features/` | Config endpoint | Shared page configuration used by navigation/guards |

### Catalog and inventory

| Method and path | Access | Payload/query and response |
| --- | --- | --- |
| `GET/POST /vendors/products/` | Approved | Paginated products / product creation serializer; current active create flow uses inherited drafts |
| `GET/PUT/PATCH/DELETE /vendors/products/{id}/` | Approved owner | Detail/update/delete product; reads/updates use the corresponding product serializer |
| `GET /vendors/catalog-products/available/` | Approved | Available catalog list; chooser supplies search/page-size parameters |
| `GET /vendors/catalog-products/available/{id}/` | Approved | Active catalog item detail |
| `POST /vendors/products/from-catalog/` | Approved | Catalog-based product creation helper |
| `POST /vendors/inherited-products/draft-batch/` | Approved | `{catalog_product_ids: [...]}`; persisted draft batch/variants |
| `GET /vendors/inherited-products/` | Approved | Optional `approval_status` filter; inherited product list |
| `GET/PATCH /vendors/inherited-products/{id}/` | Approved owner | Inherited variant detail/update |
| `POST /vendors/inherited-products/{id}/duplicate/` | Approved owner | Duplicate variant draft |
| `POST /vendors/inherited-products/{id}/image-policy/` | Approved owner | `{inheritance_mode}` |
| `POST /vendors/inherited-products/submit/` | Approved owner | `{product_ids: [...]}`; submits variants for review |
| `GET/POST /vendors/catalog-proposals/` | Approved | Proposal history / `{items: [...]}` proposal creation |
| `GET/POST /vendors/categories/` | Approved | Category list or request/create flow; category approval still matters |
| `POST /vendors/categories/{id}/subcategories/` | Approved | Subcategory request/create flow |
| `GET/POST /products/{id}/images/` | Owner rules | Product image list / image upload |
| `DELETE /products/{id}/images/{image_id}/` | Owner rules | Remove image |
| `PATCH /products/{id}/stock/` | Vendor owner | Stock update, including threshold where supported; returns product |
| `GET /products/low-stock/` | Vendor | Low-stock product list |
| `POST /products/ai-image/` | Vendor rules | AI image generation capability; external runtime dependencies apply |

### Orders and dispatch

| Method and path | Access | Payload/query and response |
| --- | --- | --- |
| `GET /vendors/orders/` | Approved | Paginated history with status filtering; frontend helper accepts page/page-size/search parameters, whose backend support must be checked per view |
| `GET /vendors/live-orders/` | Approved | Array of recent/released orders with nested order data |
| `GET /vendors/orders/{id}/` | Approved owner | Full order detail |
| `PATCH /vendors/orders/{id}/status/` | Approved owner | `{status, cancel_reason?}`; validated transition |
| `POST /vendors/orders/{id}/accept/` | Approved owner | `{}`; accept placed order |
| `POST /vendors/orders/{id}/reject/` | Approved owner | `{reason}`; rejection/cancellation |
| `POST /vendors/orders/{id}/start-preparing/` | Approved owner | `{}`; start preparation |
| `POST /vendors/orders/{id}/mark-ready/` | Approved owner | `{}`; ready state, without automatic search |
| `POST /vendors/orders/{id}/start-delivery-search/` | Approved owner | `{}`; starts assignment job |
| `POST /vendors/orders/{id}/cancel-delivery-search/` | Approved owner | `{}`; cancels eligible active assignment |
| `POST /vendors/orders/{id}/verify-pickup-otp/` | Approved owner | `{otp}`; verifies eligible handoff |

### Finance, promotions, support, reviews, and inbox

| Method and path | Access | Payload/query and response |
| --- | --- | --- |
| `GET /vendors/analytics/` | Approved | `days=30` or `all`; period metrics and all-time payout summary |
| `GET /vendors/payouts/` | Approved | Paginated settlement records |
| `POST /vendors/payouts/{id}/approve/` | Approved owner | Approve eligible pending payout |
| `POST /vendors/payouts/{id}/decline/` | Approved owner | `{reason}`; records rejection/failure |
| `POST /vendors/payouts/{id}/verify-credit/` | Approved owner | Verify eligible paid credit |
| `GET /vendors/wallet/transactions/` | Approved | Paginated wallet transaction history; not connected to current payout ledger tab |
| `GET/POST /vendors/coupons/` | Approved | Paginated campaigns / coupon fields |
| `GET/PUT/PATCH/DELETE /vendors/coupons/{id}/` | Approved owner | Coupon detail/update/delete |
| `POST /vendors/coupons/{id}/duplicate/` | Approved owner | Duplicate coupon |
| `POST /vendors/coupons/{id}/reactivate/` | Approved owner | Reactivate coupon |
| `GET /vendors/{vendor_id}/reviews/` | Owner/admin | Review array |
| `GET/POST /support/tickets/` | Approved | Ticket array / `{subject, message, category, priority?}` |
| `GET /support/tickets/{id}/` | Approved owner | Ticket detail; no vendor PATCH handler |
| `GET /notifications/list/` | Authenticated | Complete user-owned array, not paginated |
| `PATCH /notifications/{id}/read/` | Authenticated owner | `{}`; updated notification |
| `POST /notifications/mark-all-read/` | Authenticated | Mark own notifications read |
| `GET /notifications/unread-count/` | Authenticated | `{unread_count, count}` |
| `GET /invoices/` | Authenticated/scoped | Invoice list |
| `POST /invoices/generate/` | Authenticated/scoped | Receipt `{invoice_type: 'customer_receipt', order}` or settlement `{invoice_type: 'vendor_settlement', payout_id}`; invoice metadata |
| `GET /invoices/{id}/download/` | Authenticated/scoped | PDF blob |

Public vendor list, nearby, detail and recommendation endpoints support the customer storefront, rather than vendor console administration. The detail serializer currently exposes private user/account fields and wallet balance; separating the public DTO is the highest-priority privacy correction in the plan. No production private data was retrieved during this audit.

Paginated responses normally have `{count, next, previous, results}` and a default size of 20. This applies only where the view implements pagination: notification, support-ticket and review arrays are exceptions. HTTP errors may be `{error: ...}`, `{detail: ...}` or field-validation maps. Accurate clients need typed normalization and must inspect partial-success bodies.

## Visual system and responsiveness

| Token/element | Current source |
| --- | --- |
| Primary purple | `#38268E` |
| Deep/hover purple | `#23117C` |
| Secondary purple | `#6557A8` |
| Accent orange | `#F97928` |
| Brand near-white | `#FBFBFC` |
| Shared light background/surface | `#F7F6FC` / `#FFFFFF` |
| Typography | Shared design-system variables and platform CSS; platform CSS imports Nunito |
| Icons | Material Icons Outlined / Material Symbols Rounded with font assets |
| Desktop shell | 280 px sticky sidebar, light topbar/content panels |
| Responsive shell | Adaptations at 1100 px and 760 px; phone drawer/bottom navigation |
| Forms/tables | Custom panels, shared dynamic table on product listings, status chips, local dialogs and toasts |

Vendor SCSS imports the shared design system; Angular then loads `nextou-platform.css` after vendor global styles. Existing global white-surface/font overrides and component-local rules overlap. The audit counted 1,816 global SCSS lines, 48 `!important` occurrences across vendor SCSS, and 16 static inline HTML styles. These are maintainability inventory figures, not speed measurements.

The admin reference for redesign is the current light-content/dark-sidebar console, not the old red/cyan dark-theme description in AGENTS.md. Proposed vendor redesign preserves the current purple brand and adopts consistent admin-style navigation, typography, panels, tables and dialogs, while prioritizing order and stock work.

## Runtime, build, and verification

Development API base is `/api`; production environment base is `/sa/api`. Google Maps key/map ID are empty in checked-in environment files. Docker vendor startup writes runtime configuration before serving. Redis is required for Channels and RQ; PostgreSQL is the normal database, with local SQLite settings available for Windows smoke checks. Delivery search needs the worker, and deferred/recurring processing needs the scheduler. Map/email/storage/payment integrations depend on their configured runtime credentials/services.

Current Docker frontend ports are admin 4200, customer 4201, vendor 4202 and delivery 4203. The historical AGENTS.md port examples differ. The vendor Playwright configuration also defaults to `http://127.0.0.1:4202`.

From the frontend directory on Windows:

```powershell
npx.cmd ng serve vendor-app --port 4202
npx.cmd ng build vendor-app --configuration production
npx.cmd ng lint vendor-app
npm.cmd run e2e:vendor
```

From the backend directory with the project environment activated:

```powershell
python manage.py check --settings=backend.config.local_sqlite
```

Vendor build output is `frontend/dist/vendor-app`. Initial bundle budgets are 650 kB warning / 1.2 MB error; component-style budgets are 50 kB warning / 100 kB error. Both explicit development and production configurations override the base href to `/`, despite the base option `/sa/vendor/`; subpath deployment must use the intended build/deployment configuration.

No vendor Angular unit-test target or vendor source `.spec.ts` files were found. The repository has five vendor Playwright cases and a separate shared auth-regression script. Current browser cases are basic smoke coverage, not complete business-workflow verification.

Previously recorded checks in the companion audit: production build passed with a 651.99 kB initial bundle, exceeding the warning threshold by 1.99 kB; vendor lint produced zero errors and 323 warnings. These checks were not rerun for this documentation-only pass. Authenticated stock, dispatch/OTP, settlement, and approval-correction behavior remains to be verified in a compatible local session.

## Issues that shape the redesign

The detailed plan has 28 findings with evidence and corrections. The main priorities are:

1. Separate public vendor responses from private account/financial fields.
2. Correct live-board classification and restore missed order events after connection loss.
3. Make inventory coverage, stock-save outcomes and store-opening state authoritative.
4. Paginate settlements/campaigns and use correctly scoped financial aggregates.
5. Lock payout transitions and distinguish vendor rejection from transfer failure.
6. Persist preparation progress appropriately and share order/action state across screens.
7. Provide approval correction/recheck and truthful bank/KYC readiness.
8. Synchronize notifications and align category contracts; correct coupon timezone conversion and settings hour/location validation.
9. Standardize accessibility, dialogs, loading/error states, navigation and responsive layout.
10. Consolidate styles and domain API types, then remove verified-unused legacy implementations.

The eight planned phases are baseline and critical fixes, design foundation and shell, order operations, catalog and inventory, finance and growth, onboarding and account, cleanup and performance, and full verification/release review. Each page should be verified against actual API behavior as it is redesigned. Publishing, deployment, and commits were not performed by this reference pass.

## Source references

Use these repository-relative paths to locate the contracts behind this reference:

- Routing/navigation/shell: `frontend/projects/vendor-app/src/app/app.routes.ts`, `config/vendor-navigation.ts`, `app.component.ts`, `app.config.ts`.
- Page behaviors: `frontend/projects/vendor-app/src/app/pages/`; reusable editors: `frontend/projects/vendor-app/src/app/shared/`.
- Startup/order orchestration: `frontend/projects/vendor-app/src/app/services/`.
- Shared APIs/auth/cache/notifications: `frontend/projects/shared/src/lib/api/`, `services/`, `guards/`, `interceptors/` and `models/`.
- Style tokens: `frontend/projects/shared/src/styles/_design-system.scss`, `nextou-platform.css`, and vendor `src/styles.scss`.
- Vendor routes/views: `backend/vendors/urls.py`, `backend/vendors/views/vendor.py`, `orders.py`, `payouts_and_misc.py`, `onboarding_public_views.py` and `detail_public_views.py`.
- Catalog contracts: `backend/products/views/catalog_views.py`, product serializers/models/data, and vendor category views.
- Vendor/business data: `backend/vendors/models/`, `backend/vendors/serializers/public.py`, and `backend/orders/models/order.py`.
- Authentication: `backend/accounts/views/auth_views.py`, `accounts/helpers/token_helpers.py`, and `backend/backend/config/settings.py`.
- Live channels: `backend/backend/config/asgi.py`, `backend/backend/middleware/ws_auth.py`, `backend/vendors/consumers.py`, and shared `services/websocket-auth.ts`.
- Support/inbox/invoices: `backend/support/views/ticket_views.py`, `backend/notifications/views/user_views.py`, notification repository, and `backend/invoices/`.
- Build and QA: `frontend/angular.json`, `frontend/package.json`, `frontend/playwright.vendor.config.ts`, `frontend/e2e/vendor-app.spec.ts`, `docker-compose.yml`, and `docs/admin-console-qa-report.md`.
