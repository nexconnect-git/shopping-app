# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NexConnect is a multi-vendor delivery platform with a Django REST API backend and an Angular 19 monorepo frontend containing four standalone apps.

## Commands

### Backend (Django)

```bash
cd backend
source ../venv/bin/activate        # Windows: ../venv/Scripts/activate
python manage.py runserver         # http://localhost:8000/api/
python manage.py migrate
python manage.py makemigrations [app]
python manage.py createsuperuser
python manage.py test [app]        # Run tests for a specific app
python manage.py test              # Run all tests
```

### Frontend (Angular 19 monorepo)

```bash
cd frontend
npm install

# Serve individual apps
npx ng serve customer-app          # http://localhost:4200
npx ng serve vendor-app            # http://localhost:4201
npx ng serve delivery-app          # http://localhost:4202
npx ng serve admin-panel           # http://localhost:4203

# Build
npx ng build [app-name] --configuration production

# Test
npx ng test [app-name]

# Lint
npx ng lint [app-name]

# Generate component inside an app
npx ng generate component pages/my-page --project=customer-app
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
| `delivery` | Delivery partner profiles, status updates, location tracking, asset management |
| `notifications` | In-app notifications (order/delivery/promo/system types) |

Admin-specific endpoints live in `backend/backend/admin_urls.py` and are mounted at `/api/admin/` separately from the per-app `urls.py` files.

**Auth:** JWT via SimpleJWT. Access token: 1 day, refresh: 7 days with rotation. All protected views use `IsAuthenticated` plus role-based custom permissions.

**Permission classes** (all in `accounts/permissions.py`):
- `IsAdminRole` — user.role == 'admin'
- `IsVendor` — user has a vendor_profile (any status)
- `IsApprovedVendor` — vendor_profile.status == 'approved'; used on dashboard/products/orders endpoints. `VendorProfileView` uses the weaker `IsVendor` so pending vendors can check their own status.

Delivery partner views use only `IsAuthenticated` — no separate `IsDeliveryPartner` class exists.

**IDs:** All primary keys are UUIDs. URL patterns use `<uuid:pk>` throughout.

**Database:** SQLite (`db.sqlite3`). Default pagination: 20 items per page (`PageNumberPagination`).

**Filtering:** `DjangoFilterBackend`, `SearchFilter`, and `OrderingFilter` are configured globally. Most list views expose `?search=`, `?ordering=`, and model-specific filter params.

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
| `/api/products/` | Public |
| `/api/orders/cart/` | `IsAuthenticated` |
| `/api/orders/` | `IsAuthenticated` |
| `/api/delivery/` | Mixed; `register/` returns 403 (disabled) |
| `/api/admin/*` | `IsAdminRole` throughout |

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

**All components are standalone** (no NgModules). State is managed via Angular Signals. Each app has its own `app.routes.ts` and `app.config.ts` (the interceptor is registered identically in each).

**Shared library** (`projects/shared/src/lib/`) exports:

- `ApiService` — all HTTP calls + reactive state (`cartCount` signal, `unreadNotifications` signal, `refreshCartCount()`). Methods are grouped: auth, vendors, products, orders, delivery, notifications, admin (customers/vendors/partners/categories/products/orders/assets).
- `AuthService` — auth state via Signals (`currentUser`, `isLoggedIn`, `login()`, `register()`, `logout()`)
- `authGuard` — redirects unauthenticated users to `/login`
- `guestGuard` — redirects already-authenticated users to `/`
- `roleGuard(role)` — parameterized; checks `localStorage.user.role`
- `approvedVendorGuard` — checks `localStorage.vendor_status`; falls back to `api.getVendorProfile()` if not cached; redirects pending vendors to `/pending-approval`
- `authInterceptor` — injects `Authorization: Bearer <token>` on every request
- All TypeScript model interfaces (IDs are `string` / UUID)

**Vendor onboarding flow:** Register → immediately logged in with `vendor_status` in localStorage → if `pending`, routed to `/pending-approval` page (polls every 30s) → on approval, auto-navigates to dashboard.

**Delivery partner onboarding:** Self-registration is disabled (returns 403). Admin creates partners via `POST /api/admin/delivery-partners/`. The delivery-app `/register` route does not exist.

### API Base URLs

| Service | URL |
|---|---|
| Backend API | `http://localhost:8000/api/` |
| Django Admin | `http://localhost:8000/admin/` |

### Design Tokens

- **customer-app / vendor-app:** Light theme, primary `#6C63FF` (purple), secondary `#FF6584`
- **delivery-app:** Green accent `#00C853`
- **admin-panel:** Dark theme, bg `#0F0F1A`/`#1A1A2E`, accent red `#E94560`, accent cyan `#06B6D4`
