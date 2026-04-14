# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NexConnect is a multi-vendor delivery platform with a Django REST API backend and an Angular 19 monorepo frontend containing four standalone apps. Backend and frontend are separate Git submodules — always commit and push each submodule individually before bumping the parent repo.

## Commands

### Backend (Django)

```bash
cd backend
source ../venv/Scripts/activate        # Linux/Mac: ../venv/bin/activate
python manage.py runserver             # http://localhost:8000/api/
python manage.py migrate
python manage.py makemigrations [app]
python manage.py createsuperuser

# Tests — must use test_settings on Windows (stubs rq/daphne which won't fork)
python manage.py test vendors.tests --settings=backend.test_settings
python manage.py test [app].tests --settings=backend.test_settings

# RQ worker (required for delivery assignment tasks)
python manage.py rqworker default
```

### Frontend (Angular 19 monorepo)

```bash
cd frontend
npm install

npx ng serve customer-app          # http://localhost:4200
npx ng serve vendor-app            # http://localhost:4201
npx ng serve delivery-app          # http://localhost:4202
npx ng serve admin-panel           # http://localhost:4203

npx ng build [app-name] --configuration production
npx ng test [app-name]
npx ng lint [app-name]
npx ng generate component pages/my-page --project=customer-app
```

### Mobile (Capacitor — inside `shopping-mobile-app/`)

```bash
# Build the Angular app first (outputs to frontend/dist/)
cd frontend && npx ng build customer-app --configuration production

# Then sync and open Android Studio
cd ../shopping-mobile-app/mobile-customer
npx cap sync android
npx cap open android

# Delivery app uses mobile-delivery/ with appId com.nexconnect.delivery
```

## Architecture

### Backend

Six Django apps under `backend/`:

| App | Responsibility |
|---|---|
| `accounts` | Custom User model (roles: customer/vendor/delivery/admin), addresses, JWT auth |
| `products` | Categories (with subcategory support), products, reviews |
| `orders` | Cart, order placement, order tracking |
| `vendors` | Vendor profiles, store management, vendor dashboard |
| `delivery` | Delivery partner profiles, assignment search, location tracking |
| `notifications` | In-app notifications (order/delivery/promo/system types) |

Admin-specific endpoints live in `backend/backend/admin_urls.py`, mounted at `/api/admin/`.

**Infrastructure dependencies:** Redis is required for both RQ (background jobs) and Django Channels (WebSockets). Configured via `REDIS_HOST`/`REDIS_PORT` env vars (default: `localhost:6379`).

#### Layered pattern — always follow this structure

Every app uses the same three-layer pattern. Never put business logic in views.

- **`views/`** — HTTP only: parse request, call action or repo, return Response.
- **`actions/`** — all business logic. Each action has a single `execute()` method. Import actions via the app's `actions/__init__.py`.
- **`data/` (repositories)** — all ORM queries. Views/actions never call `Model.objects` directly; they go through a repository class that inherits `BaseRepository`.

#### Import rules

- **Always use absolute imports** — e.g. `from vendors.actions.base import BaseAction`, never `from .base import BaseAction`.
- **All imports at the top of the file** — never inside functions or methods.

#### Auth & permissions

JWT via SimpleJWT. Access token: 1 day, refresh: 7 days with rotation.

Permission classes (all in `accounts/permissions.py`):
- `IsAdminRole` — `user.role == 'admin'`
- `IsVendor` — user has a `vendor_profile` (any approval status)
- `IsApprovedVendor` — `vendor_profile.status == 'approved'`; used on all vendor dashboard/products/orders endpoints. `VendorProfileView` deliberately uses the weaker `IsVendor` so pending vendors can check their own status.
- Delivery partner views use only `IsAuthenticated` — no separate permission class.

#### Delivery assignment flow

Vendor-initiated — search does NOT auto-trigger on order placement or status change:

1. Vendor marks order `ready` (no search started).
2. Vendor explicitly calls `POST /api/vendors/orders/<pk>/start-delivery-search/` → `StartDeliverySearchAction` → enqueues `search_and_notify_partners` RQ job.
3. Job searches by Haversine distance starting at 2 km, expanding by 2 km per round, max 20 km. Notified partners have 1 minute to accept.
4. Vendor can call `POST /api/vendors/orders/<pk>/cancel-delivery-search/` → `CancelDeliverySearchAction` → sets status `cancelled`, deletes partner notifications.
5. On timeout `check_assignment_timeout` fires, sets status `timed_out`, notifies vendor.
6. `_expand_and_retry` always calls `assignment.refresh_from_db()` after its 2-second sleep before re-queuing, to avoid overwriting a `cancelled`/`accepted` status.

`DeliveryAssignment` statuses: `searching` → `notified` → `accepted` | `timed_out` | `cancelled` | `failed`.

#### Custom signals (`backend/events.py`)

Cross-app communication uses Django signals defined in `backend/backend/events.py`:
`order_placed`, `order_cancelled`, `order_status_updated`, `vendor_approved`, `vendor_rejected`, `issue_created`, `issue_updated`.

#### WebSocket consumers

Mounted in `backend/backend/asgi.py`:
- `ws/delivery/<order_id>/tracking/` — live driver location (vendor, customer, partner, admin can connect)
- `ws/issues/<issue_id>/` — support chat
- `ws/admin/stats/` — admin dashboard live stats

All require `?token=<access_token>` query param for auth.

#### Test settings

On Windows, `rq` fails to start because it requires `fork` (unavailable). Use `--settings=backend.test_settings` which stubs `rq`/`django_rq` with `MagicMock` and uses `ROOT_URLCONF = backend.test_urls` (excludes invoices/admin_urls that need optional production packages).

When patching `search_and_notify_partners` in tests, the patch target is `vendors.actions.orders.search_and_notify_partners` (the bound top-level name), not `delivery.tasks.search_and_notify_partners`.

### Backend API Endpoints

| Prefix | Notes |
|---|---|
| `POST /api/auth/register/` | Public |
| `POST /api/auth/login/` | Public |
| `GET\|PATCH /api/auth/profile/` | Authenticated |
| `GET /api/vendors/` | Public list |
| `GET /api/vendors/<uuid>/` | Public detail |
| `GET /api/vendors/nearby/` | Public (lat/lng params) |
| `POST /api/vendors/register/` | Public; returns `{user, vendor, vendor_status, tokens}` |
| `GET\|PATCH /api/vendors/profile/` | `IsVendor` |
| `GET /api/vendors/dashboard/` | `IsApprovedVendor` |
| `/api/vendors/products/` | `IsApprovedVendor` (ViewSet) |
| `/api/vendors/orders/` | `IsApprovedVendor` |
| `POST /api/vendors/orders/<pk>/start-delivery-search/` | `IsApprovedVendor` |
| `POST /api/vendors/orders/<pk>/cancel-delivery-search/` | `IsApprovedVendor` |
| `/api/products/` | Public |
| `/api/orders/cart/` | `IsAuthenticated` |
| `/api/orders/` | `IsAuthenticated` |
| `/api/delivery/` | Mixed; `register/` returns 403 (disabled) |
| `/api/admin/*` | `IsAdminRole` throughout |

**IDs:** All primary keys are UUIDs. URL patterns use `<uuid:pk>` throughout.  
**Database:** SQLite (`db.sqlite3`). Default pagination: 20 items/page.  
**Filtering:** `DjangoFilterBackend`, `SearchFilter`, `OrderingFilter` configured globally — most list views expose `?search=`, `?ordering=`, and model-specific filter params.

### Frontend

Angular 19 monorepo under `frontend/projects/`:

```
projects/
  customer-app/    # End-customer shopping experience
  vendor-app/      # Vendor store management
  delivery-app/    # Delivery partner mobile-first UI
  admin-panel/     # Admin dashboard (dark theme)
  shared/          # Shared library (@shared/public-api)
```

All components are standalone (no NgModules). State is managed via Angular Signals. Each app has its own `app.routes.ts` and `app.config.ts`; the `authInterceptor` is registered identically in each.

#### Shared library (`projects/shared/src/lib/`)

- **`ApiService`** — all HTTP calls + reactive state (`cartCount` signal, `unreadNotifications` signal, `refreshCartCount()`). Add new API methods here, grouped by domain. Includes `startDeliverySearch(orderId)` and `cancelDeliverySearch(orderId)`.
- **`AuthService`** — auth state via Signals (`currentUser`, `isLoggedIn`, `login()`, `register()`, `logout()`). Tokens and user stored in `localStorage`.
- **Guards:** `authGuard`, `guestGuard`, `roleGuard(role)`, `approvedVendorGuard` (checks `localStorage.vendor_status`, falls back to API, redirects pending to `/pending-approval`).
- **`NotificationPollingService`** — polls every 60s, pauses when tab hidden, exponential backoff on errors.
- All TypeScript model interfaces live here (IDs are `string`/UUID).

#### Key flows

- **Vendor onboarding:** Register → logged in with `vendor_status` in localStorage → if `pending`, routed to `/pending-approval` (polls every 30s) → on approval auto-navigates to dashboard.
- **Delivery partner onboarding:** Admin-only via `POST /api/admin/delivery-partners/`. No self-registration.
- **Vendor delivery search UI** (order-detail): idle → "Find Driver" button; searching/notified → pulsing card + "Cancel" button; timed_out/failed → "Find Driver" retry. `assignment_status` field on `OrderSerializer` drives this.

### Design Tokens

- **customer-app / vendor-app:** Light theme, primary `#6C63FF` (purple), secondary `#FF6584`
- **delivery-app:** Green accent `#00C853`
- **admin-panel:** Dark theme, bg `#0F0F1A`/`#1A1A2E`, accent red `#E94560`, accent cyan `#06B6D4`

### Local URLs

| Service | URL |
|---|---|
| Backend API | `http://localhost:8000/api/` |
| Django Admin | `http://localhost:8000/admin/` |
| Production | `https://nex-connect.in/sa/api/` (reverse-proxied with `/sa/` prefix) |
