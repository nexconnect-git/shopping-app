# Customer UI parity report

Implemented customer UI rebuild with **411/450 current primary visual reviews** and **109/110 additional-width reviews**. Full parity is not complete: 13 states (39 primary comparisons) remain blocked/unverified, and the extra-width exceptions are listed in E. Reviewed layouts retain documented differences from real backend data and unavailable providers.

## A. All reference states and routes

All 150 manifest states have reference evidence at 1440×960, 834×1112 and 390×844. The approved HTML is unchanged. Temporary presentation copies render its markup at controlled CSS viewports with scripts removed. Original full screenshots and DOM geometry are retained; aspect-normalized pairs are viewing aids. Earlier scaled atlas crops are diagnostic evidence only.

The matrix uses the recorded hash-bound review ledgers, not historical completion labels. Primary hashes were validated earlier in this continuation and extra hashes were recorded at acceptance; this generation does not repeat the screenshot-byte audit. Actual capture count: 411. Component/route mappings come from the retained implementation coverage manifest. Provider limitations remain explicit even when the surrounding layout is reviewed.

| ID | Reference state | Actual route | Component | Desktop | Tablet | Phone | Status |
|---|---|---|---|---|---|---|---|
| C02-01 | A little local. A lot to love. | / | Home | Reviewed; real Home data differences | Reviewed; real Home data differences | Reviewed; real Home data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C02-02 | Home skeleton loading | / | Home | Reviewed; real Home data differences | Reviewed; real Home data differences | Reviewed; real Home data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C02-03 | Delivery unavailable in this area | / | Home | Reviewed; real Home data differences | Reviewed; real Home data differences | Reviewed; real Home data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C02-04 | One home section could not load | / | Home | Reviewed; real Home data differences | Reviewed; real Home data differences | Reviewed; real Home data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C01-01 | Choose your neighbourhood | /location | Location | Reviewed; provider rendering blocked | Reviewed; provider rendering blocked | Reviewed; provider rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C01-02 | Search and select a location | /location | Location | BLOCKED / UNVERIFIED: Google Maps localhost authorization | BLOCKED / UNVERIFIED: Google Maps localhost authorization | BLOCKED / UNVERIFIED: Google Maps localhost authorization | BLOCKED / UNVERIFIED: Google Maps localhost authorization |
| C01-03 | Confirm the delivery pin | /location | Location | Reviewed; provider rendering blocked | Reviewed; provider rendering blocked | Reviewed; provider rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C01-04 | Checking the selected area | /location | Location | Reviewed; provider rendering blocked | Reviewed; provider rendering blocked | Reviewed; provider rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C01-05 | Outside the delivery area | /location | Location | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C01-06 | Location permission denied | /location | Location | BLOCKED / UNVERIFIED: Native permission UI unavailable | BLOCKED / UNVERIFIED: Native permission UI unavailable | BLOCKED / UNVERIFIED: Native permission UI unavailable | BLOCKED / UNVERIFIED: Native permission UI unavailable |
| C01-07 | Location check failed | /location | Location | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| A01-01 | Sign in or create an account | Global login slider (not /login) | LoginSlider | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| A01-02 | Verify your email code | Global login slider (not /login) | LoginSlider | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| A01-03 | Incorrect verification code | Global login slider (not /login) | LoginSlider | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| A01-04 | Verification code expired | Global login slider (not /login) | LoginSlider | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| A01-05 | Too many code requests | Global login slider (not /login) | LoginSlider | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| A01-06 | Signed in; profile unavailable | Global login slider (not /login) | LoginSlider | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| A01-07 | Sign-in completed | Global login slider (not /login) | LoginSlider | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| S00-01 | Browse all customer destinations | Global UI overlays | Global overlays | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| S00-02 | Change delivery location | Global UI overlays | Global overlays | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| S00-03 | Mini basket | Global UI overlays | Global overlays | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| S00-04 | Switch stores? | Global UI overlays | Global overlays | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| S00-05 | Keep saved or guest basket? | Global UI overlays | Global overlays | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| S00-06 | Guest merge partially completed | Global UI overlays | Global overlays | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| S00-07 | Leave unsaved changes? | Global UI overlays | Global overlays | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| S00-08 | Change delivery area? | Global UI overlays | Global overlays | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C03-01 | Everyday, in every aisle | /categories?category=<key> | Categories | Reviewed; real catalog data differences | Reviewed; real catalog data differences | Reviewed; real catalog data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C03-02 | Selected category and subcategories | /categories?category=<key> | Categories | Reviewed; real catalog data differences | Reviewed; real catalog data differences | Reviewed; real catalog data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C03-03 | No products match these filters | /categories?category=<key> | Categories | Reviewed; real catalog data differences | Reviewed; real catalog data differences | Reviewed; real catalog data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C04-01 | Fresh fruit & vegetables | /category/:id | Category (Categories) | Reviewed; real API catalog differences | Reviewed; real API catalog differences | Reviewed; real API catalog differences | BROWSER VERIFIED; documented real-data/provider differences |
| C04-02 | Category sorted by price | /category/:id | Category (Categories) | Reviewed; real API catalog differences | Reviewed; real API catalog differences | Reviewed; real API catalog differences | BROWSER VERIFIED; documented real-data/provider differences |
| C04-03 | This category is empty nearby | /category/:id | Category (Categories) | Reviewed; real API catalog differences | Reviewed; real API catalog differences | Reviewed; real API catalog differences | BROWSER VERIFIED; documented real-data/provider differences |
| C05-01 | Good stores. Just around the corner. | /stores?category=<key> | Stores | Reviewed; real API catalog differences | Reviewed; real API catalog differences | Reviewed; real API catalog differences | BROWSER VERIFIED; documented real-data/provider differences |
| C05-02 | Stores filtered by category | /stores?category=<key> | Stores | Reviewed; real API catalog differences | Reviewed; real API catalog differences | Reviewed; real API catalog differences | BROWSER VERIFIED; documented real-data/provider differences |
| C05-03 | More nearby stores | /stores?category=<key> | Stores | Reviewed; real API catalog differences | Reviewed; real API catalog differences | Reviewed; real API catalog differences | BROWSER VERIFIED; documented real-data/provider differences |
| C05-04 | No nearby stores match | /stores?category=<key> | Stores | Reviewed; real API catalog differences | Reviewed; real API catalog differences | Reviewed; real API catalog differences | BROWSER VERIFIED; documented real-data/provider differences |
| C05-05 | Store list failed to load | /stores?category=<key> | Stores | Reviewed; real API catalog differences | Reviewed; real API catalog differences | Reviewed; real API catalog differences | BROWSER VERIFIED; documented real-data/provider differences |
| C06-01 | Find your next everyday favourite | /explore; /explore/:categoryId | Search | Reviewed; real search data differences | Reviewed; real search data differences | Reviewed; real search data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C06-02 | Mixed search results | /explore; /explore/:categoryId | Search | Reviewed; real search data differences | Reviewed; real search data differences | Reviewed; real search data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C06-03 | Product search results | /explore; /explore/:categoryId | Search | Reviewed; real search data differences | Reviewed; real search data differences | Reviewed; real search data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C06-04 | Store search results | /explore; /explore/:categoryId | Search | Reviewed; real search data differences | Reviewed; real search data differences | Reviewed; real search data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C06-05 | Category search results | /explore; /explore/:categoryId | Search | Reviewed; real search data differences | Reviewed; real search data differences | Reviewed; real search data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C06-06 | No search results | /explore; /explore/:categoryId | Search | Reviewed; real search data differences | Reviewed; real search data differences | Reviewed; real search data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C06-07 | Search could not complete | /explore; /explore/:categoryId | Search | Reviewed; real search data differences | Reviewed; real search data differences | Reviewed; real search data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C06-08 | Filter and sort | /explore; /explore/:categoryId | Search | Reviewed; real search data differences | Reviewed; real search data differences | Reviewed; real search data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C07-01 | The Green Basket storefront | /store/:id?q=<query> | StoreDetail | Reviewed; real storefront data differences | Reviewed; real storefront data differences | Reviewed; real storefront data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C07-02 | Search inside a store | /store/:id?q=<query> | StoreDetail | Reviewed; real storefront data differences | Reviewed; real storefront data differences | Reviewed; real storefront data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C07-03 | Store is closed | /store/:id?q=<query> | StoreDetail | Reviewed; real storefront data differences | Reviewed; real storefront data differences | Reviewed; real storefront data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C07-04 | Store has paused new orders | /store/:id?q=<query> | StoreDetail | Reviewed; real storefront data differences | Reviewed; real storefront data differences | Reviewed; real storefront data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C07-05 | Store cannot deliver here | /store/:id?q=<query> | StoreDetail | Reviewed; real storefront data differences | Reviewed; real storefront data differences | Reviewed; real storefront data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C08-01 | Product, with the useful details | /product/:id | ProductDetail | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C08-02 | Only a few left | /product/:id | ProductDetail | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C08-03 | Product out of stock | /product/:id | ProductDetail | BLOCKED / UNVERIFIED: Public zero-stock product detail returns 404 | BLOCKED / UNVERIFIED: Public zero-stock product detail returns 404 | BLOCKED / UNVERIFIED: Public zero-stock product detail returns 404 | BLOCKED / UNVERIFIED: Public zero-stock product detail returns 404 |
| C08-04 | Ingredients, storage and product details | /product/:id | ProductDetail | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C08-05 | Product image viewer | /product/:id | ProductDetail | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C08-06 | Adding to basket failed | /product/:id | ProductDetail | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C09-01 | Your everyday basket | /cart | Cart | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C09-02 | Guest basket | /cart | Cart | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C09-03 | An empty basket | /cart | Cart | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C09-04 | Below the store minimum | /cart | Cart | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C09-05 | Stock changed in your basket | /cart | Cart | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C09-06 | Coupon is not eligible | /cart | Cart | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C09-07 | Basket totals are unavailable | /cart | Cart | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C09-08 | Choose a coupon | /cart | Cart | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-01 | 1. Where should we deliver? | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-02 | 2. Now or a little later? | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-03 | 3. Choose how to pay | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-04 | 4. One last look | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-05 | Checking the current delivery quote | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-06 | We could not confirm the total | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-07 | Delivery fee changed | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-08 | No delivery slots available | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-09 | Checkout sign-in required | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-10 | Opening secure payment | /checkout | Checkout | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable |
| C10-11 | Payment was cancelled | /checkout | Checkout | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable |
| C10-12 | Payment was declined | /checkout | Checkout | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable |
| C10-13 | Secure payment did not load | /checkout | Checkout | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable |
| C10-14 | Payment received; confirming order | /checkout | Checkout | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable |
| C10-15 | Payment result needs checking | /checkout | Checkout | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable | BLOCKED / UNVERIFIED: Online sandbox payment credentials unavailable |
| C10-16 | Pay at delivery with UPI | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-17 | Order was not placed; retry available | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C10-18 | Selected address cannot be used | /checkout | Checkout | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-01 | Every order, in one place | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-02 | Active orders | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-03 | Delivered orders | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-04 | Cancelled and refunded orders | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-05 | No orders yet | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-06 | Order history unavailable | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-07 | Older order history | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-08 | Order history sign-in required | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C11-09 | Review changes before reordering | /orders | Orders | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C12-01 | Your order is in | /order-confirmed/:id | OrderConfirmed | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C12-02 | Loading order confirmation | /order-confirmed/:id | OrderConfirmed | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C12-03 | Confirmation could not load | /order-confirmed/:id | OrderConfirmed | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C13-01 | Placed; waiting for the store | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-02 | The store accepted your order | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-03 | Your order is being prepared | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-04 | Ready; no partner assigned yet | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-05 | Finding a delivery partner | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-06 | Partner assigned; pickup pending | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-07 | A little closer to your door | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-08 | Driver location is out of date | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-09 | Tracking connection interrupted | /tracking/:id | Tracking | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C13-10 | Order cancelled | /tracking/:id | Tracking | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C13-11 | Order refunded | /tracking/:id | Tracking | BLOCKED / UNVERIFIED: Verified online payment/refund unavailable | BLOCKED / UNVERIFIED: Verified online payment/refund unavailable | BLOCKED / UNVERIFIED: Verified online payment/refund unavailable | BLOCKED / UNVERIFIED: Verified online payment/refund unavailable |
| C13-12 | Order not found | /tracking/:id | Tracking | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C13-13 | This order is not accessible | /tracking/:id | Tracking | BLOCKED / UNVERIFIED: Private foreign order returns 404 | BLOCKED / UNVERIFIED: Private foreign order returns 404 | BLOCKED / UNVERIFIED: Private foreign order returns 404 | BLOCKED / UNVERIFIED: Private foreign order returns 404 |
| C13-14 | Cancel an eligible order | /tracking/:id | Tracking | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C13-15 | Cancellation no longer available | /tracking/:id | Tracking | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C14-01 | Delivered, with care | /order-finished/:id | OrderFinished | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C14-02 | How was your order? | /order-finished/:id | OrderFinished | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C14-03 | Thanks for sharing your feedback | /order-finished/:id | OrderFinished | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C14-04 | This order has already been rated | /order-finished/:id | OrderFinished | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C14-05 | Receipt could not be downloaded | /order-finished/:id | OrderFinished | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C14-06 | Rating was not saved | /order-finished/:id | OrderFinished | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C14-07 | Receipt preview and download handoff | /order-finished/:id | OrderFinished | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C15-01 | Your little corner of Nextou | /account | Profile / EditModal | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C15-02 | A home for your everyday | /account | Profile / EditModal | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C15-03 | Edit your profile | /account | Profile / EditModal | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C15-04 | Profile update failed | /account | Profile / EditModal | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C15-05 | Sign out of this device? | /account | Profile / EditModal | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C16-01 | Places you call yours | /addresses; ?add=1 | Addresses | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C16-02 | Add a delivery address | /addresses; ?add=1 | Addresses | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C16-03 | Edit a saved address | /addresses; ?add=1 | Addresses | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C16-04 | Address validation errors | /addresses; ?add=1 | Addresses | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | Reviewed; Maps rendering blocked | BROWSER VERIFIED; documented real-data/provider differences |
| C16-05 | Delete this address? | /addresses; ?add=1 | Addresses | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C16-06 | Default address was not changed | /addresses; ?add=1 | Addresses | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C16-07 | No saved addresses | /addresses; ?add=1 | Addresses | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C16-08 | Addresses sign-in required | /addresses; ?add=1 | Addresses | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C17-01 | The latest, just for you | /notifications | Notifications | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | BROWSER VERIFIED; documented real-data/provider differences |
| C17-02 | All caught up | /notifications | Notifications | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | BROWSER VERIFIED; documented real-data/provider differences |
| C17-03 | No notifications yet | /notifications | Notifications | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | BROWSER VERIFIED; documented real-data/provider differences |
| C17-04 | Notifications could not load | /notifications | Notifications | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | BROWSER VERIFIED; documented real-data/provider differences |
| C17-05 | Notifications sign-in required | /notifications | Notifications | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| C17-06 | Earlier notifications | /notifications | Notifications | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | BROWSER VERIFIED; documented real-data/provider differences |
| C17-07 | Read status could not be saved | /notifications | Notifications | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | Reviewed; real-data and retained filter differences | BROWSER VERIFIED; documented real-data/provider differences |
| C18-01 | Your privacy, clearly explained | /privacy-policy | PrivacyPolicy | Reviewed; existing policy content retained | Reviewed; existing policy content retained | Reviewed; existing policy content retained | BROWSER VERIFIED; documented real-data/provider differences |
| U01-01 | This feature is temporarily unavailable | /feature-unavailable and shared fallbacks | FeatureUnavailable / NotFound / shell | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| U01-02 | A short pause for maintenance | /feature-unavailable and shared fallbacks | FeatureUnavailable / NotFound / shell | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| U01-03 | You are offline | /feature-unavailable and shared fallbacks | FeatureUnavailable / NotFound / shell | BLOCKED / UNVERIFIED: Offline emulation unavailable | BLOCKED / UNVERIFIED: Offline emulation unavailable | BLOCKED / UNVERIFIED: Offline emulation unavailable | BLOCKED / UNVERIFIED: Offline emulation unavailable |
| U01-04 | We could not find that page | /feature-unavailable and shared fallbacks | FeatureUnavailable / NotFound / shell | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| U01-05 | You do not have access | /feature-unavailable and shared fallbacks | FeatureUnavailable / NotFound / shell | BLOCKED / UNVERIFIED: Explicit forbidden state unavailable through current guard contract | BLOCKED / UNVERIFIED: Explicit forbidden state unavailable through current guard contract | BLOCKED / UNVERIFIED: Explicit forbidden state unavailable through current guard contract | BLOCKED / UNVERIFIED: Explicit forbidden state unavailable through current guard contract |
| U01-06 | Your session needs attention | /feature-unavailable and shared fallbacks | FeatureUnavailable / NotFound / shell | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| U01-07 | Getting your neighbourhood ready | /feature-unavailable and shared fallbacks | FeatureUnavailable / NotFound / shell | Reviewed; real-data differences | Reviewed; real-data differences | Reviewed; real-data differences | BROWSER VERIFIED; documented real-data/provider differences |
| P01-01 | Help that stays with your order | /help, /issues, /order/:id/issue, /issue/:issueId | Support | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | BROWSER VERIFIED; documented real-data/provider differences |
| P01-02 | Tell us what happened | /help, /issues, /order/:id/issue, /issue/:issueId | Support | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | BROWSER VERIFIED; documented real-data/provider differences |
| P01-03 | Your issue has been recorded | /help, /issues, /order/:id/issue, /issue/:issueId | Support | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | BROWSER VERIFIED; documented real-data/provider differences |
| P01-04 | Your support requests | /help, /issues, /order/:id/issue, /issue/:issueId | Support | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | BROWSER VERIFIED; documented real-data/provider differences |
| P01-05 | Order issue and conversation | /help, /issues, /order/:id/issue, /issue/:issueId | Support | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | BROWSER VERIFIED; documented real-data/provider differences |
| P01-06 | Issue could not be sent | /help, /issues, /order/:id/issue, /issue/:issueId | Support | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | Reviewed; confirmed backend support contracts | BROWSER VERIFIED; documented real-data/provider differences |

## B. Differences corrected and verification

| Scope | Problem / cause | Correction and files | Verification / remaining difference |
|---|---|---|---|
| Shell, S00 | Local layout overrides, modal/footer drift, missing phone basket assist; outer wrapper constrained the ribbon at 1920px | app.component.*, everyday.scss, styles.scss, shared/topbar, nx-modal-shell, mini-cart: reference geometry, full-width ribbon, shared drawer/center variants and subtotal assist | Primary overlay reviews; five extra widths reviewed. Real session/cart state retained |
| A01 | Footer form submission, OTP cooldown/expired/rate-limit handling and completion dialog differed | login-slider, auth.service, backend accounts actions/data/views: explicit actions, actual error contracts, countdown, completed-session dialog | Seven primary states reviewed; settled sign-in references recaptured at five extra widths |
| C01/C16 | Invented coordinates, map-first layout, collapsing failed map frame and ambiguous errors | location, addresses, shared MapPicker: saved/selected coordinates, reference frame, distinct pending/error/unavailable and focus restoration | Saved address and real serviceability/retry verified; authorized Maps and native permission remain unverified |
| C02 | Product host selectors collapsed phone cards; aggregate loading and unavailable artwork differed | home.*, catalog.service: corrected card selector, wrap-row, loading caption/art and request guards | Actual loading, partial503/retry and unavailable states; 12 primary reviews and five extra widths |
| C03–C06 | Sidebar/search/grid drift, ignored filters, stale Home responses overwriting search | discovery pages, catalog.service; backend repositories: reference grids, real URL filters/sort/pagination and separate canonical/search collections | Child selection, real empty results, 14-store pagination,503/retry and tabs; primary and extra reviews |
| C07 | Closed/paused detail disappeared after Home refresh; availability priority and icon differed | store-detail.*, catalog.service: separate public products, closure/intake priority and reference information notice | 15 primary reviews; ten catalog regression scenarios. One 1920px settled capture remains unverified |
| C08 | Gallery/accordion geometry and currency drift; summary response lost product details | product-detail.*, customer-currency/icon, catalog.service: reference stages, raw-detail merge and guarded failure/retry | Actual Add/retry and primary/extra reviews; zero-stock detail404 cannot show proposed unavailable-product presentation |
| C09 | Quantity/suggestion/summary placement; duplicate minimum warning; missing stock/coupon recovery | cart.*, basket-items/summary, customer-page-header: reference columns, warning icons, actual available-quantity PATCH and coupon drawer | Real minimum500/subtotal420, stock3→2 recovery, coupon Applied440, quote503/retry; fixtures restored |
| S00 reconciliation | Plain saved-cart confirmation, partial sync lacked item acknowledgments; area cancel retained wrong location | ui.service, confirm-dialog, app-state.service: actual saved summaries, guarded retry and rollback | Keep saved/Use guest, partial stock retry without duplicated lines, conflict cancellation/restoration verified |
| C10 | Step/address/schedule geometry, fake pending fee, native checkbox defaults cancelled by backdrop handler | checkout.*, app-state, basket-summary, nx-modal-shell: actual quote required, pending address preview, void backdrop handler and explicit COD acknowledgment | Address cancel/accept, no slots, stale/failed quote, stock rejection before creation, Review recovery; online provider blocked |
| C11/C12 | Order grid, reorder and confirmation differed; owned confirmation500 | orders, order-confirmed; backend customer-flow actions/data: real history/search/reorder and saved confirmation | Persisted COD orders, lost-response recovery without duplicate and primary/extra reviews |
| C13 | Tracking columns drift; denied cached order retained private fields | tracking, OrderService: journey layout, explicit refresh retry, denied access clears caches and session guards | 39 primary reviews; five order-service regressions. Maps, verified refund and foreign private404 limitations retained |
| C14 | Inline feedback, failed-submit focus and receipt recovery differed | order-finished, customer-receipt; backend invoice actions/data: drawer, draft preservation, single-save guard, real PDF handoff | Real rating503→retry, persisted store4/5; receipt503→retry200, one-page historical270 PDF. QA rating fixtures restored |
| C15 | Profile error inside form grid, false success toast, disabled retry focus | account/profile presentation: reference error position/icon, truthful sign-out strip and enabled Save focus | Actual503→Enter retry200; original profile retained, primary/extra reviews |
| C17/C18 | Notification warning/pagination and privacy content needed accurate rendering | notifications, privacy: warning icon, actual list/actions, existing filters and six real policy sections retained | 26-record pagination, mark-all503/retry, empty/read-error; restored four notifications/three unread. Prototype legal placeholders omitted |
| P01 | Form columns/context/warning and failed issue-message focus; denied cached issue leaked controls | support pages/service: single-column form, store context, enabled draft retry and cache clearing | Real issue/message/PNG201, reload and attachment hash; private404 clears data. Original two issues retained |

Detailed functional evidence, fixture changes and capture notes are retained in the verification journal and screenshot ledgers. Real inventory, counts, prices, policy text, distances and existing controls may differ from illustrative prototype content; these differences are documented rather than replaced with invented data.

## C. Dummy-data audit and authoritative sources

Scoped production audit found no mock customer/catalog/order/payment arrays. Removed default customer coordinates, invented pack/Express labels, unused free-delivery fallback and false success/empty-state behavior. Static approved illustration and icons are editorial assets. QA records remain in the isolated database only.

| UI data | Authoritative source | Verified behavior |
|---|---|---|
| Authentication/profile/addresses | Existing auth/profile/address APIs and session signals | OTP, persisted profile/address, default selection and recovery |
| Products/stores/categories/offers | Catalog/Home/vendor APIs with session/location/request guards | Live records, sort/filter/pagination; no fictional promotions copied |
| Cart/fees/coupons | Cart, checkout-preview, available-coupon and validation APIs | Persisted quantities, confirmed server totals, explicit unavailable quote |
| Orders/tracking/ratings/receipts | Owned order, tracking, feedback and invoice APIs | Real lifecycle/history, privacy denial, saved feedback and PDF |
| Notifications/support | Notification and support issue/message/attachment APIs | Real pagination/actions, persisted requests and guarded drafts |

## D. Functionality and builds

- Customer production build passed on 11 October, 07:10:50.575Z: 626.70kB, estimated transfer171.72kB.
- Customer mobile build passed on 11 October, 07:11:25.561Z: 626.72kB, estimated transfer171.75kB.
- Ten CatalogService response-order/reset regressions and five OrderService failure/session regressions passed. Earlier 23 Django regression checks passed and remain applicable; production backend source was unchanged during this final continuation.
- Vendor, delivery and admin production builds passed. Existing vendor/admin bundle warnings remain; admin also reports missing D:/fonts/icons.css.
- Actual browser checks cover OTP/session recovery, profile/addresses, cart reconciliation, stock/minimum/coupon recovery, checkout/COD acknowledgment, lost-order-response recovery, history/cancellation, tracking denial, rating/receipt, notifications and support. These are specific verified contracts, not evidence of online payment success.

Final isolated QA audit passed: three Apples and one Banana, subtotal420, four orders, Home default, original addresses/stock, and no checkout fixtures/API fault switches. Additional snapshot/delay/fault marker scan returned empty. Baseline payable450 comprises subtotal420 and delivery30 with no coupon. The original delivered order retains store4/5 feedback; temporary delivery feedback was restored. COD remains payment-unverified.

The isolated preview used ports4300/8100/8765 and a named copied SQLite database with local file-email/in-memory Channels. Agent-owned preview processes were stopped after browser/control timeouts during final reporting. User Docker services on4200/8000 were preserved. No production order/payment was mutated.

## E. Responsive evidence and acceptance

Primary review: **411/450**, representing 137 reachable states at all three required primary sizes. The 13 remaining states account for39 comparisons. All450 reference captures exist.

Additional sweep: **109/110** reviewed pairs across22 representative screen families at360/768/1024/1366/1920px. This does not mean every150 state was tested at five extra widths. All110 captures exist; 0 extra actual captures report horizontal overflow in saved geometry. Current reviewed pairs show no significant clipping or overlap. Maps/manual controls, real policy content and real server counts retain documented differences.

Pending additional acceptance: C07-01 / extra-1920.
The remaining storefront1920 image shows a refresh notice. Browser automation repeatedly timed out and reset its kernel while attempting a settled replacement; that image is not accepted as the default-state comparison.

| Representative state | 360 | 768 | 1024 | 1366 | 1920 |
|---|---|---|---|---|---|
| C15-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| U01-04 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C03-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C04-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C05-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C06-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C07-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | UNVERIFIED: settled replacement pending |
| C08-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C09-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C10-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C11-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C12-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C13-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C14-04 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C16-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C17-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C18-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C01-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| P01-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| A01-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| C02-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |
| S00-01 | REVIEWED | REVIEWED | REVIEWED | REVIEWED | REVIEWED |

Evidence: [primary ledger](../artifacts/customer-ui-parity/visual-review-ledger.json), [extra ledger](../artifacts/customer-ui-parity/extra-visual-review-ledger.json), [actual captures](../artifacts/customer-ui-parity/actual-captures.json), [extra captures](../artifacts/customer-ui-parity/extra-actual-captures.json). Ledger reviews count only while both original screenshot hashes still match.

## F. Provider and API limitations

| State IDs | Blocker / consequence |
|---|---|
| C01-02 | Google Maps localhost authorization |
| C01-06 | Native permission UI unavailable |
| C08-03 | Public zero-stock product detail returns 404 |
| C10-10 | Online sandbox payment credentials unavailable |
| C10-11 | Online sandbox payment credentials unavailable |
| C10-12 | Online sandbox payment credentials unavailable |
| C10-13 | Online sandbox payment credentials unavailable |
| C10-14 | Online sandbox payment credentials unavailable |
| C10-15 | Online sandbox payment credentials unavailable |
| C13-11 | Verified online payment/refund unavailable |
| C13-13 | Private foreign order returns 404 |
| U01-03 | Offline emulation unavailable |
| U01-05 | Explicit forbidden state unavailable through current guard contract |

Google Maps previously returned RefererNotAllowedMapError for localhost; a drawn placeholder cannot verify pin/search/geocoding. Online provider success/cancellation/decline/unknown/refund requires sandbox credentials. Native keyboard/permission behavior is not exposed by this browser host. Privacy-preserving404 contracts remain enforced; they are not weakened to imitate a forbidden/private prototype. The current browser control timeout also blocks the one settled recapture in E.

Owned receipt PDF bytes and a rendered page were verified against historical items/delivery/total270. IAB embedded PDF rendering is unavailable; the drawer uses a real saved order summary and verified download. Unsupported provider states and fictional support replies remain accurately gated.

## G. Cleanup and integration

Removed51 obsolete customer mobile presentation files in the prior migration and three unused order-summary component files after reference checks. Removed superseded customer CSS overrides and unused fallback helpers; retained phone navigation, authentication, routing, actual APIs, payment recovery and WebSocket domain services. Existing Angular21.2 was preserved. Shared map defaults remain compatible with other portals.

Named minimum/stock/coupon/area/holiday/store-lifecycle/address/rating/notification/support fixtures and API delay/failure policies were restored or removed. The final QA baseline audit passed. Extra feedback capture metadata is corrected to the restored original store4/5 rating. Unrelated repository changes are preserved. Backend/frontend remain separate submodules; no commit, push or deployment occurred.

## H. Final status

- IMPLEMENTED: customer presentation rebuild and the real API recovery/session/privacy corrections described in B–D.
- BROWSER VERIFIED: 411 current primary comparisons,109 extra-width comparisons, and the specific functional contracts in D.
- BLOCKED / UNVERIFIED:39 primary comparisons across13 states in F, plus the storefront1920 settled recapture in E.
- UNRESOLVED DIFFERENCE: unavailable provider rendering, current API-contract differences and the one unsettled capture. Full application parity is not claimed complete.
