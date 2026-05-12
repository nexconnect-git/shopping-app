# NexConnect Mobile Instant Delivery Feature Plan

## Current Mobile App Snapshot

The customer mobile app already covers the main ecommerce loop:

- Native Expo/React Native app in `shopping-mobile-app/mobile-customer`
- Bottom tabs for Home, Search, Orders, and Profile
- Screens for location, shop listing/detail, product detail, cart, checkout, orders, live tracking, help/issues, ratings, offers, addresses, wallet, wishlist, and referrals
- OTP login/register, SecureStore token storage, push notification registration, notification sheet, Razorpay payment, saved addresses, map/location helpers, live order tracking socket, support thread attachments, wallet top-up, loyalty/referral APIs

The app is therefore a good base, but for an instant delivery ecommerce feel it needs stronger speed cues, personalization, reorder loops, richer live operations, and more engaging product discovery.

## Product Direction

Position the mobile app around "get what you need from nearby stores quickly". The user should feel three things on every important screen:

- Availability: what can reach me now?
- Speed: when will it arrive?
- Confidence: where is the order and who is handling it?

## Priority 1: Core Instant Delivery Features

### 1. Delivery Promise Layer

Add a shared delivery promise system across Home, Search, Shop Detail, Product Detail, Cart, and Checkout.

New backend/data needs:
- Vendor preparation time
- Store operating windows and temporary pause state
- Product availability status: in stock, low stock, out of stock
- Estimated delivery time by vendor/customer distance
- Surge/rain/late-night delivery fee rules if needed

Mobile UX:
- Show "Delivery in 15-25 min" on vendor cards, product cards, cart, and checkout
- Show "Open now", "Closing soon", "Busy", "Paused", or "Back at 6 PM"
- Disable checkout if no instant delivery slot is available
- Add delivery promise recalculation when address changes

### 2. Better Location First Experience

Existing location selection is useful, but instant delivery needs location to feel central.

New or upgraded screens:
- `LocationPermissionScreen`: first-run location prompt with manual search fallback
- `ServiceabilityScreen`: shown when address is outside delivery area
- `SavedPlacesQuickSheet`: Home/Work/Recent locations as a fast bottom sheet

Features:
- Detect current location during onboarding
- Save recent search locations
- Show serviceable vendors only by default
- Let users browse far stores separately with clear messaging

### 3. Fast Reorder and Buy Again

This is one of the highest engagement features for grocery/essentials.

New pages/sections:
- `BuyAgainScreen`
- Home section: "Buy again"
- Product replacement sheet for unavailable previous items

Features:
- One-tap add previous order to cart
- Smart replacement suggestions for out-of-stock items
- Frequently bought product bundles
- "Repeat last order" CTA on Home and Orders

### 4. Real-Time Order Journey

The app has tracking, but instant delivery needs richer step-by-step confidence.

Upgrade `OrderTrackingScreen` and `OrderDetailScreen`:
- Timeline: placed, accepted, packed, driver assigned, picked up, nearby, delivered
- Live driver card with name, rating, vehicle, call button
- Pickup OTP and delivery OTP explanations
- Map route from store to customer
- ETA countdown and delay reason
- "Share tracking" with a meaningful tracking link

Backend needs:
- More granular timestamps
- Delay reason field
- Driver location heartbeat quality
- Public/guest-safe tracking token if shareable tracking is desired

### 5. Smart Substitution Flow

Instant delivery frequently has stock mismatches.

New pages/sheets:
- `SubstitutionPreferencesScreen`
- `OrderSubstitutionReviewSheet`

Features:
- Per order preference: call me, replace automatically, remove item, refund wallet
- Product-level replacement options
- Vendor can request substitution; customer approves from push notification
- Timeout fallback rule

## Priority 2: Engagement and Discovery

### 6. Personalized Home

Current Home can become much more engaging without becoming noisy.

Sections to add:
- Delivery promise header: "Delivering to Koramangala in 18 min"
- Search bar with rotating intent hints
- Quick categories with real product imagery
- Buy again
- Nearby open stores
- Trending near you
- Fresh deals ending soon
- Recently viewed
- Essentials under budget
- New stores near you

Backend needs:
- Recently viewed products
- Trending products/vendors
- Personalized recommendations from order/cart/wishlist history

### 7. Product Discovery Improvements

New pages/features:
- `CategoryLandingScreen`: category-specific browsing
- `ProductCollectionScreen`: deals, trending, fresh arrivals, essentials
- `ProductCompareSheet`: unit price, delivery time, store, rating
- Filters: delivery time, open now, rating, price, offers, in stock
- Sort: fastest delivery, nearest store, price low/high, popularity

UX details:
- Sticky search/filter bar
- Quick add steppers on product cards
- Low-stock badges
- Unit price display for grocery confidence

### 8. Offers, Wallet, Loyalty Depth

Existing Offers, Wallet, Loyalty, Referral APIs are good foundations.

Upgrade pages:
- `OffersScreen`: coupon cards, auto-apply best coupon, expiry countdown
- `WalletScreen`: transaction history, refund status, top-up presets
- `ReferralScreen`: progress and reward unlock states
- Add `RewardsScreen`: points, tiers, missions, vouchers

Engagement features:
- Streak reward for weekly orders
- Free delivery pass or membership
- Scratch-card reward after delivery
- "You saved X this month"

### 9. Notifications Inbox as Action Center

Current notification sheet is simple. Make it actionable.

Features:
- Group notifications by order, offer, support
- Deep links already exist; expand with action buttons
- Mark order-related notifications as resolved after delivery
- Push categories: order update, offer, wallet/refund, support, substitution

New page:
- `NotificationsScreen` for full history, filters, and preferences

## Priority 3: Trust, Support, and Retention

### 10. Support and Returns

Current issue screens are a good start.

Add:
- Guided issue categories: missing item, damaged item, wrong item, late delivery, payment/refund
- Photo capture from camera, not only gallery
- Refund status tracker
- Support SLA message: "Usually replies in X min"
- Post-resolution rating

New pages:
- `RefundStatusScreen`
- `SupportCenterScreen`

### 11. Rating and Review System

Upgrade `OrderRatingScreen`:
- Rate vendor, products, and delivery partner separately
- Tip delivery partner after delivery
- Tags: fast delivery, fresh products, good packing
- Negative rating opens issue suggestion

### 12. Customer Profile and Preferences

New pages:
- `PreferencesScreen`
- `PaymentMethodsScreen`
- `CommunicationPreferencesScreen`

Features:
- Dietary/preferences tags if food/grocery categories expand
- Preferred delivery instructions
- No-contact delivery preference
- Default payment method
- Notification opt-ins

## Delivery Partner Mobile Feature Gaps

The delivery app already has dashboard, available orders, active delivery, history, earnings, and profile. For instant delivery operations, add:

- Online/offline shift toggle with location permission enforcement
- Heatmap or busy zones
- Offer countdown timer and distance-to-pickup
- Pickup and drop OTP verification flow
- In-app navigation launcher
- Proof of delivery photo/signature where needed
- Earnings breakdown by base fee, incentive, tip, payout status
- Delivery issue reporting: store delay, customer unreachable, vehicle issue
- Battery/location health warning

## Vendor Mobile/Responsive Feature Gaps

Instant delivery depends heavily on vendor speed.

Add or improve:
- New order alert with accept/prepare timer
- Packing checklist by item
- Out-of-stock substitution request
- Store busy/paused mode
- Product stock quick editor
- Ready-for-pickup CTA
- Delivery search status and manual retry
- SLA dashboard: average prep time, delayed orders, cancellations

## Design Changes for More Engagement

### Visual Direction

The mobile theme currently uses warm cream/orange. It feels food/grocery friendly, but it risks becoming one-note. Keep orange as the action color, then add a more balanced palette:

- Primary action: warm orange
- Freshness/accent: green for fresh, available, delivered
- Trust/accent: blue for tracking, payments, support
- Urgency: red only for errors/expiring offers
- Neutral surfaces: white and very light warm gray instead of heavy cream everywhere

### Navigation

Recommended bottom tabs:
- Home
- Search
- Cart
- Orders
- Account

The current tab bar defines Cart but hides it from the visible routes. For instant commerce, Cart should stay visible because it is the conversion surface.

Add floating/contextual actions:
- Sticky cart bar after adding products
- Sticky checkout button in Cart
- Sticky reorder CTA on order history

### Home Screen Feel

Make the first viewport dense but friendly:

- Top location row
- Search
- Delivery promise strip
- Category chips
- Buy Again or Nearby Stores immediately visible

Avoid large marketing banners taking over the first screen. Instant delivery users usually arrive with intent.

### Motion and Feedback

Add lightweight native-feeling feedback:

- Haptics on add-to-cart, quantity step, coupon applied
- Skeleton loaders for Home/Search/Cart
- Optimistic add-to-cart state
- Animated order status progress
- Cart item add confirmation with mini cart sheet

### Cards and Lists

Use tighter cards:

- Product card: image, name, unit, price, stock/offer badge, quick add
- Vendor card: logo/image, delivery ETA, distance, rating, open status
- Order card: status, ETA, item count, main action

Avoid nesting cards inside cards. Use full-width sections with repeated item cards only.

### Engagement Copy

Use operational, confidence-building copy:

- "Arrives in 18-24 min"
- "Packed by FreshMart"
- "Driver is 2 min away"
- "3 items low in stock"
- "Best coupon applied"

Avoid generic marketing text when the user is making a purchase decision.

## Suggested Implementation Phases

### Phase 1: Conversion and Speed Foundation

- Show visible Cart tab
- Add delivery ETA/promise display across vendor/product/cart/checkout
- Add Buy Again section and screen
- Improve order tracking timeline and driver card
- Add skeleton loading and optimistic cart updates

### Phase 2: Operations Reliability

- Add substitution preferences and approval flow
- Add vendor prep-time/order-ready timestamps
- Add delivery partner OTP/checklist improvements
- Add delay reasons and richer tracking events
- Add serviceability screen and stronger location handling

### Phase 3: Engagement and Retention

- Add personalized Home sections
- Add rewards/membership/scratch-card experience
- Add full notifications center and preferences
- Add recently viewed and trending collections
- Add richer reviews and post-delivery tipping

### Phase 4: Scale and Optimization

- Add recommendation ranking
- Add A/B testable home sections
- Add performance monitoring and crash reporting
- Add analytics funnels: location set, search, product view, add cart, checkout, payment, reorder
- Add offline/error states for poor network checkout and tracking

## Technical Notes

- Keep customer mobile API methods centralized in `shopping-mobile-app/mobile-customer/src/lib/api.ts`.
- Keep app-wide user/cart/location/notification state in `AppState.tsx`, but split into smaller domain hooks once recommendation, recent views, or checkout state grows.
- Consider splitting the large `Screens.tsx` file into one file per screen before adding many new pages. This will make feature development safer and faster.
- Reuse the backend layered pattern for new features: views for HTTP, actions for business logic, repositories for ORM queries.
- Add tests around checkout ETA, substitution decisions, reorder cart creation, coupon auto-apply, and order tracking status transitions.

## Highest ROI Next Build

Build these first:

1. Visible Cart tab plus sticky mini cart after add-to-cart
2. Delivery promise/ETA display on Home, Shop Detail, Product Detail, Cart, and Checkout
3. Buy Again section with one-tap reorder
4. Rich Order Tracking timeline with driver card and ETA
5. Serviceability and location improvements

These changes would make the app feel much closer to an instant delivery product without requiring a full redesign or rewriting the ecommerce core.
