# Nextou Architecture Migration Plan

## Current Architecture Summary

Nextou is currently a Django/DRF modular monolith backend with an Angular multi-app frontend. The parent repository owns two Git submodules:

- `backend` -> Django API, domain apps, WebSockets, RQ workers.
- `frontend` -> Angular workspace with `customer-app`, `vendor-app`, `delivery-app`, `admin-panel`, and `shared`.

The backend already follows the intended views/actions/data layering in most areas, but pricing, checkout, dispatch, tracking, payment, inventory, and durable events still need stronger internal boundaries.

The frontend is moving away from a single shared `ApiService` and god-style customer `AppStateService`. The working tree already contains in-progress changes for shared API clients, session storage, customer facades, startup services, vendor order facade, and delivery workflow services.

## Target Architecture Summary

Frontend target:

- Role/domain API clients in `projects/shared/src/lib/api`.
- Shared auth/session/token source.
- App-specific facades for customer, vendor, and delivery workflows.
- Root app components that only compose app shells, overlays, and route state.
- Centralized navigation config per app.
- Feature config that never blocks auth or core commerce access when remote config fails.
- WebSocket URL construction based on API origin, not frontend origin.

Backend target:

- Keep the Django modular monolith.
- Strengthen internal action boundaries for checkout, pricing, dispatch, tracking, payment, inventory, and search.
- Add durable domain event foundations without replacing existing Django signals yet.
- Preserve existing public API contracts.

## Migration Phases

1. Phase 0: Baseline audit and safety checklist.
2. Phase 1: Customer route cleanup and removal/redirect of unwanted customer-facing flows.
3. Phase 2: Safe/non-blocking page-feature route policy.
4. Phase 3: WebSocket URL architecture fix.
5. Phase 4: Centralized auth/session and legacy customer interceptor removal.
6. Phase 5: Split shared `ApiService` into role/domain clients.
7. Phase 6: Split customer `AppStateService` into focused facades.
8. Phase 7: Root app components become shell-only with startup services.
9. Phase 8: Vendor order detail facade/service extraction.
10. Phase 9: Delivery active workflow facade/service extraction.
11. Phase 10: App-specific navigation configuration.
12. Phase 11: Backend internal architecture hardening.
13. Phase 12: Durable domain event foundation.
14. Phase 13: Dispatch foundation hardening.
15. Phase 14: Search/discovery architecture preparation.
16. Phase 15: UI production readiness pass.
17. Phase 16: Validation.
18. Phase 17: Final documentation.

## Files Audited In Phase 0

- `AGENTS.md`
- `.gitmodules`
- `backend/manage.py`
- `backend/requirements.txt`
- `frontend/package.json`
- `frontend/angular.json`
- `frontend/projects/shared/src/lib/services/api.service.ts`
- `frontend/projects/customer-app/src/app/app.routes.ts`
- `frontend/projects/customer-app/src/app/services/app-state.service.ts`
- `frontend/projects/shared/src/lib/guards/page-feature.guard.ts`
- `frontend/projects/shared/src/lib/services/page-feature-access.service.ts`
- `frontend/projects/shared/src/lib/services/websocket-auth.ts`
- `frontend/projects/vendor-app/src/app/pages/order-detail/order-detail.component.ts`
- `frontend/projects/delivery-app/src/app/pages/active-delivery/active-delivery.component.ts`

## Files To Change

Frontend:

- Customer routes, shell, startup, account/navigation, and route aliases.
- Shared feature config guard and access service.
- Shared WebSocket helper and all callers.
- Shared auth/session/token services and interceptors.
- Shared role/domain API clients and compatibility `ApiService`.
- Customer facades and compatibility `AppStateService`.
- Vendor order workflow facades/services.
- Delivery active workflow facades/services.
- Navigation config files for each app.

Backend:

- Checkout/pricing/order-state action modules.
- Delivery dispatch/tracking action modules.
- Durable domain event model/action helpers if introduced in this pass.
- Tests around moved logic and event/dispatch behavior.

## Current In-Progress Working Tree Notes

The frontend submodule already contains uncommitted architecture changes before this document was created:

- Removed customer page files for wishlist, wallet, offers, referral, help, and issues.
- Deleted legacy customer `core/auth.interceptor.ts`.
- Added shared `session-store.service.ts`.
- Added shared API client files under `projects/shared/src/lib/api`.
- Added customer facade folder under `projects/customer-app/src/app/services/facades`.
- Added `customer-app-startup.service.ts`.
- Added vendor `vendor-order.facade.ts`.
- Added delivery services including `delivery-workflow.facade.ts` and `driver-location.service.ts`.
- Modified customer, vendor, delivery, and shared files across auth, routes, page features, WebSockets, and startup.

Backend also has pre-existing uncommitted changes:

- `accounts/apps.py`
- `accounts/services/email_template_service.py`
- `backend/config/local_sqlite.py`
- `backend/config/settings.py`
- deleted `backend_quality_tests/__init__.py`
- added `accounts/checks.py`
- added `accounts/management/commands/send_test_email.py`

## Risks

- Large dirty submodule working trees make ownership of existing changes unclear.
- Customer route cleanup must not remove backend support, notification, coupon, or wallet APIs used by vendor/admin/delivery.
- Feature config fail-closed behavior can lock users out if applied to auth or core commerce routes.
- WebSocket URL changes can break split-origin deployments if callers pass full URLs instead of socket paths.
- `ApiService` compatibility must remain until all apps are migrated.
- Facade extraction can accidentally duplicate side effects such as polling, active order refresh, geolocation watches, and WebSocket connections.
- Backend event foundations must not double-trigger notifications or replace existing signals prematurely.

## Build And Test Commands

Backend:

```bash
cd backend
python manage.py check --settings=backend.config.local_sqlite
python manage.py test --settings=backend.config.local_sqlite
```

Frontend:

```bash
cd frontend
npx ng build customer-app
npx ng build vendor-app
npx ng build delivery-app
npx ng build admin-panel
npx ng lint customer-app
npx ng lint vendor-app
npx ng lint delivery-app
npx ng lint admin-panel
npx ng test customer-app
npx ng test vendor-app
npx ng test delivery-app
npx ng test admin-panel
```

## Baseline Validation Results

- `cd backend && python manage.py check --settings=backend.config.local_sqlite`
  - Failed with system Python: `ModuleNotFoundError: No module named 'django'`.
  - Environment issue only; the project virtualenv exists at `../venv/Scripts/python.exe`.
- `cd backend && ..\venv\Scripts\python.exe manage.py check --settings=backend.config.local_sqlite`
  - Passed: `System check identified no issues (1 silenced).`
- `cd frontend && npx.cmd ng build customer-app`
  - Passed.
- `cd frontend && npx.cmd ng build vendor-app`
  - Passed.
- `cd frontend && npx.cmd ng build delivery-app`
  - Passed.
- `cd frontend && npx.cmd ng build admin-panel`
  - Passed.

## Incremental Validation Results

After Phase 1-3 changes:

- `cd frontend && npx.cmd ng build customer-app`
  - Passed.
- `cd frontend && npx.cmd ng build vendor-app`
  - Passed.
- `cd frontend && npx.cmd ng build admin-panel`
  - Passed.
- `cd frontend && npx.cmd ng build delivery-app`
  - Passed.

After Phase 4 session-store contract additions:

- `cd frontend && npx.cmd ng build customer-app`
  - Passed.
- `cd frontend && npx.cmd ng build vendor-app`
  - Passed.
- `cd frontend && npx.cmd ng build delivery-app`
  - Passed.
- `cd frontend && npx.cmd ng build admin-panel`
  - Passed.

After Phase 5 API foundation additions:

- `cd frontend && npx.cmd ng build customer-app`
  - Passed.
- `cd frontend && npx.cmd ng build vendor-app`
  - Passed.
- `cd frontend && npx.cmd ng build delivery-app`
  - Passed.
- `cd frontend && npx.cmd ng build admin-panel`
  - Passed.

After Phase 10 navigation config extraction:

- `cd frontend && npx.cmd ng build customer-app`
  - Passed.
- `cd frontend && npx.cmd ng build vendor-app`
  - Passed.
- `cd frontend && npx.cmd ng build delivery-app`
  - Passed.
- `cd frontend && npx.cmd ng build admin-panel`
  - Passed.

After Phase 7 vendor/delivery/admin startup extraction:

- `cd frontend && npx.cmd ng build vendor-app`
  - Passed.
- `cd frontend && npx.cmd ng build delivery-app`
  - Passed.
- `cd frontend && npx.cmd ng build admin-panel --configuration production`
  - Passed.
- `cd frontend && npx.cmd ng build customer-app --configuration production`
  - Passed after invoice API split; warning: initial bundle exceeded the 650 kB budget by 51.24 kB.
- `cd backend && ..\venv\Scripts\python.exe manage.py check --settings=backend.config.local_sqlite`
  - Passed.

## Open Issues

- Confirm whether existing in-progress frontend/backend changes are user-authored or previous automation output before deleting or reverting anything.
- Customer `/location` now loads the existing location page.
- Customer `/notifications` now redirects to account; visible customer notification navigation was removed from the mobile topbar and account quick links.
- `buildWebSocketUrl` now exposes the requested `buildWebSocketUrl(path, apiBaseUrl?)` contract.
- Vendor and delivery route helpers still apply page-feature guards to optional pages only; this appears consistent, but route fail modes need explicit confirmation.
- `ApiService` still contains direct mixed-domain methods and needs reduction to a compatibility wrapper.
- Customer `AppStateService` still owns many responsibilities and needs further compatibility delegation to facades.
- Vendor `order-detail.component.ts` and delivery `active-delivery.component.ts` are still large and partially own map/WebSocket/workflow behavior.
- Backend durable domain events are not yet implemented.
- Backend dispatch/search hardening is not yet implemented.

## Phase 4 Auth/Session Notes

- Customer legacy `projects/customer-app/src/app/core/auth.interceptor.ts` is deleted in the current frontend working tree.
- All apps use the shared `authInterceptor` from `@shared`.
- `SessionStore` exists as the shared token/user persistence abstraction.
- Added explicit `getRefreshToken`, `setRefreshToken`, `getCurrentUser`, `setCurrentUser`, `clearCurrentUser`, and `getRole` methods to `SessionStore`.
- `AuthService` now uses `SessionStore` refresh-token methods instead of touching the refresh token key directly.
- Existing cookie-refresh behavior is preserved; refresh tokens are not forced into production storage if the backend does not return them.

## Phase 5 API Client Split Notes

- Shared API client files currently exist:
  - `api-core.service.ts`
  - `api-types.ts`
  - `api-error.ts`
  - `auth-api.service.ts`
  - `customer-api.service.ts`
  - `vendor-api.service.ts`
  - `delivery-api.service.ts`
  - `admin-api.service.ts`
  - `notification-api.service.ts`
  - `feature-config-api.service.ts`
  - `invoice-api.service.ts`
  - `file-api.service.ts`
- `ApiService` is now marked as a deprecated compatibility wrapper.
- Shared `AuthService` now uses `AuthApi` instead of the legacy compatibility `ApiService`.
- Customer order invoice generation/download now uses `InvoiceApi` instead of delegating through `ApiService`.
- The split is still partial: several role/domain clients currently extend or delegate to `ApiService` instead of owning fully separated method groups.
- Full migration away from `ApiService` remains pending.

## Phase 6 Customer Facade Notes

- Customer facade files currently exist under `projects/customer-app/src/app/services/facades`.
- These facades are compatibility facades over `AppStateService` in the current working tree.
- Full extraction of cart/location/checkout/order ownership out of `AppStateService` remains pending.

## Phase 7 Startup/Shell Notes

- Customer already has `CustomerAppStartupService`.
- Added `VendorAppStartupService` to own vendor notification polling, vendor currency bootstrap, and feature-config startup.
- Added `DeliveryAppStartupService` to own delivery notification polling, feature-config startup, and splash hiding.
- Added `AdminAppStartupService` to own admin notification polling and unread-count startup.
- Vendor, delivery, and admin root components now call startup services instead of owning those startup side effects directly.
- Root components still own shell route state, dropdown UI, breadcrumbs, and some notification panel loading.

## Phase 10 Navigation Config Notes

- Added app-specific navigation config files:
  - `customer-app/src/app/config/customer-navigation.ts`
  - `vendor-app/src/app/config/vendor-navigation.ts`
  - `delivery-app/src/app/config/delivery-navigation.ts`
  - `admin-panel/src/app/config/admin-navigation.ts`
- Customer mobile bottom nav uses `CUSTOMER_MOBILE_NAV_ITEMS`.
- Vendor shell uses `VENDOR_NAV_GROUPS` and `VENDOR_MOBILE_NAV_ITEMS`.
- Delivery shell uses `DELIVERY_NAV_ITEMS` for sidebar and bottom nav.
- Admin shell uses `ADMIN_QUICK_LINKS`, `ADMIN_BASE_NAV_SECTIONS`, and `ADMIN_GOVERN_NAV_ITEMS`.
- Feature config still filters visible optional nav entries where the shell supported it before.

## Phase 1 Customer Route Cleanup Notes

Customer core routes kept:

- `/`
- `/location`
- `/explore`
- `/explore/:categoryId`
- `/store/:id`
- `/product/:id`
- `/cart`
- `/checkout`
- `/orders`
- `/order-confirmed/:id`
- `/tracking/:id`
- `/completed-order/:id`
- `/order-finished/:id`
- `/account`
- `/addresses`

Customer compatibility redirects:

- `/profile` -> `/account`
- `/categories` -> `/explore`
- `/stores` -> `/explore`
- `/search` -> `/explore`
- `/wishlist` -> `/account`
- `/favorites` -> `/account`
- `/wallet` -> `/account`
- `/payments` -> `/account`
- `/offers` -> `/explore`
- `/referral` -> `/account`
- `/help` -> `/account`
- `/issues` -> `/account`
- `/my-issues` -> `/account`
- `/notifications` -> `/account`
- `/order/:id/issue` -> `/account`
- `/issue/:issueId` -> `/account`

Visible customer navigation updates:

- Mobile topbar notification action removed.
- Account quick link to notifications removed.
- Desktop account menu now links to `/account` instead of `/profile`.
- Sidebar account visibility uses `/account`.
- Bottom nav account feature route uses `/account`.
- Home/navigation helpers normalize removed routes to `/explore` or `/account`.

## Phase 2 Feature Config Notes

- Auth routes for vendor and delivery are not gated by remote page-feature config.
- `pageFeatureGuard(appId, pageId, { failMode, critical })` already supports explicit fail modes and critical route bypass.
- `PageFeatureAccessService` tracks `idle/loading/ready/error`.
- `startPolling(appId)` now represents actual polling behavior in the current working tree.
- Added explicit `stop(appId)` cleanup alias that delegates to `stopPolling(appId)`.

## Phase 3 WebSocket Notes

- `buildWebSocketUrl(path, apiBaseUrl?)` now matches the target contract.
- `openAuthenticatedWebSocket(path, token, apiBaseUrl?)` remains stable for callers.
- Vendor order detail and live operations sockets now pass clean `/ws/...` paths plus `environment.apiBaseUrl`.
- Delivery active workflow already passed a clean `/ws/...` path plus `API_BASE_URL`.
- Admin dashboard, orders, order detail, and issues sockets now pass clean `/ws/...` paths plus `API_BASE_URL`.
- Hardcoded `/sa/ws/...` socket paths were removed from updated admin call sites.

## Completed Checklist Items

- [x] Confirmed backend/frontend are Git submodules.
- [x] Audited required Phase 0 files.
- [x] Created architecture migration checklist document.
- [x] Recorded backend baseline check.
- [x] Recorded frontend baseline builds.
- [x] Customer route cleanup completed and validated.
- [x] Feature config route policy completed and validated.
- [x] WebSocket URL architecture completed and validated.
- [x] Auth/session centralization completed and validated.
- [ ] Role/domain API client split completed and validated. Partial compatibility wrappers exist.
- [ ] Customer facade split completed and validated. Partial compatibility facades exist.
- [x] Root shell/startup refactor completed and validated. Customer/vendor/delivery/admin startup services exist.
- [ ] Vendor workflow refactor completed and validated.
- [ ] Delivery workflow refactor completed and validated.
- [x] Navigation config centralized.
- [ ] Backend internal boundaries hardened.
- [ ] Durable domain events added.
- [ ] Dispatch/search foundations hardened.
- [ ] Final validation completed.
