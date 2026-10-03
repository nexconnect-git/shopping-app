# Vendor app analysis and redesign plan

Prepared on 2 October 2026 for the Nextou vendor workspace. The recommended redesign combines the admin console's navigation, typography, tables, forms, and dialogs with workflows designed for vendors running a store. Fix order freshness, stock updates, account privacy, and misleading financial states first; then restructure every active page around the vendor's next task.

This is the plan created before implementation. Findings below distinguish baseline build and browser results, defects established by source inspection, and proposed improvements that require new contracts. The redesign is now implemented in the working tree; see the [implementation report](vendor-app-implementation-report.md) and [coverage matrix](vendor-implementation-coverage.md) for the current result. Baseline findings and measurements are retained here for comparison.

## Screenshot-led repair plan and current progress — 3 October 2026

The third pass follows the user's annotated screenshots and preserves the existing theme, standalone Angular/Signals/RxJS architecture, approval/ownership rules and retained backend workflows. The [implementation report](vendor-app-implementation-report.md) records confirmed causes, changed sources and named browser results; the [coverage matrix](vendor-implementation-coverage.md) distinguishes implemented work from verified and blocked acceptance.

| Order | Work | Current status |
| --- | --- | --- |
|1| Reproduce editor obstruction and unexplained red fields; repair selector provenance, accessible feedback, usable grids and save/submit hierarchy | Implemented; desktop/phone invalid/save/draft/lock checks, real failed-save retry and reload verified |
|2| Repair shared navigation, toolbars, inventory geometry and intentional phone wrapping; retain unchanged-disabled and cross-page stock behavior | Implemented; all14 links measured,18 operational routes revisited at6 widths, invalid/success/listing/paging/dirty checks verified |
|3| Compact request history; preserve mixed reasons and make follow-up use the actual granted catalog identity | Implemented; approved single item, mixed long reason,22-record paging and genuine follow-up/create verified |
|4| Unify effective operating state across shell/dashboard/settings; use returned timezone and readable settings grid | Implemented; real commands, overnight persistence and genuine stale/outage recovery verified |
|5| Revisit remaining pages, dialogs, access fields and shared consumers; repair newly reproduced errors | Implemented named checkbox/dialog/field associations;24 destinations/utility/aliases revisited, representative shared consumers checked |
|6| Verify actual writes/events and cold start; maintain reports and preserve unrelated work | Named product/request/store/order/inbox writes and fresh reads verified; API/worker/scheduler/vendor restarted; existing builds/lint/regressions pass |
|7| Complete release acceptance on target devices and configured staging providers | Pending: human credential submissions, PDF/CSV save/open, Maps/mail/push, actual200%zoom/mobile keyboard/screen reader, remaining race/partial-write/state permutations |

Do not add staff/multi-store controls, review replies, support chat/attachments or forecasting without an approved product/API contract. Reconcile synthetic QA ledger discrepancies separately from production finance acceptance. Resolve existing admin touched-email feedback and budget/icon warnings in their owning scope. Release requires reviewed submodule diffs and separately authorized commits/pushes/deployment; none were performed by this repair pass.

## Scope and baseline

The inventory covers 104 vendor source files, 29 component classes, and 34 route declarations. Those declarations load 21 distinct vendor page components and one shared feature-unavailable component; duplicate routes and redirects account for the remaining entries. It includes the shell, navigation, startup service, active and legacy pages, product creation and editing services, shared authentication/API/notification code, and backend contracts for vendor operations, products, orders, payouts, support, and public vendor detail.

The admin reference is the current working-tree implementation and `docs/admin-console-qa-report.md`. Its current design uses light content, a dark sidebar, local semantic tokens, restrained panels, readable typography, contextual profiles, responsive tables, and consistent dialogs. The repository contains substantial existing frontend and backend changes. Implementation must preserve that work and avoid resetting either submodule.

| Check | Result | Meaning |
| --- | --- | --- |
| Installed application framework | Angular core 21.2.25 in `frontend/package.json` | Preserve Angular 21. The older Angular 19 description in AGENTS.md does not match the current dependency baseline. |
| Vendor production build | Passed | Initial bundle 651.99 kB; warning threshold 650 kB, exceeded by 1.99 kB. No compilation errors. |
| Vendor lint | 0 errors and 323 warnings | Warnings include inaccessible click handlers, unassociated labels, extensive `any`, unused imports, and older template conventions. A passing exit code does not imply accessibility is clean. |
| Vendor component unit tests | No `.spec.ts` files under vendor source | Workflow invariants lack focused component/service regression coverage. |
| Existing browser tests | Five tests in `frontend/e2e/vendor-app.spec.ts` | Cover guest routes, invalid login, selected page headings, search/filter inputs, and one mobile scenario. They do not cover stock persistence, delivery assignment, OTP, payout transitions, or approval correction. |
| Browser observation | Local vendor login at `http://127.0.0.1:4202/login` | Login surface rendered and showed an invalid-credentials response. The repository test username is longer than the login's 30-character limit and was truncated by input handling. |
| Authenticated browser coverage | Unverified in this pass | The default repository QA login did not reach the workspace. Page layouts and workflows below are based on source inspection until tested with a compatible local account. |
| Style inventory | 1,816 lines in vendor global SCSS; 48 `!important` occurrences across vendor SCSS; 16 static inline HTML styles | Multiple overlapping styling layers increase the cost of consistent redesign. These are inventory counts, not performance benchmarks. |

Local Docker ports currently differ from the historical AGENTS.md table: the running vendor surface inspected here is on 4202; the admin QA report identifies the isolated admin preview on 4303. Verify the chosen app and API pair before testing. Browser observation of a running build is not proof that it contains every current source edit.

## What already works as a foundation

Keep the standalone lazy-loaded routes, Angular Signals, portal-scoped sessions, backend ownership checks, catalog inheritance and approval flow, product visibility blockers, shared currency handling, explicit driver search, payout approval and credit verification, and existing mobile navigation. Product create/edit and store settings already have separate template, style, model, mapper, and service files. The redesign should improve and simplify these foundations rather than discard them.

Order transitions already use a locked backend order record and validate allowed transitions. Invoice generation already resolves payout/order ownership and authoritative amounts on the server. Preserve these controls. A vendor must explicitly start driver search after marking an order ready; redesigning that screen must not introduce automatic search on readiness.

## Confirmed issues and improvement priorities

P1 means resolve before releasing the redesigned workflows. P2 means include in the relevant redesign phase. P3 means cleanup or optimization after the critical behaviors are stable. Source references are repository-relative and identify the relevant function or contract, so implementation can find the evidence without depending on this chat.

| ID | Priority | Finding and consequence | Evidence | Planned correction |
| --- | --- | --- | --- | --- |
| V01 | P1 | Public vendor detail exposes private account data. The anonymous detail view serializes `user_info`, including account email, phone, login/activity metadata and privilege flags, plus `wallet_balance`. | `backend/vendors/views/detail_public_views.py:19`; `backend/vendors/serializers/public.py:24`, `get_user_info` | Introduce a dedicated public detail DTO and separate private profile serializer. Preserve customer catalog and delivery-quote fields. Add an anonymous response regression test proving private fields are absent. |
| V02 | P1 | Delivered, cancelled, picked-up, and on-the-way orders retaining a driver are classified as Driver Assigned. The driver check runs before terminal and dispatch statuses. | `frontend/projects/vendor-app/src/app/pages/live-orders/live-orders.component.ts:229`, `boardKey` | Evaluate terminal and dispatch statuses first. Model fulfillment status and assignment status separately, with regression cases for every combination. |
| V03 | P1 | The live board claims “Polling fallback” but has no polling fallback. Reconnection neither fetches a new snapshot nor recovers events missed while disconnected. | `pages/live-orders/live-orders.component.html`, live pill; matching TS `connectOperationsSocket` and `scheduleReconnect` | Build an operations service with snapshot reconciliation after reconnect, visibility-aware fallback polling, token refresh handling, backoff, and truthful connection labels. |
| V04 | P1 | Inventory and the opening-stock modal read only the first product page, although their controls imply store-wide coverage. Default product pagination is 20. | `pages/inventory/inventory.component.ts:94`; `pages/dashboard/dashboard.component.ts:238`; `backend/vendors/helpers/public_vendor_helpers.py`, `StandardPagination` | Add server-side inventory filtering/pagination and authoritative health totals. Make opening-stock review cover the complete required set. Never present page counts as whole-store counts. |
| V05 | P1 | Bulk stock responses can contain row errors with HTTP 200. Inventory treats every response as success, and dashboard proceeds to open the store after any successful HTTP response. | `backend/vendors/views/vendor.py`, `BulkUpdateStockView`; `backend/vendors/actions/stores.py`, `BulkUpdateStockAction`; inventory `bulkSaveVisible`; dashboard `submitStock` | Define a typed result with updated rows and actionable errors. Keep failed drafts editable, report partial success accurately, and block opening until required stock updates succeed. |
| V06 | P1 | Stock-check policy is enforced primarily in the dashboard UI. Store status action does not perform that check; the profile/settings PATCH also accepts operating fields and `require_stock_check` through a broad serializer under `IsVendor`. | `backend/vendors/actions/stores.py`, `SetStoreStatusAction`; `backend/vendors/views/vendor.py:16`; `backend/vendors/serializers/public.py`, `read_only_fields` | Split profile corrections, operating controls, and admin-managed policy fields. Enforce approval and stock readiness in a single backend opening action. Test direct API paths, not just disabled UI buttons. |
| V07 | P1 | Dashboard sets `is_accepting_orders` true locally after opening, but the store-status action only persists `is_open` and closing time. A paused store can appear to accept orders while remaining paused in the database. | `pages/dashboard/dashboard.component.ts:215`; `backend/vendors/actions/stores.py`, `SetStoreStatusAction` | Return and display the authoritative operating state. Define open, accepting, paused, and outside-hours states consistently across dashboard, header, settings, and customer availability. |
| V08 | P1 | Payout history only loads its first page. Analytics independently sums that page, even though the analytics API already provides an aggregated `payout_summary`. The selected revenue period and payout totals also have different scopes. | `pages/payments/payments.component.ts:88`; `pages/sales-report/sales-report.component.ts:41`; `backend/vendors/actions/analytics.py`, `payout_summary` | Paginate payouts and use authoritative aggregates. Label settlement totals as all time if that is their contract, or add a period-aware aggregate. Never silently imply selected-period settlement totals. |
| V09 | P1 | Payout approval, decline, and verification use direct read/change/save operations without the order workflow's transactional locking. Concurrent admin/vendor changes can race. | `backend/vendors/views/payouts_and_misc.py`, payout action views | Move transitions to actions and repositories with locks or conditional updates, allowed-transition validation, audit events, and deterministic stale-state responses. |
| V10 | P2 | One busy order/product ID cannot track concurrent row requests. Actions on a second row overwrite the first busy marker; bulk inventory saving sets no pending marker. | `pages/live-orders/live-orders.component.ts`, `busyOrder`; `pages/inventory/inventory.component.ts`, `savingId`, `bulkSaveVisible` | Track pending work per entity, guard duplicate submissions, and give bulk operations a dedicated pending state. Refresh authoritative values after conflicts. |
| V11 | P2 | Dashboard makes three requests every 15 seconds, including store settings. Orders/products use independent polling; pending approval polls every 30 seconds. These page timers lack visibility pausing and coordinated request cancellation. | Dashboard/orders/products/pending-approval `ngOnInit`; `services/vendor-app-startup.service.ts` | Coordinate polling per domain, pause hidden pages, prevent overlap, cancel stale filter requests, and keep existing rows visible during background refresh. Load settings on demand rather than every operations tick. |
| V12 | P2 | Prep checklist exists only in component memory. It resets on navigation/reload, and the cached elapsed-minutes computed value has no reactive clock. Prep loads once, so assignment changes can be missed. | `pages/order-prep/order-prep.component.ts:32`, `elapsedMinutes`, `ngOnInit` | Add a reactive clock and subscribe to the shared order state. Persist checklist progress per vendor/order using a documented local-only model initially; add backend persistence before claiming cross-device synchronization. |
| V13 | P2 | Prep disables Mark Ready until all items are checked, while live board and detail can mark ready without that checklist. Pickup OTP entry also appears regardless of handoff eligibility on prep. | Order prep/live board/detail templates and actions | Set one preparation policy and use one action-eligibility helper everywhere. Show OTP entry only for ready orders with an assigned driver. Any mandatory checklist policy needs backend enforcement. |
| V14 | P2 | Detail order load/status errors can leave an empty page or unhandled action failure. Tracking socket has no recovery status or reconnect logic; JSON event parsing is unguarded. | `pages/order-detail/order-detail.component.ts`, `loadOrder`, `updateStatus`, `connectWebSocket` | Distinguish missing, forbidden, failed, loading, and stale states. Add typed socket parsing, reconnection, last-location age, action feedback, and a textual fallback when maps fail. |
| V15 | P2 | Pending approval describes missing/corrected details/documents but offers no correction flow. Invalid/rejected/suspended states stop polling without a manual status recheck. Normal support API requires approval. | `pages/pending-approval/*`; `backend/support/views/ticket_views.py`; `app.routes.ts` | Provide manual recheck and clearly scoped correction/contact actions. Add restricted onboarding read/correction APIs if needed; do not reuse approved-only support or admin endpoints. |
| V16 | P2 | Launch checklist hardcodes payout completion to false. Payout page says bank/KYC support is not connected even though admin onboarding and bank metadata exist elsewhere. | `pages/dashboard/dashboard.component.ts:93`; `pages/payments/payments.component.ts:61`; backend vendor onboarding/admin serializers | Expose a masked vendor-owned readiness summary. Render complete, action required, pending admin, and unavailable states from data. Keep document verification and bank-change authority explicit. |
| V17 | P2 | Coupon datetime-local values are built by slicing UTC strings, then saved by parsing them as local time. Editing can shift campaign times; local defaults are also incorrect. | `pages/coupons/coupons.component.ts:186`, `openEdit`, `save` | Use explicit UTC-to-local and local-to-UTC mapping with round-trip tests in Asia/Calcutta. Keep API ISO timestamps and form-local values separate. |
| V18 | P2 | Campaign filters and summary cards operate on one loaded page. Payout “Ledger” is the same settlement array, and Failed is labeled Declined even when no vendor decline occurred. | Coupons `filteredCoupons`/`summary`; payments `filteredPayouts`/`statusLabel`; `vendors/models/vendor_payout.py` | Use server filters/aggregate counts. Distinguish transfer failure from vendor decline using existing reason data or an explicit contract. Build a real ledger from transactions, or accurately label the settlement history. |
| V19 | P2 | Notification API returns the complete user list without pagination; the inbox owns separate unread state from the shell. Shell caches eight messages and reloads only while its list is empty. Approval/support filters do not match declared backend types; promo is absent. | `pages/notifications/*`; `app.component.ts`, `toggleNotif`; `backend/notifications/views/user_views.py`; `backend/notifications/data/notification_repository.py`; `backend/notifications/models/notification.py` | Centralize inbox/unread state, refresh dropdown on open, add pagination/server filtering and one deep-link resolver. Map supported types and documented subtypes instead of inventing top-level types. |
| V20 | P2 | Store settings reject overnight hours even though the backend availability helper supports them. Missing coordinates become zero, then zero is treated as missing. Geolocation errors select the old/default location and show “Location selected” as success. | `shared/vendor-store-settings/vendor-store-settings.service.ts`, `fromApiDto`, `validate`, `useMyLocation`; `backend/helpers/vendor_hours.py` | Model coordinates as nullable, validate finite ranges, preserve valid zero values, support overnight hours, and clearly report geolocation failure without silently moving a pin. |
| V21 | P2 | Product editor readiness says “Ready for publication” from availability/status without including admin approval and visibility blockers. Catalog chooser caps its current result set at 100. Draft creation resets the local workflow on entry; there is no route leave guard. | `shared/vendor-product-edit/vendor-product-edit.service.ts`, `readinessItems`; product-create service `loadCatalogItems`; `pages/product-create/product-create.component.ts`; routes | Reuse backend publication eligibility. Add catalog pagination/search and a resume-draft workflow. Scope form state to the page and implement safe leave/resume handling for persisted and unsaved changes. |
| V22 | P2 | Product submit performs multiple independent saves before final batch submission. A partial failure can leave some variants saved without identifying exactly which need retry. The approval note is returned to the component but is not sent by the API submission method. | Product-create service `submitForApproval`; shared API `submitInheritedProducts` | Return per-variant outcomes or add an atomic batch contract. Show accurate saved/submitted states. Persist approval notes only with a supported backend field; otherwise remove the misleading input. |
| V23 | P2 | Login sanitizes/truncates usernames to 30 characters while the backend User allows 150 and the default E2E username exceeds 30. Login also always navigates to the dashboard instead of consuming a protected-route return URL. | Shared `utils/input-validation.ts:13`; `pages/login/login.component.ts`; `e2e/vendor-app.spec.ts`; accounts initial migration | Separate registration constraints from login identity handling; preserve legitimate existing identifiers. Restore safe internal return URLs after approval/password checks and repair test fixtures. |
| V24 | P2 | Forms, clickable containers, dropdowns, and custom dialogs have accessibility warnings. Native prompt/confirm/alert and different local dialogs create inconsistent workflows. Some component labels are below the admin baseline's 13px minimum. | Vendor lint output; live `reject`; inventory bulk confirm; product discard; detail download alert; shell and form templates/SCSS | Use labeled semantic controls and shared accessible dialogs with focus trapping/restoration, Escape handling, pending guards, live error summaries, visible focus, and adequate touch targets. |
| V25 | P2 | Styling layers disagree. Live board component declares nine columns, global vendor SCSS overrides the board to four, and shared platform CSS loads after vendor SCSS. Global font-weight/background overrides defeat local hierarchy. | Vendor `styles.scss:965`; live-orders SCSS `.kanban`; `frontend/angular.json` vendor styles list | Establish vendor-scoped semantic tokens with deterministic load order. Replace overlapping global page overrides with reusable layout components and local styles. Validate all breakpoints after each conversion. |
| V26 | P2 | Failed requests often clear loading without a persistent error state; empty-state UI can imply no records. Analytics couples two requests via forkJoin, so payout failure hides otherwise available analytics. | Orders/coupons/reviews/catalog/detail load methods; sales report `loadStats` | Give each data region explicit loading, empty, filtered-empty, error, forbidden, stale, and refresh states. Make analytics regions fail independently. |
| V27 | P3 | `VendorApi` is an empty subclass of the entire shared `ApiService`, so domain separation is nominal. Large product services, legacy pages, scattered `any`, and stale localStorage labels remain. | `projects/shared/src/lib/api/vendor-api.service.ts`; vendor services; `pages/product-form`, `profile`, `stock-management`, `wallet` | Add focused typed vendor domain methods behind the shared public API with compatibility wrappers. Remove unused legacy implementations after import checks and preserve URL redirects. |
| V28 | P3 | Live endpoint serializes up to 14 days of orders with nested items/tracking into one response, including terminal history. Delivery “assigned” summary counts historical accepted assignments rather than explicitly active orders. | `backend/vendors/actions/operations.py`, `VendorLiveOrdersAction`, `assignment_counts` | Use active status filtering plus a bounded recent-completed section, server counts, and measured query/payload budgets. Restrict operational assignment counts to their documented active scope. |

V01 is established from serializer/view source; no public production data was retrieved. V06 identifies an API policy gap, not evidence that unapproved vendors are currently appearing in customer listings. Runtime authorization and customer visibility cases belong in the release tests.

## Redesign direction

Use the admin console's restrained workspace pattern: dark navigation, light canvas, white panels, consistent page headings, compact toolbars, contextual actions, clear status chips, and accessible forms. Vendors need faster order acceptance and stock correction, so the information hierarchy must prioritize today's operational work over decorative heroes and repeated metric strips.

The proposed vendor palette retains the actual current brand: purple `#38268E`, hover/deep purple `#23117C`, and orange `#F97928` for selective secondary emphasis. Use the admin pattern's navy sidebar and neutral surfaces, with vendor-specific tokens rather than changing shared global colors. AGENTS.md's older purple/pink palette differs from current source; this plan assumes preservation of the current source brand.

| Element | Proposed standard |
| --- | --- |
| Canvas and panels | Canvas `#F4F6FA`, white panels, border `#E2E8F0`, text `#182338`, muted `#64748B`; finalize from screenshots and contrast checks. |
| Typography | Match admin system-font stack. Body/input 15px, table/nav 14px, metadata at least 13px; page title 24–28px. Verify computed sizes rather than relying only on tokens. |
| Spacing and surfaces | 4/8/12/16/24/32px spacing; 8–12px radii; subtle elevation for floating UI. |
| Header | Breadcrumb, page title, real store intake status, search/quick actions, notification inbox, profile menu. Hide nonessential controls on phones. |
| Action hierarchy | One primary task per region. Destructive/financial actions have contextual review and accurate success/failure outcomes. |
| Lists | Desktop tables with stable row actions and server paging; phone cards or carefully scoped horizontal table containers. Keep document-level overflow absent. |
| Forms | Grouped sections, visible labels and required markers, inline errors, persistent save/cancel controls, unsaved-change protection. |
| Status | Text plus icon and color. Store availability, product approval, delivery assignment, and payout state remain distinct concepts. |
| Motion | Short transitions; honor reduced-motion preferences. Essential freshness/status information must remain understandable without animation. |

### Navigation structure

| Group | Pages | Rationale |
| --- | --- | --- |
| Operations | Overview, Live Orders, Order History, Inventory | Daily work in one group; move Orders out of Catalog. |
| Catalog | Products, Add Products, Catalog Requests | Separate catalog merchandising from stock adjustments. Add Products is also the contextual Products CTA. |
| Growth | Analytics, Promotions, Reviews | Performance and customer feedback. |
| Finance | Payouts and settlement detail; transaction history when connected | Finance receives a dedicated group instead of appearing under Growth. |
| Store and Account | Store Settings, Support, Notifications, Account Security | Business setup and account tasks, with account identity separate from store identity. |

Phone navigation: Home, Live Orders, Inventory, Inbox, More. More exposes Catalog, Finance, Growth, and Store Settings. Retain all existing canonical routes and redirect aliases; route changes must not break notification links. Keep feature configuration authoritative and make disabled-route behavior consistent with visible navigation. Do not bypass deliberate admin feature controls.

### Page specifications

| Surface | Planned structure and workflow |
| --- | --- |
| Login | Compact brand panel and sign-in form, password visibility, recover-account route when backend flow is available, persistent validation, valid long usernames, safe return navigation. |
| Register | Account → Store → Location → Review. Maintain identity availability checks, image validation and cleanup, visible server errors, precise pin selection, and final submission summary. Keep passwords out of saved drafts. |
| Change password | Focused security form with requirements, confirmation, clear expiry/error states, and correct routing for approved versus pending accounts. |
| Approval status | Status timeline, admin reason, required next action, manual recheck, last-checked timestamp, and correction/contact capability appropriate to account state. |
| Feature unavailable | Explain the disabled feature and give a working route back; provide error/retry only when configuration loading actually failed. |
| Overview | Store control bar; today's revenue/orders; intake and preparation queues; driver-search exceptions; low-stock actions; payout actions; data-backed launch checklist. Separate refresh from initial loading. |
| Live Orders | Active stages New, Preparing, Ready/Handoff, In Delivery. Show Confirmed as a substate/queue within preparation and driver search/assignment as handoff badges. Completed/cancelled belong to bounded history rather than permanent operational lanes. Desktop board plus list toggle; phone stage tabs and cards. |
| Order History | Search by order/customer, status and date filters, URL-backed filter state, server paging, totals with explicit scope, detail/prep shortcuts, contextual cancellation. |
| Order Prep | Large quantities and item checklist, customer notes, packing checks, elapsed time, one next action, driver-search state, eligible OTP handoff. Phone sticky actions must not cover checklist content. |
| Order Detail | Status timeline and action panel, line items and totals, customer/delivery details, assignment lifecycle, live map with textual fallback, invoice download, cancellation reason and feedback. |
| Products | Search/filter toolbar; approval/customer visibility badges; price/stock summary; row actions; server paging. Health blockers open a useful correction panel with edit/resubmit links. |
| Product creation | Catalog selection → Variant pricing/inventory → Fulfillment/images → Review and submission. Support any number of variants with a repeatable editor, not misleading two-variant step names. Save and resume drafts; identify partial failures. |
| Product editing | Identity/catalog context, selling details, stock/availability, fulfillment and media policy, approval history/readiness, persistent save area. Show which changes need review and which apply immediately. |
| Catalog Requests | Proposal form with repeatable items, category/unit selection and validation; paginated request history; review status/reason and eventual catalog linkage where contract supports it. |
| Inventory | Server-backed health tabs, search/category filters, authoritative counts, row stock and availability controls, dirty-row review, changed-row bulk save, actionable partial errors. |
| Promotions | Search and lifecycle filters, accurate aggregate summaries, campaign editor and customer preview, timezone-safe schedule, discount/usage limits, duplicate/reactivate/delete outcomes. Presets must accurately describe eligibility the backend enforces. |
| Analytics | Clearly scoped period picker, revenue/order/customer metrics, chart with labeled values and accessible table, top products, coupon influence and stock risk. Settlement aggregates have a separate explicit scope. CSV should match visible metrics and safely escape user-controlled values. |
| Payouts | Readiness card from masked account metadata, status tabs, server paging, gross/commission/net breakdown, period and transfer reference, approval/decline review, verify-credit action, statement download. Approved and Verified remain discoverable. |
| Reviews | Summary and rating distribution, low-rating/recent filters, context and readable feedback cards. Add server paging for scale; do not imply seller replies exist unless implemented. |
| Support | Ticket list and detail panel, accurate open/resolved counts, subject/category/message validation, visible admin reply and status. Current contract is one request and one stored admin response, not a chat thread. |
| Notifications | Paginated inbox, supported categories/subtypes, unread filters, consistent entity links, shared unread counts, mark-one/all with feedback and synchronized dropdown. |
| Store Settings | Sections for store identity/media, location, hours, order intake/preparation, delivery radius/preferences and policy. Masked onboarding/finance status is separate from editable operating controls. Support overnight hours and reliable save/reload. |
| Legacy implementations | Audit references to profile, stock-management, wallet and product-form. Consolidate into canonical settings/inventory/payout/product features; retain redirect URLs and remove dead implementations only after confirming no imports. |

### Screen composition

The desktop overview begins with the store operating bar, followed by four compact metrics and a two-column workspace: active orders and preparation on the left, urgent stock/search/payout tasks on the right. The launch checklist appears only while actionable. A compact table follows for recent orders.

Live Orders uses the full workspace width. Stage counts and connection state sit above the board; each order card shows order number, elapsed age, units, payment method, notes indicator, fulfillment/driver state, and the next valid action. Phones render one selected stage at a time, with a persistent count and an accessible action area.

The order workspace uses a main content column for items, notes, and tracking, and a narrower action column for workflow, handoff, and totals. On phones, the action column moves into the content flow, with one sticky next action. Tables, dialogs, and maps each have their own responsive behavior rather than relying on a scaled desktop page.

## Architecture and contract work

Keep feature business state outside page components. Add focused services for vendor operating state, live order reconciliation, order eligibility/actions, inventory drafts, catalog/variant editing, payouts, and inbox state. Keep all HTTP contracts exposed through `@shared/public-api` and domain methods; migrate away from the empty inheritance wrapper incrementally.

Build a vendor UI kit for page headers, toolbars, status chips, metric tiles, tables/pagination, row menus, dialogs, form fields, skeletons, empty/error states, and sticky phone actions. Reuse neutral admin patterns; extract reusable primitives only where behavior and accessibility are genuinely shared. Never import admin-only permissions, admin DTOs, or admin page components into the vendor app.

| Contract area | Existing capability | Required work or limit |
| --- | --- | --- |
| Operating state | Dashboard, operations summary, profile/settings, store-status, bulk-stock | One authoritative availability DTO; validated open/pause/close commands; readiness enforcement; safer writable fields. |
| Orders and dispatch | Order list/detail and action endpoints; operations/tracking sockets | Snapshot reconciliation, bounded live list, shared eligibility, explicit freshness and errors; server checklist persistence only if cross-device prep is introduced. |
| Products | Paginated vendor products, catalog search, draft batch, submit, update, images | Server health filters/counts, complete opening-stock set, resumable drafts, per-variant outcomes; preserve inherited image policy and approval. |
| Finance | Payout list/actions; wallet transactions; authoritative analytics payout aggregates; scoped invoices | Pagination/filtering, transactional transitions, meaningful failure reasons, typed masked readiness. Use existing aggregate rather than summing one page. |
| Onboarding | Private profile status plus admin onboarding/bank/document APIs | Add narrowly authorized own-vendor readiness/correction contracts. Admin document verification and financial permissions must remain enforced. |
| Support | Vendor ticket list/create/detail, stored admin response | Redesign existing ticket UI now. Replies, attachments and real message history require separate models/endpoints and are an optional later feature. |
| Notifications | Notification list/read APIs and polling | Shared inbox state, contract-aligned categories/subtypes, pagination and deep-link mapping. |
| Public vendor information | Public detail currently reuses private serializer | Mandatory serializer separation with customer compatibility tests. |

Backend changes follow HTTP-only views, one `execute()` method per action, and ORM queries inside repositories. Existing direct ORM/business logic in operations, analytics, stock and payout paths should move to repositories/actions as those features are touched. Use top-level absolute imports and reuse shared helpers.

## Implementation sequence

Each phase must produce reviewable pages and verified behavior before the next dependent phase. These are work packages rather than calendar promises; duration depends on API scope and available test data.

| Phase | Work | Exit criteria |
| --- | --- | --- |
| 1 Baseline and critical fixes | Record current working-tree baseline, verify local app/API pairing and fixtures; fix privacy exposure, live classification/freshness, incomplete stock coverage/partial results, store-state policy, and payout races/aggregates. | Focused frontend/backend regressions pass; anonymous/private DTOs separated; inventory beyond 20 rows and reconnect gaps tested. |
| 2 Design foundation and shell | Vendor tokens, predictable style load order, reusable UI primitives, grouped sidebar/header/mobile navigation, accessible menus/dialogs. | Shell works at all six viewports; brand/logo intact; truthful store/inbox state; no page-level overflow or navigation regressions. |
| 3 Operations | Overview, Live Orders, History, Prep, Detail; shared operations/order services, clock, driver search and OTP recovery. | End-to-end order journey and search cancel/retry/timeout pass; no duplicate actions; terminal orders correctly classified; preparation policy consistent. |
| 4 Catalog and inventory | Product list, create/edit, request history, stock editing, media, approval blockers and draft recovery. | More than 20 products and 100 catalog items supported; save/submit errors identify failed rows/variants; reload confirms persistence. |
| 5 Finance and growth | Payout workspace/statements, real or accurately labeled ledger, masked readiness, analytics, promotions, reviews. | Gross/commission/net and totals agree with authoritative records; valid payout transitions; coupon schedules round-trip; filters/counts correct. |
| 6 Onboarding and account | Login/register/password/approval screens, store settings, restricted corrections, support and unified notifications. | Pending/suspended/approved routes behave correctly; long existing usernames work; correction limits enforced; hours/location and unread state persist correctly. |
| 7 Cleanup and performance | Remove unused legacy code after reference checks; type DTOs and events; reduce style duplication, polling, query/payload sizes and unnecessary initial imports. | Vendor warnings resolved or individually justified; initial bundle below existing warning threshold; no new shared-app regressions. |
| 8 Full verification and release review | Browser route/viewport matrix, persistent workflow tests, accessibility checks, backend integration checks with Redis/RQ, deployment-prefix/static-asset validation. | QA report contains screenshots, pass/fail evidence, remaining limitations and deployment commands. Each submodule is handled independently before any parent pointer bump. |

Recommended first visual slice: the complete shell, overview and live order workspace. This establishes navigation, visual rhythm and the most valuable vendor workflow before applying the same components across catalog, finance and account pages.

## Verification plan

| Dimension | Required scenarios |
| --- | --- |
| Responsive coverage | Every active surface at 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024 and 390×844; add a narrow 360px phone smoke check. Include tables, dialogs, date pickers, maps and sticky action areas. |
| Accounts | Guest, approved vendor, pending, hold, rejected, suspended, missing documents/details, forced password change, expired session, wrong portal role. Fixtures stay in an isolated local database. |
| Orders | Placed → confirmed → preparing → ready; explicit search → notified → accepted; cancel/retry/timeout/failure; correct pickup OTP → picked up → on the way → delivered; cancellation with reason before pickup. |
| Freshness | Disconnect/reconnect, missed socket events, token expiry, invalid messages, hidden-tab pause/resume, slow responses, stale action conflicts, one-minute/elapsed timers. |
| Stock and catalog | At least 25 products and over 100 catalog items; zero/low/paused stock; integer/finite input; one failing bulk row; blocked opening; approval rejection/resubmission; image-policy behavior; draft resume and browser navigation. |
| Finance | Each payout status including approved/verified; parallel action conflict; server totals against records; first/second page; statement ownership; accurate failed/declined explanation. Financial test mutations use isolated fixtures. |
| Growth and dates | Campaign creation/edit/duplicate/reactivate; active/upcoming/expired filters across pages; timezone round-trip; chart values/CSV versus API; independently failing analytics sections. |
| Settings and onboarding | Save then reload; overnight hours; nullable versus valid coordinates; location denied/unavailable; server-side operating policy; masked finance/doc readiness; correction access limited to own vendor. |
| Inbox and support | Shell and inbox unread counts agree; new messages refresh; supported category and deep links; failed read actions; ticket validation and actual admin-response model. |
| Accessibility | Keyboard-only navigation, menu/dialog focus trapping and restoration, Escape behavior, associated labels, error announcement, contrast, 44px primary phone targets, reduced motion and zoom. Automated checks supplement manual inspection. |
| Shared regressions | Admin/customer/delivery production builds and auth regressions whenever shared contracts, primitives or interceptors change. Public serializer changes preserve customer store/catalog functionality. |
| Production routing | Verify actual hosting paths and reverse proxy; refresh deep links; lazy chunks, logos, icons, placeholders and API/socket paths. Vendor production currently uses base href `/`, while AGENTS.md describes a `/sa/` deployment, so deployment behavior requires explicit verification. |

Current validation commands:

```powershell
cd D:\Projects\NexConnect\shopping-app\frontend
npx.cmd ng build vendor-app --configuration production
npx.cmd ng lint vendor-app
npm.cmd run test:auth
npx.cmd playwright test --config playwright.vendor.config.ts
```

Run browser tests only after choosing a compatible seeded account and correct local backend. The existing tests' login username requires repair before they provide useful authenticated coverage. `ng test vendor-app` is not currently a configured Angular target; add the appropriate runner or use the existing Node/Playwright test infrastructure for focused workflow coverage instead of documenting a nonexistent passing test command.

Use `D:\Projects\NexConnect\shopping-app\venv\Scripts\python.exe manage.py check --settings=backend.config.local_sqlite` from `backend` for the Windows-safe Django smoke check when making backend changes. Redis/Channels/RQ assignment and financial-concurrency integration need the isolated full backend stack; SQLite smoke checks cannot establish those behaviors.

## Completion criteria and deliverables

The redesign is complete when every active vendor surface uses the coherent workspace, the critical findings are fixed, important data saves survive reload, all allowed order/payout transitions behave correctly, complete result sets are reachable, and desktop/phone workflows pass the route matrix. Empty, failed, forbidden and stale states must be distinguishable. Critical controls must work with keyboard and phone touch, and production deep links/assets must resolve under the actual hosting configuration.

Deliver the restructured application code, focused workflow regressions, API contract notes for new or changed behavior, and a vendor QA report with real screenshots and unresolved limitations. Keep templates in HTML, styles in SCSS and logic in TypeScript. Do not commit or push unrelated working-tree edits. If commits/pushes are requested, commit and push backend/frontend separately before updating parent submodule pointers.

Suggested later additions are staff permissions, multi-store switching, barcode workflows, durable cross-device prep checklists, replies/attachments in support, and review responses. They are valuable candidates, but not existing capabilities and not required to complete the core redesign. Their authorization, data models and backend contracts should be designed separately.
