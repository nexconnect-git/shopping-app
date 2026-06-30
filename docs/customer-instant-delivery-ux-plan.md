# Customer Instant Delivery UX Plan

## Objective

Redesign `frontend/projects/customer-app` into an instant-delivery-first customer experience: location-first, product-first, ETA-led, cart-reservation-aware, and checkout-fast. The design system keeps Electric Purple as the primary brand action color, with green for serviceability/stock/delivery promise, orange for offers/warnings/ETA attention, and red only for destructive or unavailable states.

## Source Of Truth

Use real customer backend payloads where available. Do not hardcode fake products, ETAs, stock, active orders, reservations, tracking events, unavailable items, or replacements.

Relevant payload fields to preserve and surface:

- `fulfillment_node`
- `promise`
- `serviceability`
- `available_quantity`
- `stock_state`
- `reservation`
- `unavailable_items`
- `replacement_suggestions`
- `active_order`
- cart totals and checkout preview totals
- tracking events and live/fallback tracking state

## Route Audit

| Route | Current Problems | Marketplace/Store-First Remnants | Missing Instant Details | Layout Changes Required | Mobile Issues | Desktop Issues | States Needed | Redesign |
|---|---|---|---|---|---|---|---|---|
| `/location` | Needs stronger serviceability-first decision flow and clearer next action. | Manual-address/search flow still feels like profile/address management. | Serviceability loading, node name, ETA promise, not-serviceable recovery. | Hero, current-location CTA, manual search, saved addresses, serviceability result cards. | Bottom-sheet and form spacing must avoid footer overlap. | Centered focused card instead of stretched page. | no location, loading, serviceable, not serviceable, permission denied. | Required |
| `/` Home | Product/category sections exist but visual hierarchy still competes with store cards. | Nearby stores can dominate above products. | Promise strip, nearest hub/node, buy-again, reservation awareness. | Search + promise + hero + categories + product rails; hide empty rails. | Horizontal rails and sticky cart need safe bottom padding. | Product grid density and section rhythm need standardization. | loading, no serviceable products, partial inventory, serviceability warning. | Required |
| `/explore` and `/explore/:categoryId` | Search/filter experience needs product-first result hierarchy. | Store results still receive equal weight. | Stock/ETA/offer filters, replacements/unavailable matches. | Sticky search, chips, product grid, filter bottom sheet. | Chip rail must not create document overflow. | Filter row/panel should be compact. | default, searching, no results, filter loading, error. | Required |
| `/store/:id` | Store page still has store-detail hero emphasis. | Store-first browsing remains. | Node promise, inventory availability, grouped shelves by product need. | Compact hero, in-store search, inventory banner, product shelves. | Hero must not bleed viewport; category chips scroll intentionally. | Dense product grids. | loading, unavailable store, not serviceable, empty shelves. | Required |
| `/product/:id` | Product detail needs stronger conversion path and sticky CTA. | Right rail/sidebar remnants were removed but details can still feel heavy. | ETA, stock state, available quantity, replacement suggestions. | Image, content card, price, promise/stock row, sticky CTA, recommendations. | Sticky CTA must not overlap bottom nav/content. | Two-column media/detail layout. | unavailable, low stock, added, conflict, replacement. | Required |
| `/cart` | Cart is close but needs reservation/node/blocker hierarchy. | Store context can read like marketplace basket. | Reservation timer, unavailable/replacement section, node promise, checkout blockers. | Fulfillment promise card, cart rows, offer card, suggestions, sticky CTA. | CTA and bottom nav spacing must be guaranteed. | Two-column sticky summary. | empty cart, updating, reservation expired, unavailable items, coupon loading. | Required |
| `/checkout` | Protected route state exists; step flow should feel shorter and instant. | Delivery slot/payment/review can feel like traditional checkout. | Reservation, ETA locked, blocking reason actions, stale preview handling. | Deliver-to card, payment card, review card, sticky place order. | Address/payment selectors need compact bottom sheets. | Sticky price summary. | locked, blocked, preview loading, COD confirm, payment failed. | Required |
| `/orders` | Locked state fixed; order cards need ETA/status clarity. | Order history is not instant-delivery focused. | Track active, reorder, status timeline summary. | Compact cards with status pill, ETA/date, total, Track/Reorder. | Active order should not block content. | Table/list density. | locked, loading, empty, error, filtered empty. | Required |
| `/order-confirmed/:id` | Needs more celebratory but compact reassurance. | Generic order success pattern. | ETA, fulfillment node/store, payment status, partner pending. | Success icon, ETA card, details card, Track CTA. | Bottom nav must not hide details/actions. | Centered success layout. | pending payment, partner pending, assignment available. | Required |
| `/tracking/:id` | Needs ETA-led hierarchy and graceful live fallback. | Summary can dominate tracking. | Live/reconnecting/fallback state, tracking events. | ETA hero, map/fallback, timeline, partner card, collapsible summary. | Map and CTA spacing. | Map/timeline balanced layout. | no partner, reconnecting, failed, delivered. | Required |
| `/order-finished/:id` | Completion/rating needs compact order closure. | Can feel like full order details. | Reorder, rating, issue support. | Finished summary, rating card, item summary, support/reorder actions. | Rating controls need tap targets. | Details should not sprawl. | loading, delivered, issue, rating submitted. | Required |
| `/account` | Locked state fixed; account should be secondary and compact. | Profile page can read like dashboard. | Active order, address serviceability, quick actions. | Profile header, quick grid, active order, menu, logout destructive. | Avoid duplicate locked/account content. | Balanced card grid. | locked, loading, empty counts, active order. | Required |
| `/addresses` | Needs serviceability-first address management. | Address cards are CRUD-first. | Serviceability badge, default indicator, unavailable warning. | Compact address cards, edit/delete/default actions. | Selection and modal forms need bottom spacing. | Grid/list cards. | locked, empty, disabled/unserviceable, form error. | Required |
| Redirected secondary routes | Notifications/wishlist/wallet/offers/referral/help/issues redirect or collapse into account/explore. | Legacy marketplace pages. | Entry-point clarity from account. | Keep route guards and provide quick actions where supported. | Avoid dead-end redirects with no explanation. | N/A | feature unavailable, linked action. | Review |

## Shared UI Audit

| Component | Current Problems | Missing Instant Details | Layout/Behavior Required | Mobile Issues | Desktop Issues | States Needed | Redesign |
|---|---|---|---|---|---|---|---|
| App shell | Multiple mobile/desktop structures and sticky layers. | Global location, active order, cart reservation. | Single responsive shell with topbar, bottom nav, sticky cart, modals. | Sticky layers must never overlap. | Desktop header should not be stretched mobile. | modal open, loading, no location. | Required |
| Mobile topbar | Gradient/heavy brand treatment can hide instant-delivery hierarchy. | ETA/serviceability beside location. | White sticky bar, location-first, compact search placement. | 64px topbar target. | N/A | no location, not serviceable, active ETA. | Required |
| Desktop topbar | Needs strict max-width layout. | Location, search, cart/account state. | Logo/location/search/cart/account. | N/A | Header density and alignment. | guest, logged in, cart count. | Required |
| Mobile bottom nav | Visual language mostly present but should align to tokens. | Track active order routing. | 5 max items, active purple soft state. | Safe area, no overlap with sticky cart. | N/A | active item, cart count. | Required |
| Global active order card | Previously blocked UI on mobile. | ETA/status/Track. | Compact 58px card, routed to tracking, never overlays content. | Must be in content flow or offset from nav. | Right rail/summary placement. | active, no active order. | Required |
| Sticky cart bar | Existing bar uses green and strong animation. | Item count, total, ETA/reservation. | Purple 60px bar above nav, clear CTA. | Avoid covering cards/forms. | Optional desktop mini basket. | hidden, visible, blocked. | Required |
| Mini cart | Can consume too much space. | Reservation/unavailable warning. | Compact summary, not modal-heavy. | Bottom safe area. | Side drawer only if useful. | empty, updating, blocked. | Required |
| Location modal/page | Modal improved but should share tokens and serviceability. | Serviceability result, node, ETA. | Compact bottom sheet, internal scroll, sticky footer. | Footer/list overlap fixed; keep regression checks. | Center modal. | no addresses, searching, denied. | Required |
| Product cards | Many styles and overrides. | Stock state, available quantity, ETA, reservation/add loading. | Standard mobile/desktop card primitives. | 2-column stable height. | 180-220px cards. | add, loading, qty, closed, unavailable. | Required |
| Category cards | Need consistent dimensions and labels. | Category availability where available. | 4-column mobile, 8-column desktop. | 2-line labels. | Larger icon cards. | loading, empty. | Required |
| Store cards | Secondary role now. | Serviceability/ETA/node. | Compact store context, not above product priority. | Rail only when useful. | Grid only where needed. | closed, not serviceable. | Required |
| Cart item rows | Need reservation/blocker clarity. | Unavailable/replacement and stock warning. | 64px image, quantity stepper, remove. | Dense but readable. | Table/card hybrid. | updating, insufficient stock. | Required |
| Price summary | Needs checkout preview parity. | Delivery/platform/discount/taxes/total. | Sticky desktop, compact mobile. | No duplicate order summary. | Sticky right column. | loading, stale, blocked. | Required |
| Quantity stepper | Multiple stepper styles. | Updating/stock insufficient. | 92x34 mobile, disabled/loading states. | Tap targets 34-40px. | Smaller but accessible. | loading, min, max, disabled. | Required |
| Skeleton loaders | Need final-dimension matching. | Serviceability/product/reservation. | Shimmer matching cards/rows. | Prevent layout shift. | Same. | loading. | Required |
| Empty states | Need consistent action-oriented copy. | Change location/start shopping/retry. | Icon/title/description/action. | Centered but not huge. | Card/panel. | all named empty states. | Required |
| Error states | Avoid raw backend errors. | Mapped blocker/action. | Red/amber card with action. | Clear concise text. | Same. | backend error, payment failed, tracking failed. | Required |
| Bottom sheets | Mixed styles. | Filter/address/login/serviceability. | 80vh max, handle, internal scroll, footer. | Focus/scroll containment. | Modal/side panel equivalent. | open, loading. | Required |
| Confirm dialogs | Need conflict-specific messaging. | Fulfillment conflict, COD confirmation, destructive actions. | Primary/secondary/destructive variants. | Sheet dialog on mobile. | Center dialog. | loading, destructive. | Required |
| Toast notifications | Need semantic colors. | Cart added, stock conflict, payment error. | Small safe-area aware toast. | Not under nav/sticky cart. | Corner toast. | success/warning/error. | Required |

## Implementation Checklist

### Phase 0 - Audit And Plan

- [x] Create this audit document.
- [x] List every customer route and major component.
- [x] Identify old marketplace/store-first remnants.
- [x] Identify instant-delivery data requirements.
- [x] Add implementation checklist.

### Phase 1 - Design Tokens

- [x] Add complete `--cx-*` token set.
- [x] Map old random colors to semantic tokens.
- [x] Update body/link/focus defaults.
- [ ] Confirm no document-level horizontal overflow.

### Phase 2 - Shared Primitives

- [x] Buttons: primary/secondary/ghost/destructive/loading/disabled.
- [ ] Icon button baseline with accessible labels.
- [x] Product card mobile and desktop standard.
- [ ] Category card standard.
- [ ] ETA, offer, and status pills.
- [ ] Search bar, section header, empty state, skeleton.

### Phase 3 - Shell

- [x] Mobile topbar location-first redesign.
- [ ] Desktop topbar max-width redesign.
- [x] Mobile bottom nav token alignment.
- [x] Sticky cart purple reservation-aware bar.
- [ ] Active order compact card.

### Phase 4 - Location

- [ ] Location page hero/current-location/manual search.
- [ ] Serviceability result/not-serviceable states.
- [ ] Saved address serviceability cards.

### Phase 5 - Home

- [ ] Promise strip.
- [ ] Product-first hero/category/product rails.
- [ ] Hide empty rails.
- [ ] Add/loading/stepper conflict handling visible.

### Phase 6 - Explore/Search

- [ ] Sticky search.
- [ ] Product-first defaults/results.
- [ ] Filter chips and mobile filter sheet.
- [ ] No-results recovery.

### Phase 7 - Product Detail

- [ ] ETA/stock/price hierarchy.
- [ ] Sticky mobile CTA.
- [ ] Replacement section.
- [ ] Recommendations/details rhythm.

### Phase 8 - Cart

- [ ] Fulfillment promise card.
- [ ] Reservation timer.
- [ ] Unavailable item action section.
- [ ] Suggestions and best coupon.
- [ ] Sticky checkout CTA.

### Phase 9 - Checkout

- [ ] Deliver/payment/review compact steps.
- [ ] Blocking reason card.
- [ ] Sticky place order CTA.
- [ ] Error mapping and scroll-to-card.

### Phase 10 - Order Confirmed

- [ ] ETA-led success card.
- [ ] Details/status cards.
- [ ] Track/continue actions.

### Phase 11 - Tracking

- [ ] ETA hero.
- [ ] Map/fallback card.
- [ ] Timeline and partner card.
- [ ] WebSocket state strips.

### Phase 12 - Account, Orders, Addresses

- [ ] Account quick grid.
- [ ] Orders cards with status/ETA/reorder.
- [ ] Address serviceability badges/actions.

### Phase 13 - Empty/Loading/Error

- [ ] Consistent no location, not serviceable, no products, no results.
- [ ] Empty cart, reservation expired, checkout blocked, payment failed.
- [ ] Tracking unavailable.

### Phase 14 - Responsive Alignment

- [ ] Validate 360, 390, 430, 768, 1280, 1440 widths.
- [ ] Fix sticky CTA/nav overlaps.
- [ ] Normalize cards/gaps/grids.

### Phase 15 - Accessibility

- [ ] Icon button `aria-label` audit.
- [ ] Modal focus/ESC/backdrop rules.
- [ ] Form labels/errors.
- [ ] Contrast check for purple/green/orange/red.

### Phase 16 - Validation

- [ ] `npx ng build customer-app`
- [ ] `npx ng lint customer-app`
- [ ] `npx ng test customer-app` if configured.
- [ ] Browser QA for core instant delivery flows.

## Initial Implementation Order

1. Tokens and primitives first, because they unblock consistent visual changes.
2. Shell and sticky layers second, because they affect every route.
3. Home, explore, product detail, cart, checkout in conversion order.
4. Order/tracking/account/address surfaces.
5. Empty/error/loading/accessibility and browser QA.
