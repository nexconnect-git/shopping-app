# Nextou Direct-Store Instant Commerce HLD

## 1. Purpose
Nextou is a direct-store instant-commerce platform where customers shop from nearby local stores, vendors manage store operations, delivery partners pick up from stores and deliver to customers, and admins control catalog, marketplace operations, approvals, dispatch, support, payouts, reports, and feature access.

## 2. Core Business Model
Nextou uses direct-store fulfillment:
- Customer selects location
- Customer discovers nearby serviceable stores
- Customer shops from a specific store
- Customer adds store products to cart
- Customer places order
- Vendor/store prepares order
- Delivery partner picks up from store
- Delivery partner delivers to customer

## 3. Applications
- customer-app
- vendor-app
- delivery-app
- admin-panel
- shared
- backend/API

## 4. High-Level Architecture
```text
Customer App      Vendor App      Delivery App      Admin Panel
     |                |                |                |
     ----------------------------------------------------
                          |
                     API Gateway
                          |
     ----------------------------------------------------
     |        |        |        |        |       |       |
   Auth     Store   Catalog  Inventory  Cart   Order  Payment
 Service  Service  Service   Service   Service Service Service
     |        |        |        |        |       |       |
     ----------------------------------------------------
                          |
     ----------------------------------------------------
     |          |          |          |          |
 Delivery   Tracking   Wallet     Support   Notification
 Service    Service    Service    Service      Service
     |          |          |          |          |
     ----------------------------------------------------
                          |
                    Admin/Analytics
                          |
     ----------------------------------------------------
     |          |          |          |          |
 PostgreSQL   Redis   Search Index  Queue    Object Storage
```

Implementation mapping in this repository:
- Frontend apps: Angular standalone apps in `frontend/projects/*`
- Shared frontend contract/runtime: `frontend/projects/shared` + `packages/customer-*`
- API: Django REST (`backend/*`) mounted under `/api/*`
- Async/events: RQ tasks + Django signals + Channels WebSocket
- Primary data store: PostgreSQL (with local sqlite fallback)

## 5. Core Domains
- Auth/User
- Customer
- Store/Vendor
- Parent Catalog
- Vendor Product
- Inventory
- Cart
- Order
- Payment
- Wallet
- Offers/Coupons
- Delivery Assignment
- Tracking
- Notifications
- Support/Issues
- Admin Operations
- Reports/Analytics
- Page/Feature Management

## 6. App Responsibilities
### Customer app
- location
- nearby stores
- categories
- store/product discovery
- search
- cart
- checkout
- payments
- orders
- tracking
- wallet
- wishlist
- referral
- support

### Vendor app
- store onboarding
- store settings
- store open/closed
- accepting-orders
- live order preparation
- product creation from parent catalog
- inventory
- catalog requests
- promotions
- payouts
- support

### Delivery app
- online/offline
- available orders
- active delivery
- pickup from store
- drop to customer
- OTP/proof/COD
- live location
- earnings
- history
- profile

### Admin panel
- dashboard
- vendor approvals
- store management
- parent catalog
- categories
- catalog requests
- vendor product approvals
- live orders
- dispatch/delivery operations
- customers
- support/refunds
- promotions/banners/coupons
- payments/payouts
- reports
- page/feature management

## 7. High-Level Direct-Store Order Flow
1. Customer selects location
2. Fetch nearby serviceable stores
3. Customer selects store/product
4. Add vendor product to cart
5. Validate same-store cart
6. Checkout preview
7. Validate store/serviceability/stock/price/coupon/address
8. Create order
9. Process payment
10. Vendor receives order
11. Vendor prepares order
12. Vendor marks ready for pickup
13. Delivery partner assigned near store
14. Delivery partner picks up from store
15. Delivery partner delivers to customer
16. Order delivered
17. Customer rates/reorders/support

## 8. Parent Catalog and Vendor Product Flow
1. Admin creates Parent Catalog Item.
2. Parent catalog item becomes active.
3. Vendor searches parent catalog.
4. Vendor creates Vendor Product from parent item.
5. Vendor sets store-specific price, stock, pack size, visibility, and delivery attributes.
6. Admin approves vendor product when review is required.
7. Product becomes visible only when store is serviceable and product is sellable.

Vendor missing product request flow:
1. Vendor submits Catalog Request.
2. Admin reviews request.
3. Approved request creates Parent Catalog Item.
4. Vendor inherits approved parent item into Vendor Product.

## 9. UI Design Architecture
### Customer
- mobile-first direct-store commerce
- bottom nav
- location-first
- store/product cards
- bottom sheets
- sticky CTAs

### Vendor
- operations dashboard
- KPI cards
- prep workflow
- inventory/product forms

### Delivery
- task-first
- map/status focused
- one primary action per state

### Admin
- control center
- sidebar/topbar
- tables/drawers/modals
- approval queues

## 10. Non-Functional Requirements
- direct-store consistency
- inventory safety
- payment idempotency
- low-latency search
- role security
- auditability
- feature flag reversibility
- scalable notifications/tracking

## 11. Governance Constraints
- Parent catalog is admin-owned only.
- Sellable vendor products must inherit parent catalog items.
- Cart and checkout are store-aware and serviceability-aware.
- Delivery assignment originates from selected store coordinates.
- Admin actions must remain auditable.
- Feature toggles remain role-aware and reversible.

## 12. Current-State Readiness Snapshot
- Strong existing primitives already present for direct-store delivery and catalog inheritance workflows.
- Direct-store hardening now includes strict sellable-product catalog inheritance, store-aware public product filtering, cart price-at-add snapshots, order item catalog/vendor snapshots, normalized order/payment/delivery payload fields, an inventory reservation ledger, atomic replace-cart API, and audited admin dispatch reassignment.
- Remaining technical debt is mostly operational: frontend bundle budget tuning, fuller automated test coverage, and optional alias endpoints for friendlier `/api/customer/*` and `/api/vendor/*` naming.

## 13. Implemented Direct-Store Control Points
- Customer-visible product queries require approved, active, available, catalog-backed vendor products.
- Cart add/update validates store-level stock and keeps replacement as an explicit user-confirmed operation.
- Checkout locks vendor products, validates catalog inheritance, serviceability, store hours, address, coupon, payment, and stock before order creation.
- Orders persist direct-store product snapshots for historical pricing, catalog, vendor, SKU, pack, and brand reconstruction.
- Inventory reservations are recorded during order creation and committed when stock is decremented; committed reservations are released when customer or admin cancellation restores stock.
- Order and delivery serializers expose normalized fields while preserving legacy status values for compatibility.
- Admins can manually reassign delivery dispatch with audit metadata and notifications.
