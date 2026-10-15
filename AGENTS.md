# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Nextou is a multi-vendor delivery platform with a Django REST API backend and an Angular 19 monorepo frontend containing four standalone apps. Backend and frontend are separate Git submodules — always commit and push each submodule individually before bumping the parent repo.

## Commands

### Backend (Django)

```bash
cd backend
source ../venv/Scripts/activate        # Linux/Mac: ../venv/bin/activate
python manage.py runserver             # http://localhost:8000/api/
python manage.py migrate
python manage.py makemigrations [app]
python manage.py createsuperuser

# Smoke check — Windows-safe settings stub rq/django_rq fork usage
python manage.py check --settings=backend.config.local_sqlite

# RQ worker (required for delivery assignment tasks)
python manage.py rqworker default

# RQ scheduler (required for recurring/deferred tasks e.g. payout generation)
python manage.py rqscheduler
```

### Docker (local full-stack)

```bash
# Spin up everything: backend, worker, scheduler, redis, postgres, all angular apps
docker-compose up --build

# Backend only (with deps)
docker-compose up backend worker scheduler redis db
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

### Mobile (Capacitor — inside `frontend/mobile-apps/`)

```bash
# Validate Angular mobile builds
cd frontend
npm run mobile:customer:build
npm run mobile:delivery:build

# Sync/open native wrappers
npm run mobile:customer:sync
npm run mobile:delivery:sync
npm run mobile:customer:open:android
npm run mobile:delivery:open:android

# App IDs: com.nextou.customer and com.nextou.delivery
```

## Architecture

### Backend

Eight Django apps under `backend/`:

| App | Responsibility |
|---|---|
| `accounts` | Custom User model (roles: customer/vendor/delivery/admin), addresses, JWT auth |
| `products` | Categories (with subcategory support), products, reviews |
| `orders` | Cart, order placement, order tracking, coupons |
| `vendors` | Vendor profiles, store management, vendor dashboard |
| `delivery` | Delivery partner profiles, assignment search, location tracking, assets, payouts |
| `notifications` | In-app notifications (order/delivery/promo/system types) |
| `support` | Customer support tickets and issue messaging (WebSocket-backed) |
| `invoices` | PDF invoice generation for customer receipts, vendor settlements, delivery payouts |

Admin-specific endpoints live in `backend/backend/admin_urls.py`, mounted at `/api/admin/`.

**Infrastructure dependencies:** Redis is required for both RQ (background jobs) and Django Channels (WebSockets). Configured via `REDIS_HOST`/`REDIS_PORT` env vars (default: `localhost:6379`).

**Database:** PostgreSQL by default (`DB_ENGINE`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT` env vars). Override `DB_ENGINE=django.db.backends.sqlite3` and `DB_NAME=db.sqlite3` locally if desired.

#### Layered pattern — always follow this structure

Every app uses the same three-layer pattern. Never put business logic in views.

- **`views/`** — HTTP only: parse request, call action or repo, return Response.
- **`actions/`** — all business logic. Each action has a single `execute()` method. Import actions via the app's `actions/__init__.py`.
- **`data/` (repositories)** — all ORM queries. Views/actions never call `Model.objects` directly; they go through a repository class that inherits `BaseRepository` (defined in `vendors/data/base.py`). `BaseRepository` provides `get_by_id`, `create`, `filter`, `all` with optional `select_related`/`prefetch_related`.

#### Shared helpers (`backend/helpers/`)

Top-level package for cross-app utilities — import from here:

- `helpers.geo_helpers.haversine` — Haversine distance between two lat/lng points
- `helpers.request_helpers.get_client_ip` — extract real IP from request
- `helpers.validators` — shared validation helpers
- `helpers.view_helpers.BaseDetailView` — `get_object_or_none(model, **kwargs)` mixin for DRF views

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
`order_placed`, `order_cancelled`, `order_status_updated`, `vendor_approved`, `vendor_rejected`, `issue_created`, `issue_updated`, `issue_message_added`, `support_ticket_created`, `support_ticket_updated`.

#### WebSocket consumers

Mounted in `backend/backend/asgi.py`:
- `ws/delivery/<order_id>/tracking/` — live driver location (vendor, customer, partner, admin can connect)
- `ws/issues/<issue_id>/` — support chat
- `ws/admin/stats/` — admin dashboard live stats

All require `?token=<access_token>` query param for auth.

#### Local smoke settings

On Windows, `rq` fails to start because it requires `fork` (unavailable). Use `--settings=backend.config.local_sqlite` for Django smoke checks; it stubs `rq`/`django_rq`, uses SQLite, and keeps bytecode/test artifacts out of the repository.

### Backend API Endpoints

| Prefix | Notes |
|---|---|
| `GET /health/` | Health check — returns `{"status": "ok"}` |
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
| `/api/notifications/` | `IsAuthenticated` |
| `/api/support/` | `IsAuthenticated` |
| `/api/invoices/` | `IsAuthenticated` |
| `/api/admin/*` | `IsAdminRole` throughout |
| `/api/admin/scheduled-tasks/` | Manage RQ scheduled jobs (list, create, cancel) |
| `GET /api/schema/` | OpenAPI schema (drf-spectacular) |
| `GET /api/docs/` | Swagger UI |
| `GET /api/redoc/` | ReDoc UI |

**IDs:** All primary keys are UUIDs. URL patterns use `<uuid:pk>` throughout.  
**Default pagination:** 20 items/page.  
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
| API Docs (Swagger) | `http://localhost:8000/api/docs/` |
| Production | `https://nex-connect.in/sa/api/` (reverse-proxied with `/sa/` prefix) |


<!-- BEGIN AWS Agent Toolkit rules -->
## AWS Agent Toolkit

Configured AWS profile: `nexconnect-prod`.
AWS project: Nikhil Pradeep (`622308589716`).
Saved help_level: MEDIUM.
Selected project Region: Mumbai (`ap-south-1`). Agent Toolkit endpoint Region: `us-east-1`.

# AWS Guidance for the new AWS experience

This user has signed up for the new AWS experience. This experience lets you sign into AWS using a social provider and requires the following additional context.

Where this guidance conflicts with the project's own instructions, the project's instructions take precedence.

## Context

### Terminology:

- Say "project" instead of "account" — a project contains an AWS account and settings for sharing with other collaborators
- Say "team member" instead of "IAM user" — users are invited by email, not created or federated in IAM
- Say "AWS Settings" when referring to management tasks at [settings.aws.com](https://settings.aws.com/) (project management, billing, team members, spend limits). Users view their actual AWS resources in the AWS Management Console.
- Say "selected Region" when referring to the user's Region — not "home Region"
- The user has a managed IAM experience. This includes a managed service control policies (SCP) and resource control policies (RCP) that govern the use of AWS. They will still need to use IAM to create policies to let services work with each other. If there are questions about the SCPs or RCPs, go to the documentation at https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html

### Constraints:

- All projects share a single AWS Region determined by the user's contact address. Resources cannot be created in other Regions
- When developing:
  - MUST create all Regional resources in the project's assigned Region
  - You CAN create AWS WAF and Cloudwatch Logs resources in us-east-1 when there are global resources (like a global WAF instance) that require a connection to dependencies in us-east-1. You should not use these for any other reason, because resources in the selected Region will provide lower cost (due to no cross-Region traffic), increased availability (due to no cross-Region traffic), and easier manageability (due to not needing to look in another Region). When you need to do an inventory of resources, you need to look in both the selected Region and us-east-1 for Cloudwatch Logs or WAF resources.
  - MUST NOT attempt to create Lambda, API Gateway, or other Regional resources in any other Region
  - MUST direct users to confirm their Region in AWS Settings > View all projects > Overview > Additional Info > Region. If the user cannot confirm their Region, check in ~/.aws/config
  - MUST NOT use Lambda@Edge — excluded from both Lambda and CloudFront
  - MUST NOT use CloudFormation StackSets — no multi-account or multi-Region deployments
  - MUST NOT attempt cross-Region actions — no cross-Region replication for DynamoDB/S3/RDS, no multi-Region KMS keys
  - MUST NOT use Route 53 cross-Region routing — geolocation, latency-based, and failover routing policies are not available
  - CloudFront is a global service and its actions ARE allowed in `us-east-1`. A user can create a CloudFront distribution pointing to their project-region Lambda function URL or API Gateway. However, Lambda and API Gateway themselves MUST NOT be created in `us-east-1` — they must be in the project Region.
  - Reduced availability in `eu-north-1` specifically: Amazon Rekognition, Amazon Textract, Amazon Personalize, AWS App Runner are not available in that Region.
- IAM permissions for human access are managed by AWS. Don't assign roles to team members unless absolutely necessary
- The user may have a spend limit if they are on the paid plan. The limit that pauses their project if it's exceeded. If resources suddenly become inaccessible, ask if they have a spend limit configured. Only project owners can modify a spend limit.
- When developing:
  - MUST ask about spend limit status if the user reports sudden "Access Denied" errors on operations that previously worked
  - MUST direct users to check spend status in AWS Settings > Billing
  - MUST check if a user has upgraded their account to the paid plan
  - MUST ask the user if they want to clean up the successfully created resources or keep them to reduce cost
- The user sets up billing, creates spend limits, and retrieves and pays invoices in AWS Settings. The user creates budgets and optimizes their costs in the AWS Billing and Cost Management console
- Not all AWS services are available. If a service isn't working, do the following:
  1. Run the command `aws freetier get-account-plan-state`
  2. If accountPlanType": "FREE", check the [Free Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-free-tier) next,
  3. If accountPlanType": "PAID", check the [Paid Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-paid-plan).
  4. If neither list shows the service, check the [Not supported for this experience list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#unsupported-services). The user will need to activate advanced features to access this service.
- Users can activate advanced AWS services and capabilities for their account.
- Before starting a task, check whether a relevant AWS skill is available. Load the skill with retrieve_skill and prefer its guidance over general knowledge.

### Help level

- help_level (required): LOW, MEDIUM, or HIGH. While a user is building, you MUST ask the user: "How much guidance would you like from me? Low (I only flag security risks), medium (I ask a couple of clarifying questions if something seems off), or high (I explain what I'm doing, suggest alternatives, and flag best practices)."

You CAN update this rule file to save a user's help_level.

Constraints for each level:

**LOW:**

- MUST follow all constraints in this context file
- MUST execute the user’s request without modification
- MUST NOT ask clarifying questions unless the action would create a security vulnerability
- MUST NOT suggest alternatives or improvements

**MEDIUM:**

- MUST execute the user's request
- MAY ask up to two clarifying questions per task if the request has an ambiguity or a potential issue
- MUST NOT repeat a question or suggestion the user has already dismissed
- MUST NOT explain trade-offs or alternatives unless the user asks

**HIGH:**

- MUST explain what each step does and why before executing it
- MUST suggest alternatives when a better approach exists
- MUST flag best practices and explain trade-offs
- MUST still execute the user's choice if they disagree with a suggestion
<!-- END AWS Agent Toolkit rules -->
