# Production Go-Live Runbook

This runbook covers the remaining production-readiness work that cannot be
completed purely inside a local checkout. Run it against staging first, then
repeat the same gates against production before public traffic is enabled.

## Required Environments

- `staging`: production-like PostgreSQL, Redis, queue workers, scheduler,
  object storage, private media, CDN, WAF, and seeded non-real test accounts.
- `production`: same topology as staging with real secrets from the secret
  manager and no developer fallback settings.
- `load`: isolated k6/Locust runner network close enough to production to
  measure latency without saturating an engineer laptop.

## Infrastructure Checklist

- Frontend bundles served from CDN with immutable cache headers.
- Media stored in private object storage; access only through signed URLs or
  permission-checked backend views.
- HTTPS load balancer with WAF and edge rate limits.
- Backend app servers autoscaled separately from workers and scheduler.
- PostgreSQL primary plus read replicas for browse/search/reporting traffic.
- PgBouncer in transaction-pooling mode for Django app connections.
- Redis cache and Redis/RabbitMQ queue isolated by purpose where possible.
- Worker deployment for notifications, delivery search, email/SMS, invoices,
  reconciliation, and scheduled tasks.
- One-off migration job; app containers must not all run migrations at boot.
- Centralized JSON logs with request ID/correlation ID.
- Metrics and alerts for API latency, error rate, checkout failures, payment
  mismatches, queue lag, worker failures, database CPU, Redis memory, cache hit
  ratio, OTP spikes, and delivery tracking failures.
- Backup/restore drill completed and timed.

## Go/No-Go Gates

The release is a no-go if any item below fails:

- `python manage.py check --settings=backend.config.local_sqlite`
- `python manage.py makemigrations --check --dry-run --settings=backend.config.local_sqlite`
- `npm audit --audit-level=high`
- `npm run lint`
- `npx ng build customer-app --configuration production`
- `npx ng build vendor-app --configuration production`
- `npx ng build delivery-app --configuration production`
- `npx ng build admin-panel --configuration production`
- `npx ng test customer-app --watch=false --browsers=ChromeHeadlessNoSandbox --progress=false`
- `npx ng test vendor-app --watch=false --browsers=ChromeHeadlessNoSandbox --progress=false`
- `npx ng test delivery-app --watch=false --browsers=ChromeHeadlessNoSandbox --progress=false`
- `npx ng test admin-panel --watch=false --browsers=ChromeHeadlessNoSandbox --progress=false`
- `npx playwright test` against staging URLs
- k6 staged load test through at least the next planned traffic tier

## Staging E2E

Set the app URLs and run:

```powershell
cd D:\Projects\NexConnect\shopping-app\frontend
$env:E2E_CUSTOMER_URL = "https://staging.example.com/customer"
$env:E2E_VENDOR_URL = "https://staging.example.com/vendor"
$env:E2E_DELIVERY_URL = "https://staging.example.com/delivery"
$env:E2E_ADMIN_URL = "https://staging.example.com/admin"
npx playwright test
```

Manual OTP flows still require human OTP entry unless the staging backend is
configured with a safe test-only OTP exposure flag.

## Load Test Ramp

Run the checked-in k6 browse/search smoke first:

```powershell
k6 run `
  -e API_BASE_URL=https://staging.example.com/api `
  -e K6_TARGET_VUS=1000 `
  D:\Projects\NexConnect\shopping-app\load-tests\k6\shopping-core.js
```

Then repeat at `5000`, `20000`, `50000`, and `100000` VUs only after the
previous tier passes with:

- Cached reads p95 under 200 ms.
- Dynamic reads p95 under 500 ms.
- Checkout p95 under 1.5 s and p99 under 3 s.
- Error rate under 0.1%.
- Cache hit ratio over 85%.
- Queue lag normally under 30 s.

## Scheduled Jobs

Configure scheduler entries for:

- `python manage.py reconcile_payments --older-than-minutes 10`
- payment/order mismatch alerts
- stuck delivery assignment checks
- stuck order checks
- failed notification retry checks
- payout reconciliation
- inventory and coupon usage reconciliation

## Rollback

- Keep the previous frontend release available in CDN storage.
- Use blue/green or rolling deploys with health/readiness checks.
- Run migrations as a controlled one-off job and document whether each migration
  is backward-compatible before deployment.
- If checkout, payment, auth, or delivery assignment error rates exceed alert
  thresholds, disable new traffic and roll back app containers first. Reconcile
  payment/order state before replaying queued work.
