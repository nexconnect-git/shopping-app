# Vendor implementation coverage

Updated 3 October 2026. Read the [implementation report](vendor-app-implementation-report.md) for current page designs, components, APIs, backend changes and evidence. The [original plan](vendor-app-redesign-plan.md) and [baseline reference](vendor-app-complete-reference.md) are preimplementation snapshots.

## Current screenshot-led third-pass acceptance

The implementation report's **Screenshot-led third-pass corrections and evidence** section is authoritative for the latest work. Earlier tables and second-pass checks remain history, with their stated limits. The [third-pass evidence folder](vendor-qa/screenshot-pass/) contains actual screenshots, route/viewport observations, sanitized HTTP access evidence and cold-restart results.

| Area | Implemented | Browser verified in this pass | Blocked/unverified |
| --- | --- | --- | --- |
| Editor/create | Normal-flow footer; Save changes vs clean Submit; consistent grids; nonempty error styling; associated field/delivery errors | Neutral loaded form, invalid stock, delivery-checkbox focus at390/1440, real draft/save/submit, pending-review operational pricing, phone failed-save preservation/retry/reload, dirty Stay/discard | All image-write failures, every stored-invalid-data permutation, actual mobile keyboard/zoom |
| Navigation/toolbars | 22px icons, consistent grid, corrected Finance/History grouping; one toolbar with inset icon and48px adjacent controls | All14 label startsx58;18 operational routes×6 widths; short390×480 scroll/focus, Escape/restoration/inert drawer | Screen reader and font outage |
| Inventory | Bounded aligned stock controls, explicit SKU, primary server reason; contextual multi-page edits | Invalid/successful quantity, pause/resume, fresh stock21, unchanged-disabled Save,21→22 retained on page2 and discarded | Complete mixed successful/failed bulk UI and concurrency matrix not rerun |
| Catalog | Compact one-item history, content-driven multi-item expansion, true mixed outcomes, exact approved catalog UUID | Approved203px desktop card, one badge; long-reason phone expansion,22-record paging, actual follow-up and variant; blank dialog focus | Every approval/outcome permutation |
| Operating/settings | Server effective code/label/reason and one presenter; readable phone/email grid; true timezone | Receiving/paused/closed/outside-hours,22–06 save/reload, real API outage/stale recovery; paused state after restart | All blocked operating reasons in authenticated operational shell; production timezone configuration |
| Access/onboarding | Adjacent touched feedback and accessible descriptions |24 public width observations;12 pending-details/forced-security observations; actual guard redirects and blank-field validation | Human new-password/register/reset submission; all onboarding corrections/docs rerun |
| Orders/inbox | Existing shared stores/actions/socket retained | New backend order arrived without reload; real mark-ready, driver search/cancel, terminal rejection across sessions; connected after restart; mark-all-read agreement/reload;18px unread checkbox desktop/phone | Complete ordering/duplicate/stale-action event matrix and provider GPS/routes |
| Finance/growth/support/reviews | Existing controls/contracts retained; toolbar/singular wording repairs | All pages revisited six widths; analytics1order; named previous-pass financial evidence retained separately | Every mutation rerun, actual downloaded PDF/CSV open, synthetic ledger reconciliation |
| Shared consumers | Nonempty field-error selector only; vendor geometry remains vendor-scoped | Customer OTP, delivery profile, admin setup neutral fields; actual390px captures and production builds | Full cross-portal workflows; admin touched blank email still lacks adjacent explanation |

Counts:108 base operational layout observations+2 settled follow-ups;24 public+12 security/pending observations;11 source aliases+unknown route with settled follow-ups;14 critical cold desktop/phone observations+3 settled follow-ups. Counts are **not action passes**. Final third-pass vendor build633.18kB and focused lint0errors/warnings;100existing backend and8auth regressions pass. Four apps build; existing admin budget/icon warnings remain.

Only owned QA services were restarted. Temporary companion preview servers were stopped after inspection; the vendor/API QA preview and named data remain reviewable. No production mutation, credential change, commit, push or deploy. See the report for exact fixture IDs, human handoff and release gates.

## Second-pass acceptance (historical where superseded)

The tables below preserve earlier mapping and acceptance. Their verification counts and unresolved concurrency/outage statements describe that pass. Latest screenshot-led results appear above; all24 destinations, the utility, aliases and explicit per-action limits remain documented.

- **Implemented:** four live groups, progressive editors/settings/finance, cross-page stock conflict handling, consistent shell and focus-safe dialogs, guarded historical deletion, temporary product-load retry, catalog notification destination, actor-neutral cancellation notices, persisted GPS time and cross-tab session renewal/outage recovery.
- **Browser verified:** named mutation/reload journeys in the [37-entry correction ledger](vendor-qa/second-pass/coverage.json),108 operating width checks,24 public-auth and12 security/pending checks,14 dialog patterns,24 region-failure checks,13 aliases and36 cold-restart operating-route observations. Counted render observations are not action passes.
- **API verified:**129actually granted catalog items and38products; redacted [HTTP evidence](vendor-qa/second-pass/http-evidence.jsonl); actual overlapping order/payout [HTTP sessions](vendor-qa/second-pass/concurrency.jsonl); independent finance/sales failure and recovery; coupon cap/usage/expiry/per-user validation; real worker/event/tracking flows.
- **Supplementary checks:** all four production builds pass;100backend tests in46.476s;8auth tests; focused lint0errors/10sharedauthwarnings; Django check0issues; migration no drift. Admin budget/icon warnings remain.
- **Blocked/unverified:** human new-password/registration/reset submission; receipt/settlement/CSV browser save/open; authorized Maps and staging mail/push; actual200%zoom/screen reader/font failure; simultaneous two-browser stale-action presentation; specified zero-data/failed-write/event permutations. Authenticated admin/customer cross-portal acceptance remains limited. The report distinguishes each gap.

Temporary observer, outage controls, helpers, upload image and raw capture were removed. Named QA fixture data and maintained setup remain. Cold API/worker/scheduler/frontend restart and fresh stock/preparation/tracking/navigation checks followed cleanup. No commit, push or deployment.

**Implemented** means the source correction is present. Browser and regression evidence are separate; neither certifies deployment or provider configuration. Existing unrelated work was preserved.

## Original audit corrections

| Finding | Implemented correction | Evidence and limits |
| --- | --- | --- |
| V01 public privacy | Public DTO whitelist, owner/private split, writable whitelist, cache version | Public privacy and ownership regressions pass |
| V02 lane precedence | Terminal/order status precedes assignment state | Live browser excludes delivered/cancelled; real pickup moves to dispatched |
| V03 order freshness | Shared versioned snapshots, committed events, reconnect/visible polling | New order and driver acceptance appear without reload; Redis recovery exercised |
| V04 complete inventory | Server paging/filtering and whole-scope metrics | Multi-page browser inventory; filtered metadata tests |
| V05 stock validation | Strict integers, changed-row saves, partial duplicate/foreign/invalid errors | Backend partial-failure/range tests; browser persistence |
| V06 operating policy | Locked validated commands; broad profile overrides prohibited | Policy/pending/forced-security tests; pending route redirects |
| V07 inventory readiness | Real review timestamp and freshness validation | Stale-snapshot test; server blockers render |
| V08 financial scope | Server complete aggregates independent of pages/period filters | Multi-page finance browser; summary regression |
| V09 payout races | Locks, allowed transitions, audit, reasons and source amounts | Ownership/replay/lifecycle tests; simultaneous browser race remains acceptance |
| V10 pending actions | Per-record pending/errors and dedicated bulk state | Replay tests; real queue failure with retry and visible error |
| V11 polling | Visibility, overlap and stale-session/filter protection | Live fallback and auth tests; full timing matrix not claimed |
| V12 prep state/time | Account/order local persistence, reactive clock, shared record | SQLite checklist reload; PG current order inspection |
| V13 action consistency | Shared server eligibility and pickup conditions | Real acceptance/OTP/pickup; local checklist explicitly advisory |
| V14 detail/tracking | Persistent errors, reconnect, GPS age, map/text fallback | Real Redis tracking/staleness; map authorization fallback |
| V15 onboarding correction | Restricted details/documents/contact and recheck | Actual details save/upload/history; rejected controls restricted |
| V16 launch readiness | Real masked bank/verification context | Dashboard/settings show authoritative blockers |
| V17 timezone | Business-local forms and UTC API timestamps | Coupon validation/timezone tests; browser dialog inspection |
| V18 campaign/ledger semantics | Server coupon counts; real Transactions; failure/decline distinction | Multi-page ledger/finance/promotions; lifecycle tests |
| V19 inbox | Paged shared account-scoped unread/preview state | Mark-read synchronizes shell/inbox; entity navigation and compatibility test |
| V20 hours/location | Overnight, nullable/zero coordinates and explicit location failures | 22–06 and 0,0 save/reload; validation tests |
| V21 publication/drafts | Real blockers, granted paged chooser/resume, dirty guard | Cross-page selection/resume; image outcome and pending lock |
| V22 submission | Persisted private notes, per-variant outcomes, atomic replayable draft batch | Batch/note/privacy/pending-lock tests |
| V23 identity/return | 150-character identities, internal return, recovery/security | Long login/return verified; credential submit requires human |
| V24 accessibility | Semantic controls, keyboard/focus modal, persistent feedback | Vendor lint 0/0; Tab/Escape checked; screen reader/zoom remain acceptance |
| V25 design conflicts | Vendor-only primitives and responsive local pages | 18 workspace routes at six widths with no settled page overflow |
| V26 failure states | Explicit errors/empty states; independent analytics regions | Redis/Maps outages exercised; selective analytics outage not browser-injected |
| V27 boundary/cleanup | Typed workspace contracts, separate forms, 12 legacy files removed, aliases | Build/import/lint pass; old VendorApi compatibility wrapper retained |
| V28 bounded operations | Active bounded feed, authoritative scope, eager reads and corrected joins | Terminal/count/multi-image tests; no production load benchmark claimed |
| Additional search | Actual backend search/filter fields | SKU browser query and ownership/search tests |
| Additional unsupported shipping | Removed unsupported mappings; validated supported delivery fields | Draft/product validation; extended fulfillment contracts deferred |
| Additional transport | JSON-safe UUIDs, fresh after-commit snapshots | Real Redis browser events and transport regression |
| Additional dispatch | Durable failed enqueue and finite maximum-radius search | Stopped isolated Redis journey; exhaustion test |
| Additional images | Atomic upload/source policy and owned primary/removal | Actual upload/pending UI; source/primary/removal regressions |

All rows above are **implemented**. Provider or acceptance limits are not represented as pending source work.

## Route coverage

All pages below have implemented designs, supported contracts and actual browser rendering. Inspecting a page does not mean every mutation was submitted through the browser.

| Route | Browser evidence | Additional evidence or limit |
| --- | --- | --- |
| `/login` | Long username, successful login, protected return | Auth/security tests |
| `/register` | Four stages, validation, phone | New credential/account submission requires human |
| `/change-password` | Forced and voluntary form | Renewal/revocation tests; no new browser credential |
| `/pending-approval` | Details save, document upload/history, rejected/pending gates | Permission tests, phone |
| `/` | Actual readiness/store state/operations | Six widths |
| `/live-orders` | Real events/search/cancel/retry/pickup/Redis recovery | Six widths, terminal regressions |
| `/inventory` | Complete paged counters, dirty navigation/persistence | Six widths, validation tests |
| `/products` | Search/global metadata/reasons/edit links | Six widths, scope/growth tests |
| `/products/new` | Paged selection and saved/resumed variants | Six widths, replay/submission/note tests |
| `/products/:id/edit` | Uploaded image, pending lock, actual blockers | Six widths, image/source tests |
| `/catalog-requests` | Supported proposal form/history | Six widths; browser proposal creation not submitted |
| `/orders` | Current search/date/status/paging surface | Six widths, order regressions |
| `/orders/:id/prep` | Local checklist/reload/current Ready state | Six widths, shared actions |
| `/orders/:id` | Acceptance/OTP/pickup/live GPS/stale/fallback | Six widths; PDF API passes, IAB file saving unconfirmed |
| `/analytics` | Real period sales and all-time finance | Six widths; selective browser endpoint outage untested |
| `/payouts` | Totals/pages/status/reasons | Six widths; transition/statement tests, no financial UI action |
| `/promotions` | Multi-page lifecycle and keyboard dialog | Six widths; timezone/reactivation tests |
| `/support` | Paged response/detail and persisted isolated ticket | Six widths |
| `/reviews` | Complete distribution and second page | Six widths; metadata tests |
| `/notifications` | Shared mark-read count/entity destinations | Six widths; paging/compatibility tests |
| `/store-settings` | Unsaved Stay, overnight and 0,0 persistence | Six widths; policy tests |
| `/transactions` | Real credit/debit/source/balance records | Six widths; owner ledger test |
| `/forgot-password` | Real generic request success | Locmem QA mail, no provider delivery |
| `/reset-password` | Missing-token recovery | Backend security tests; new credential needs human |
| `/feature-unavailable` | Existing guarded shared utility retained | Feature-toggle permutations not newly exercised |

Aliases remain for profile, stock-management, wallet, sales-report, payments, coupons, product health, old product edit/order/tracking paths and store/settings. Twelve unrouted legacy files were removed after import/build checks.

## Final verification

- Vendor build: **passed**, **623.44 kB** initial / **155.40 kB** estimated transfer, no warnings.
- Vendor lint: **79 files, 0 errors, 0 warnings**.
- PostgreSQL suites: **61 passed**; shared auth tests: **6 passed**, no failures/skips.
- Docker Django check: no issues, 0 silenced. Windows smoke profile: no issues, 1 silenced. Migration drift: no changes.
- Customer, delivery and admin builds passed. Admin retains pre-existing bundle and missing icon stylesheet warnings.
- Scoped vendor/shared and backend diff checks passed. Whole frontend has unrelated pre-existing admin whitespace.
- Receipt API: 201 generation/200 PDF, valid signature, authoritative amount and foreign-owner 403. IAB download event timed out.
- Responsive: 15 main routes plus editor/prep/detail at 360/390/768/1024/1440/1920. Screenshots/measurements saved in `docs/vendor-qa/`.
- Final isolated QA: PostgreSQL/Redis/real worker/scheduler API 8004/UI 4304. Initial SQLite/stub QA supplied additional persistence evidence. No production services or financial records were mutated.

## Remaining acceptance

Maps referrer/provider configuration; real staging mail/push delivery; human browser registration/password/reset submission; target-browser PDF save; 200% zoom/screen reader; simultaneous two-session conflicts; targeted analytics/provider outages; staged deployment smoke. The implementation report explains each limitation.

Deferred product capabilities: staff/multistore, import jobs, printers/POS/KDS, backorders/preorders, targeted campaigns, review replies, support conversation/attachments, cross-device prep, forecasting and bank-change self-service. These require business/backend contracts and have no fake completed controls.

No commit, push, deployment or real financial transaction was performed.
