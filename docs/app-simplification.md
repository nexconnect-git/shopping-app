# Four-app simplification

The store marketplace remains the product model. Optional frontend features and duplicate screens are removed; existing backend contracts, records, fulfillment bookkeeping, and financial obligations remain supported.

## Workspaces

| App | Main navigation | Consolidated behavior |
| --- | --- | --- |
| Customer | Home, Cart, Orders, Account | Full cart, one-page ASAP checkout, one order-detail page, shared address fields |
| Vendor | Orders, Products, Payments, Store | Active/history orders, inline stock and availability, catalog requests, settlements/transactions, account/support |
| Delivery | Work, Earnings, Account | Availability and delivery tasks together; one session-wide dashboard/GPS store; external directions |
| Admin | Orders, Vendors, Drivers, Customers, Products, Finance, Support, Settings | Assignment in order details; profile tabs; catalog/finance/settings workspaces; support tickets and issues |

Removed UI includes promotional banners and coupons, recommendation rails, scheduled-delivery selection, new reviews/ratings and tips, wishlist/referral/wallet screens, embedded delivery route maps, duplicate order dashboards, the generic feature editor, readiness reports, and scheduled-job management. Existing jobs continue running.

Historical scheduled orders, discounts, ratings, receipts, refunds and payouts remain readable. Existing customer account credits are available in Account without a standalone wallet or top-up flow.

## Compatibility and access

- Customer order URLs redirect to `/orders/:id`.
- Legacy URLs retain path identifiers, query filters, fragments and profile-tab selections through explicit router URL trees.
- Existing authentication, approvals, runtime page restrictions, admin permission domains and dirty-form guards remain enforced.
- The existing customer home API accepts optional `layout=simple`, returning the same response keys with optional growth collections empty; other consumers retain the original default response.
- The existing vendor orders API accepts `view=history`; admin order lists accept `needs_attention` and include a summary.
- ASAP checkout now rejects scheduled-only products in shared preview/submission validation.
- Marketplace fallback vendor IDs are kept separate from persisted fulfillment-node IDs when adding to the cart.
- Connected the existing admin ticket views to their documented URL paths, retaining support view/manage permission checks.
- No database migrations or deletions are required.

## Validation

Run from `frontend`:

```powershell
npm.cmd run test:simplification
npm.cmd run lint
npx.cmd ng build customer-app --configuration production
npx.cmd ng build vendor-app --configuration production
npx.cmd ng build delivery-app --configuration production
npx.cmd ng build admin-panel --configuration production
npm.cmd run mobile:customer:build
npm.cmd run mobile:delivery:build
```

Run from `backend` using a disposable test database:

```powershell
$env:DB_NAME = ':memory:'
..\venv\Scripts\python.exe manage.py test tests.test_simplified_marketplace --settings=backend.config.local_sqlite --noinput
..\venv\Scripts\python.exe manage.py check --settings=backend.config.local_sqlite
```

The backend suite exercises real REST actions, checkout quote changes/idempotency, stock conflicts, ownership/roles/approval checks, explicit search/cancellation/expiry/retry, pickup OTP and delivery photo proof, settlement, and legacy scheduled records. Windows smoke settings stub the external RQ worker; the test simulates its notification step. Live payment-provider processing, real push delivery and device GPS/camera behavior require a configured integration environment.

### Results recorded on 29 October 2026

- Four production builds and both Capacitor web builds passed.
- Frontend regression harness: 14 tests passed. Backend API regression suite: 17 tests passed.
- Full frontend lint: zero errors; existing advisory warnings remain. Django smoke check passed.
- Browser checks used an isolated temporary SQLite database and synthetic users. Verified manual/saved location selection, full cart, one-page checkout and COD/UPI acknowledgment, successful order placement, canonical order details, vendor acceptance/next action, stock controls, finance and support-ticket access, legacy profile-tab redirects, and unsaved-change protection.
- Customer order details, vendor products, delivery Work, and admin Finance/navigation were checked at 390px width without horizontal overflow. Browser device overrides were reset.
- No real gateway payment, live RQ search-worker execution, push delivery, native back navigation, or physical device GPS/camera was exercised. These remain release-environment acceptance checks.

## Release

Committed and pushed on `codex/simplify-nextou-apps`: backend `e6d874c`, frontend `8c5ca28`.

Push backend and frontend commits separately before updating parent submodule references. Release the matching backend before or with the frontend; no production deployment is part of this change.
