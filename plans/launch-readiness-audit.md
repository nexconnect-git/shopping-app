# NexConnect Launch Readiness Audit

Date: 2026-05-12

## Executive Summary

NexConnect has the major product surfaces in place: Django REST APIs, admin/vendor/customer/delivery Angular apps, an Expo customer mobile app, payments, payouts, delivery assignment, notifications, support, and operational admin pages. The largest launch risks are not missing skeletons; they are hardening gaps and a few concrete broken paths.

Top priorities:

1. Rotate leaked Razorpay/live secrets and remove `.env` from source control.
2. Fix mobile WebSocket authentication, which currently does not match the backend protocol.
3. Fix vendor availability serialization, which is breaking product catalog tests and likely affected endpoints.
4. Add upload validation for support attachments, catalog/product images, delivery photos, vendor documents, avatars, and banners.
5. Tighten admin permissions for payout, scheduled task, notification, and account-management operations.
6. Shorten refresh-token lifetime and align web/mobile refresh-token storage with production risk.

## P0 Security And Launch Blockers

### 1. Committed Live-Looking Payment Secrets

Evidence:

- `.env:26-28` contains a live-looking Razorpay key id, key secret, and webhook secret.
- `.env:2-4` also contains a Django secret key, `DEBUG=True`, and `ALLOWED_HOSTS=*`.

Risk:

- Anyone with repository access can abuse payment credentials or replay/forge environment assumptions.
- Even if these are already invalidated, the repository history remains sensitive.

Fix:

- Immediately rotate Razorpay key secret and webhook secret.
- Remove `.env` from tracking and keep only `.env.example` / `.env.prod.example`.
- Add a pre-commit or CI secret scan.
- Confirm production uses rotated secrets from a secret manager, not repo files.

### 2. Mobile Realtime Auth Is Broken

Evidence:

- Backend WebSocket middleware only accepts JWTs via `Sec-WebSocket-Protocol` as `[nexconnect.jwt, token]` in `backend/backend/middleware.py:23-43`.
- Angular uses that exact subprotocol flow in `frontend/projects/shared/src/lib/services/websocket-auth.ts:1-9`.
- Expo mobile sends `?token=...` in the URL in `shopping-mobile-app/mobile-customer/src/lib/realtime.ts:3-8`.

Risk:

- Customer mobile tracking/support sockets will be rejected as anonymous, so live order tracking and issue chat can silently fail on mobile.

Fix:

- Prefer updating mobile `openAuthedSocket` to use `new WebSocket(url, ['nexconnect.jwt', token])`.
- Alternatively add explicit query-token support to backend middleware, but subprotocol is cleaner because it avoids token leakage in access logs.

### 3. Vendor Availability Can Crash Product Serialization

Evidence:

- Backend tests fail when `helpers/vendor_hours.py:22-30` compares string `opening_time` / `closing_time` values against `datetime.time`.
- Failure path observed through `products/views/catalog_views.py:216-220` when serializing created vendor variants.

Risk:

- Vendor catalog/product endpoints can return 500 when test/setup data or serializer input leaves hours as strings.
- Current backend verification failed: 60 tests found, 3 errors.

Fix:

- Normalize `opening_time` and `closing_time` inside `get_vendor_availability` or enforce time conversion earlier in serializers/actions.
- Add regression tests for string, `datetime.time`, overnight hours, equal open/close, and missing hours.

## P1 Security / Production Hardening

### 4. File Uploads Need Central Validation

Evidence:

- Support issue attachments accept any uploaded file and persist client content type in `backend/orders/views/issue_views.py:88-97`.
- Delivery proof photos are assigned directly in `backend/delivery/views/assignment_views.py:56-63` and `backend/delivery/actions/delivery_actions.py:99-112`.
- Catalog image upload accepts `request.FILES["image"]` directly in `backend/products/views/catalog_views.py:127-144`.
- File/Image fields exist for order issue attachments, delivery photos, transaction photos, product/catalog/category images, vendor logo/banner/docs, delivery ID proof, and user avatars.

Risk:

- Users/admins can upload oversized files, unexpected formats, active content, or mislabeled files. Local media serving and future S3 hosting make this a persistent security and cost risk.

Fix:

- Add shared validators for max size, allowed extension, MIME type, image decoding, and filename normalization.
- Apply them in serializers/actions before assigning files.
- Keep vendor documents in private storage if they contain KYC/identity material.

### 5. Admin Role Is Too Broad For Money And Operations

Evidence:

- `HasAdminPermission` exists in `backend/accounts/permissions.py:28-47`.
- Many high-impact views still use only `IsAdminRole`, including admin user management in `backend/accounts/views/admin_views.py:11-13`, scheduled tasks in `backend/backend/scheduled_tasks_views.py:109-247`, and vendor payout actions in `backend/vendors/views/admin_payouts.py:21-146`.
- Superuser-only frontend route exists for admin users in `frontend/projects/admin-panel/src/app/app.routes.ts:43`, but backend admin user APIs are not superuser-only.

Risk:

- Any admin account can create/update admin users, mark payouts paid/verified, enqueue scheduled tasks, and send notifications.

Fix:

- Use `HasAdminPermission` or `IsSuperUser` consistently for money movement, account management, scheduled jobs, bulk notifications, and production settings.
- Define permission constants such as `manage_admins`, `manage_payouts`, `manage_operations`, `send_notifications`, and `manage_catalog`.
- Make frontend route guards match backend authorization, but do not rely on frontend guards for enforcement.

### 6. Refresh Token Lifetime Is Excessive

Evidence:

- `backend/backend/settings.py` sets `REFRESH_TOKEN_LIFETIME = timedelta(days=3650)`.
- Web stores access tokens in `sessionStorage` in `frontend/projects/shared/src/lib/services/auth.service.ts:26-49`.
- Mobile stores refresh tokens in SecureStore natively, but falls back to AsyncStorage on web in `shopping-mobile-app/mobile-customer/src/lib/api.ts:217-226`.

Risk:

- Stolen refresh tokens remain useful for years unless blacklisted. XSS or compromised devices become long-lived account compromise.

Fix:

- Reduce refresh lifetime to 7-30 days, with rotation and blacklist retained.
- Add server-side session/device inventory and revoke-all-sessions.
- Keep access tokens memory/session scoped and prefer HttpOnly cookie refresh on web.

### 7. Dev Infrastructure Exposes Sensitive Services

Evidence:

- `docker-compose.yml` runs `DEBUG=True`, `CORS_ALLOW_ALL_ORIGINS=True`, and default DB password `admin`.
- It publishes Redis `6379`, Postgres `5432`, and redis-commander `8081`.

Risk:

- This is acceptable for local development but dangerous if reused on a public VM.

Fix:

- Add a hard warning to the compose file or split `docker-compose.dev.yml`.
- Ensure production compose does not expose Redis/Postgres publicly.
- Put redis-commander behind an explicit debug profile.

## Functional Flaws And Missing Pages

### Admin

- Add an explicit security/permissions page that manages fine-grained admin permissions, since backend RBAC already exists but most operational routes use broad admin access.
- Add payout approval queues with dual-control states: scheduled, payment sent, verified, rejected/disputed, and audit detail.
- Add upload/media moderation page for vendor documents, catalog images, product images, delivery proof photos, and support attachments.
- Add operational health page that checks Redis, RQ worker, scheduler, DB, S3/media, FCM, Razorpay config, and WebSocket connectivity.
- Keep the existing production-readiness page, but wire it to real backend checks rather than static guidance if it is not already.

### Vendor

- Add dedicated vendor document/KYC upload and status pages if admin onboarding is not the only supported flow.
- Add delivery-search incident states: no driver found, cancelled by partner, reassigned, timed out, and retry history.
- Add inventory health and low-stock alert views as first-class workflows rather than product-page side paths.
- Add support issue detail/chat parity if vendor support is meant to be operational, not just informational.

### Customer Web

- Implement real forgot/reset password pages. Current routes redirect to login in `frontend/projects/customer-app/src/app/app.routes.ts:24-33`, while backend endpoints exist in `backend/accounts/urls.py:22-23`.
- Add email/mobile verification prompts after registration/login, since verification endpoints exist but the user journey is not obvious from routes.
- Add refund/return status pages connected to issue/refund ledger states.
- Add order invoice/download affordances if invoices are customer-visible.

### Delivery Web / Mobile

- There is no separate `mobile-delivery` app under `shopping-mobile-app`; only `mobile-customer` exists.
- The Angular delivery app has only login, change password, dashboard, available, active, history, earnings, and profile routes in `frontend/projects/delivery-app/src/app/app.routes.ts:6-15`.
- Add delivery partner mobile app or PWA-ready delivery flow before launch if drivers are expected to work primarily from phones.
- Add proof upload preview, pickup OTP workflow, navigation handoff, offline retry for location updates, and failed-delivery reporting.

### Customer Mobile

- Fix realtime auth as P0.
- Add secure session/device revocation UI once backend supports it.
- Confirm password-reset and verification screens are wired to backend endpoints and error states.
- Add deep-link handling for order, issue, and offer notification targets.

## Refactor And Code Health

- Move remaining direct `Model.objects` calls out of views/actions into repositories where practical, especially in admin/payment/catalog/support paths. The codebase has a repository rule, but many views still query models directly.
- Remove imports inside functions where present, such as payment webhook order imports and wallet action imports.
- Centralize money-state transitions for payouts, refunds, wallet debits/credits, and order payment verification into actions with idempotency guards.
- Normalize WebSocket auth into one shared frontend/mobile helper and one backend middleware contract.
- Consolidate duplicate notification, support issue, and order tracking presentation logic across customer web/mobile/admin.
- Add typed API contracts generated from OpenAPI, or at least shared TypeScript models kept in sync with serializers.

## Verification Results

Commands run:

- `npm.cmd run typecheck` in `shopping-mobile-app/mobile-customer`: passed.
- `npx.cmd tsc -p tsconfig.json --noEmit` in `frontend`: passed.
- `npm.cmd audit --omit=dev` in `frontend`: passed, 0 vulnerabilities.
- Backend targeted tests with `--settings=backend.test_settings`: failed with 3 product catalog errors caused by `helpers/vendor_hours.py` comparing strings to `datetime.time`.

Backend test command needed explicit environment values:

```powershell
$env:DEBUG='True'; $env:SECRET_KEY='test-secret-key'; ..\venv\Scripts\python.exe manage.py test vendors.tests products.tests orders.tests_order_quotes delivery.tests --settings=backend.test_settings
```

## Recommended Fix Order

1. Rotate/remove secrets and add secret scanning.
2. Fix mobile WebSocket auth and add a smoke test for tracking/support socket connection.
3. Fix vendor hours normalization and rerun backend tests.
4. Add upload validation and private handling for KYC/support files.
5. Apply fine-grained admin permissions to payout, scheduled task, notification, and admin-user APIs.
6. Reduce refresh-token lifetime and add session revocation.
7. Build missing password-reset pages, delivery mobile/PWA flow, admin permissions UI, upload moderation, and operational health checks.
