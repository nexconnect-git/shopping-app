# Customer App Strict Component Audit

Scope: `frontend/projects/customer-app/src/app`, `frontend/projects/customer-app/src/styles.scss`.

Current strict pass notes:
- Browser target: `http://localhost:4201/`.
- Login handoff prepared with phone `6282611751` and email `haiiamnikhil@gmail.com`; OTP entry remains manual.
- Confirmed mobile `/location`, `/`, `/explore`, `/cart`, `/orders`, `/account`, `/stores`, first store route, and first product route in the running browser.
- New fixes from this pass: mobile location map/CTA layout, active-order floater hidden outside home, specific store route no longer falls back to the first cached store, and product/store/category pages no longer show the global route loader over usable content.
- The running `4201` server did not always hot-load updated component CSS, so final confidence must come from build plus fresh browser reload/server validation.

Status key:
- `Fully rebuild` means HTML composition and SCSS must be redesigned; TypeScript business logic is preserved unless it directly blocks the UX.
- `Structurally refactor` means keep the component/API responsibility but change layout, state presentation, accessibility, or shell wiring.
- `Reusable shared component` means keep or improve as a platform primitive used by pages.
- `Merge/remove` means obsolete or duplicated implementation must leave the active app.
- `Preserve safely` means keep API/business logic and only adjust if validation exposes a bug.

## Root And Global

| File or group | Current finding | Action |
| --- | --- | --- |
| `src/app/app.component.*` | Main shell already owns topbar, mobile topbar, overlays, mini cart, sticky cart, active order, loaders, and bottom nav; needs strict z-index/overflow and responsive consistency validation. | Structurally refactor |
| `src/app/app.routes.ts` | Real routes exist for core pages; redirected legacy/account features must be explicitly documented; location guard protects shopping routes. | Structurally refactor |
| `src/app/models.ts` | Shared customer view models; many flexible fields support API variance. | Preserve safely |
| `src/styles.scss` | Large layered stylesheet with multiple consistency passes; needs token cleanup and dead CSS reduction without breaking current pages. | Structurally refactor |

## Pages

| File or group | Current finding | Action |
| --- | --- | --- |
| `pages/home/home.component.*` | Main storefront is large and already partly redesigned; must be audited for old rails, spacing, loading, serviceability, and route sanitization. | Fully rebuild |
| `pages/search/search.component.*` | Discovery page supports categories/search/filter concepts; needs compact single design language across mobile/desktop. | Fully rebuild |
| `pages/store-detail/store-detail.component.*` | Store browsing page is complex and must keep store/product/cart logic while improving sticky search/category/product shelves. | Fully rebuild |
| `pages/product-detail/product-detail.component.*` | Product page has previous right-rail/sidebar problems; must remain no-side-rail and use modern product detail composition. | Fully rebuild |
| `pages/cart/cart.component.*` | Basket flow must keep guest/auth cart, coupons, summary, sticky CTA, and checkout blockers; UI needs compact rebuild. | Fully rebuild |
| `pages/checkout/checkout.component.*` | Largest route; must preserve validation/payment/order creation while consolidating duplicated summaries and step flow. | Fully rebuild |
| `pages/orders/orders.component.*` | Already has locked guest state; authenticated order list needs compact cards/table parity. | Fully rebuild |
| `pages/order-confirmed/order-confirmed.component.*` | Needs order placed animation and tighter summary while preserving confirmation fetch. | Fully rebuild |
| `pages/tracking/tracking.component.*` | Map/timeline/order summary/support flow is large; redesign must preserve live tracking and fallback states. | Fully rebuild |
| `pages/order-finished/order-finished.component.*` | Completion/rating route must preserve rating/reorder while modernizing final order surface. | Fully rebuild |
| `pages/profile/profile.component.*` | Account page has modern shell but still needs stricter mobile/web parity, real feature entries, and text/spacing validation. | Structurally refactor |
| `pages/addresses/addresses.component.*` | Address cards and add/edit bottom sheet exist; must harden disabled/selected/serviceability states and map fallback. | Fully rebuild |
| `pages/location/location.component.*` | Location selection works and guards routes; map unavailable fallback is contained but UX needs polish and manual flow clarity. | Structurally refactor |
| `pages/categories/categories.component.*` | Mounted route; must keep category browsing but align with product/store sections. | Fully rebuild |
| `pages/category/category.component.*` | Mounted route; must align with search/category scoped browsing and product cards. | Fully rebuild |
| `pages/category-redirect/category-redirect.component.ts` | Legacy redirect helper likely obsolete after real category route mount. | Merge/remove if unreferenced |
| `pages/notifications/notifications.component.*` | Converted to route-local locked state plus real inbox; must verify no protected guest API calls. | Structurally refactor |
| `pages/stores/stores.component.*` | Mounted route; must become modern nearby stores discovery page. | Fully rebuild |

## Commerce Components

| File or group | Current finding | Action |
| --- | --- | --- |
| `components/product-card/product-card.component.*` | Core commerce primitive; must keep cart mutation outputs and normalize Blinkit-like dense card states. | Structurally refactor |
| `components/store-card/store-card.component.*` | Core store primitive; must align with offers, ETA, open/closed, distance, and responsive card dimensions. | Structurally refactor |
| `components/order-summary/order-summary.component.*` | Shared summary primitive; currently narrow and should support checkout/cart/order contexts without duplicated summaries. | Reusable shared component |
| `components/right-rail/right-rail.component.*` | Right rail caused product detail/sidebar problems; use only on desktop where useful or remove from active layouts. | Merge/remove from active pages |

## Mobile UI

| File or group | Current finding | Action |
| --- | --- | --- |
| `mobile-ui/mobile-bottom-nav/mobile-bottom-nav.component.*` | Sole active `fd-mobile-bottom-nav`; must remain the consolidated implementation. | Structurally refactor |
| `mobile-ui/mobile-bottom-sheet/mobile-bottom-sheet.component.*` | Mobile sheet primitive; needs accessibility, safe-area, and scroll clipping hardening. | Reusable shared component |
| `mobile-ui/mobile-category-tabs/mobile-category-tabs.component.*` | Horizontal category primitive; must prevent overflow and support selected state. | Structurally refactor |
| `mobile-ui/mobile-checkout-stepper/mobile-checkout-stepper.component.*` | Checkout mobile progress primitive; keep and align to step flow. | Structurally refactor |
| `mobile-ui/mobile-empty-state/mobile-empty-state.component.*` | Empty state primitive; keep as reusable but modernize color/action support. | Reusable shared component |
| `mobile-ui/mobile-loader/mobile-loader.component.*` | Route loading primitive; keep and verify it does not block after complete. | Reusable shared component |
| `mobile-ui/mobile-location-pill/mobile-location-pill.component.*` | Location chip primitive; align with topbar and location modal. | Structurally refactor |
| `mobile-ui/mobile-page-header/mobile-page-header.component.*` | Generic mobile header; keep if used, align with shell topbar. | Structurally refactor |
| `mobile-ui/mobile-price-summary/mobile-price-summary.component.*` | Price summary primitive; should merge behavior with order summary semantics. | Reusable shared component |
| `mobile-ui/mobile-product-card/mobile-product-card.component.*` | Mobile product primitive; align with desktop product card states and add/stepper behavior. | Structurally refactor |
| `mobile-ui/mobile-product-row/mobile-product-row.component.*` | Compact cart/suggestion row; align with product card pricing and quantity controls. | Structurally refactor |
| `mobile-ui/mobile-promo-card/mobile-promo-card.component.*` | Promo card primitive; keep but remove one-off styling. | Structurally refactor |
| `mobile-ui/mobile-quantity-stepper/mobile-quantity-stepper.component.*` | Quantity primitive; preserve events and improve tap targets/disabled labels. | Reusable shared component |
| `mobile-ui/mobile-quick-action-grid/mobile-quick-action-grid.component.*` | Account/home shortcuts primitive; keep with consistent card sizing. | Structurally refactor |
| `mobile-ui/mobile-search-bar/mobile-search-bar.component.*` | Search primitive; keep and align with explore/store search. | Reusable shared component |
| `mobile-ui/mobile-shell/mobile-shell.component.*` | Thin wrapper; either expand into real shell primitive or remove if unused. | Merge/remove if unreferenced |
| `mobile-ui/mobile-stepper/mobile-stepper.component.*` | Generic progress primitive; keep only if distinct from checkout stepper. | Merge/refactor |
| `mobile-ui/mobile-store-card/mobile-store-card.component.*` | Mobile store primitive; align with desktop store card. | Structurally refactor |
| `mobile-ui/mobile-toast/mobile-toast.component.*` | Mobile toast primitive; preserve and validate z-index with nav/sticky cart. | Reusable shared component |
| `mobile-ui/mobile-topbar/mobile-topbar.component.*` | Mobile shell header; must be hardened for search/location/cart/account states. | Structurally refactor |

## Shared Components

| File or group | Current finding | Action |
| --- | --- | --- |
| `shared/app-loader/app-loader.component.*` and service | Global loader exists; SCSS is almost empty and relies on global styles. | Structurally refactor |
| `shared/breadcrumbs/breadcrumbs.component.*` | Small desktop navigation primitive; keep and type its API. | Reusable shared component |
| `shared/confirm-dialog/confirm-dialog.component.*` | Critical cart/checkout confirmation primitive; keep and harden accessibility. | Reusable shared component |
| `shared/customer-locked-state/customer-locked-state.component.*` | Route-local protected state; currently used for account/orders/addresses/notifications. | Reusable shared component |
| `shared/edit-modal/edit-modal.component.*` | Profile/payment/address edit modal; large and must avoid clipping on mobile. | Structurally refactor |
| `shared/filter-slider/filter-slider.component.*` | Filter drawer; must fix accessibility click warning and bottom-sheet parity. | Structurally refactor |
| `shared/footer/footer.component.*` | Desktop footer only; keep if visually consistent or hide from app surfaces. | Merge/remove if unused |
| `shared/location-modal/location-modal.component.*` | Large location sheet; must align with location page and avoid selected/disabled address bugs. | Fully rebuild |
| `shared/login-slider/login-slider.component.*` | OTP auth surface; must keep OTP logic and improve loading/error/resend states. | Fully rebuild |
| `shared/mini-cart/mini-cart.component.*` | Desktop mini cart overlay; needs compact design and mobile non-overlap with sticky cart. | Fully rebuild |
| `shared/mobile-bottom-nav/mobile-bottom-nav.component.*` | Obsolete duplicate selector implementation; files are deleted. | Removed/consolidated |
| `shared/mobile-sticky-cart-bar/mobile-sticky-cart-bar.component.*` | Sticky cart bar; must stay compact and not overlap bottom nav/content. | Structurally refactor |
| `shared/nextou-home/nextou-home.component.*`, models, service | Legacy/alternate home implementation; must be removed from active path or modernized if referenced. | Merge/remove if unreferenced |
| `shared/sidebar/sidebar.component.*` | Desktop sidebar not appropriate for current quick-commerce shell; keep only if no active old layout dependency. | Merge/remove from active pages |
| `shared/topbar/topbar.component.*` | Desktop shell header; must be modernized with location/search/cart/account and no gradients. | Structurally refactor |
| `shared/category-icons.ts` | Utility mapping; keep and expand only if needed. | Preserve safely |
| `shared/display-order-id.pipe.ts` | Useful display helper; keep and type if lint cleanup needed. | Preserve safely |

## UI Atoms

| File or group | Current finding | Action |
| --- | --- | --- |
| `shared/ui/nx-button/nx-button.component.*` | Already has icon/loading/disabled improvements; continue as canonical button primitive. | Reusable shared component |
| `shared/ui/nx-card/nx-card.component.*` | Already has tone/padding improvements; continue as canonical card primitive. | Reusable shared component |
| `shared/ui/nx-input/nx-input.component.*` | Already has hint/error/disabled improvements; continue as canonical input primitive. | Reusable shared component |
| `shared/ui/nx-modal-shell/nx-modal-shell.component.*` | Already has dialog semantics/dismissible support; use in modal refactors. | Reusable shared component |
| `shared/ui/index.ts` | Barrel export; keep updated with atom surface. | Preserve safely |

## Services, Config, Adapters, Facades

| File or group | Current finding | Action |
| --- | --- | --- |
| `services/app-state.service.ts` | Source of cart/checkout/location/payment/serviceability/active order truth; do not rewrite UI-only. | Preserve safely |
| `services/catalog.service.ts` | Source of home/explore/category/store/product mapping; preserve and only fix duplicate calls/data shaping. | Preserve safely |
| `services/order.service.ts` | Source of orders/reorder/rating; preserve. | Preserve safely |
| `services/ui.service.ts` | Global overlay state; preserve and add state only if required by redesigned components. | Preserve safely |
| `services/auth.service.ts` | Customer OTP/profile wrapper; preserve auth contracts. | Preserve safely |
| `services/customer-api-client.service.ts` | API bridge; preserve contracts. | Preserve safely |
| `services/customer-catalog-api.service.ts` | Catalog endpoint wrapper; preserve contracts. | Preserve safely |
| `services/customer-cart-api.service.ts` | Cart/coupon/suggestions endpoint wrapper; preserve contracts. | Preserve safely |
| `services/customer-order-api.service.ts` | Orders/tracking/payment endpoint wrapper; preserve contracts. | Preserve safely |
| `services/customer-account-api.service.ts` | Profile/address endpoint wrapper; preserve contracts. | Preserve safely |
| `services/customer-auth.guard.ts` | Auth guard currently redirects some protected routes; use route-local locked states where better, preserving role clearing. | Structurally refactor |
| `services/customer-location.guard.ts` | Location/serviceability guard; preserve and validate redirects. | Preserve safely |
| `services/customer-app-startup.service.ts` | Startup hydration/polling; preserve. | Preserve safely |
| `services/customer-content-config.service.ts` | Navigation/route content config; align redirected feature entries and bottom nav. | Structurally refactor |
| `services/customer-visual.service.ts` | Visual helper; preserve or merge into design utilities if unused. | Merge/refactor if unreferenced |
| `services/adapters/*.ts` | HTTP/payment/token adapters; preserve contracts. | Preserve safely |
| `services/facades/*.ts` | Thin facades around app state; preserve unless unused by pages. | Preserve safely |
| `config/customer-navigation.ts` | Bottom nav config; keep consistent with real routes. | Structurally refactor |

## Redirected Or Placeholder Features

| Route/feature | Current finding | Action |
| --- | --- | --- |
| `/wishlist`, `/favorites` | Redirect to account; product wishlist API references exist but no page component in current tree. | Keep redirect with clear account entry unless API/page is added |
| `/wallet`, `/payments` | Redirect to account; account/payment summary surfaces exist but no standalone page. | Keep redirect with clear account entry unless API/page is added |
| `/offers` | Redirects to explore; home/search supports offers query/filter concepts. | Keep redirect to offer-filtered discovery or mount only if page exists |
| `/referral` | Redirect to account; no page component in current tree. | Keep redirect with account entry |
| `/help`, `/issues`, `/my-issues`, order issue routes | Redirect to account; order tracking has help affordance but no standalone support page here. | Keep redirect with account/support entry until support page exists |
| `/search` | Redirects to `/explore`; bottom nav still points at `/search` in one config. | Normalize nav to real `/explore` route |

## Duplicate Selector Resolution

| Selector | Current finding | Action |
| --- | --- | --- |
| `fd-mobile-bottom-nav` | Only `mobile-ui/mobile-bottom-nav` now declares the selector. `shared/mobile-bottom-nav` files are deleted. | Keep consolidated mobile-ui implementation and ensure imports/templates reference only it |
