# Fix Application Style Issues & Unify Color Palette

All 4 NexConnect apps (Admin, Vendor, Delivery, Customer) have accumulated severe style debt: duplicate CSS blocks, conflicting definitions, inconsistent variables, and a huge copy-paste "Common Page Utilities" block appended to every `styles.scss`. This plan consolidates everything into a single shared design-system file, then makes each app's `styles.scss` a thin layer that imports the foundation and only adds app-specific overrides (sidebar colors, login gradients, etc.).

## Key Problems Found

1. **Massive Duplication** — Every `styles.scss` has the same `:root` variables, resets, cards, buttons, forms, badges, alerts, loading states, animations, tables, modals, and a copy-pasted "Common Page Utilities" block (lines ~397–441 in admin, ~586–629 in vendor, ~244–287 in delivery, ~375–418 in customer). All are near-identical but slightly diverge.

2. **Conflicting Duplicate Selectors** — Admin's `styles.scss` defines `.badge`, `.data-table`, `.modal-*`, `.page-header`, etc. **multiple times** (lines 160 vs 300 vs 415; lines 277 vs 406; lines 311 vs 422). Later definitions override earlier ones unpredictably.

3. **Missing Variables** — Delivery and Customer don't define `--radius-xs`, `--radius-xl`, `--radius-sm`, `--shadow-xs`, `--shadow-md`, `--shadow-xl` — tokens used in component SCSS that rely on CSS variable fallback (invisible/broken).

4. **Inconsistent Box-Shadow colors** — Vendor uses `rgba(82,113,255,...)` for primary shadows, Admin uses `rgba(79,70,229,...)`. Both map to the same primary color intent but differ.

5. **Sidebar color inconsistency** — Admin & Vendor use `linear-gradient(180deg, #1E1B4B, #312E81)` (indigo), Delivery uses `linear-gradient(180deg, #064E3B, #065F46)` (emerald). These are correct per-app branding differences and should be preserved, but the sidebar class names differ (`.nav-item` vs `.sidebar-nav-item`).

6. **Component SCSS re-defines globals** — `payouts.component.scss`, `notifications.component.scss`, `admin-users.component.scss`, `support.component.scss`, `stock-management.component.scss`, `payments.component.scss` all re-define `.card`, `.badge`, `.btn-primary`, `.form-group`, `.modal-*`, `.table` etc. locally, creating specificity fights.

## Proposed Changes

### Phase 1: Create Shared Design System Foundation

#### [NEW] [_design-system.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/shared/src/styles/_design-system.scss)

A single canonical file containing **all** shared tokens and utility classes used across apps:

- **CSS Variables (:root)** — Complete token set with all radius, shadow, color, and typography tokens
- **Reset & Typography** — Box-sizing, body, headings, links
- **Utility Classes** — `.text-muted`, `.text-center`, margins, etc.
- **Cards** — `.card`, `.card-header`, `.card-body`, `.card-footer`
- **Buttons** — `.btn`, `.btn-primary`, `.btn-outline`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.btn-sm`, `.btn-create`, `.btn-ghost`
- **Form Controls** — `.form-group`, `.form-label`, `.form-input`, global input selectors
- **Badges** — All badge variants (`.badge-*`) with pill shape (border-radius: 99px) uniformly
- **Alerts** — `.alert`, `.alert-danger`, `.alert-success`, `.alert-warning`
- **Loading/Empty States** — `.loading-state`, `.empty-state`, `.spinner`
- **Animations** — `.fade-in`, `@keyframes fadeIn`, `@keyframes spin`
- **Tables** — `.table-wrapper`, `.data-table` with th/td
- **Modals** — `.modal-overlay`, `.modal-backdrop`, `.modal-content`, `.modal`, `.modal-header`, `.modal-body`, `.modal-footer`, `.modal-close`, `.close-btn`
- **Page Layout** — `.page-header`, `.page-title`, `.page-subtitle`, `.header-actions`
- **Search & Filters** — `.search-input`, `.filters`, `.filter-input`
- **Actions** — `.actions`, `.action-btn`, `.btn-ghost`, `.danger-hover`
- **Login/Register Container** — `.login-card`, `.register-card`, `.login-btn` (without the background gradient — that's per-app)

---

### Phase 2: Refactor Each App's `styles.scss`

Each file becomes: `@use '../../shared/src/styles/design-system';` + app-specific-only code.

> [!IMPORTANT]
> Since Angular workspace projects can't easily `@use` relative paths to sibling projects, we'll instead keep the approach of having each `styles.scss` file self-contained but **import a shared mixin partial** via the SCSS `@import` mechanism using a relative path. Alternatively, since Angular projects don't support cross-project style imports out-of-box, the most reliable approach is to create the design system file and have each `styles.scss` use `@import` with a relative path.
>
> **Chosen approach**: Create `_design-system.scss` in the shared project and use `@import` with relative paths from each app's `styles.scss`. If that doesn't work due to Angular's SCSS resolution, we'll add `stylePreprocessorOptions.includePaths` in `angular.json`.

#### [MODIFY] [angular.json](file:///d:/Projects/NexConnect/shopping-app/frontend/angular.json)
Add `stylePreprocessorOptions.includePaths` to all 4 app projects pointing to the shared styles directory, enabling `@import 'design-system'` from anywhere.

---

#### [MODIFY] [styles.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/admin-panel/src/styles.scss) (Admin)
- Replace entire contents with `@import 'design-system';` + Admin-specific login page gradient (`#1E1B4B → #4F46E5 → #6366F1`)
- Remove all duplicate blocks

#### [MODIFY] [styles.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/vendor-app/src/styles.scss) (Vendor)
- Replace entire contents with `@import 'design-system';` + Vendor-specific sidebar, topbar, notification dropdown, profile dropdown, login gradient, mobile responsive, vendor shell layout

#### [MODIFY] [styles.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/delivery-app/src/styles.scss) (Delivery)
- Replace entire contents with `@import 'design-system';` + Delivery-specific sidebar (emerald green), mobile header, bottom nav, profile dropdown, login gradient

#### [MODIFY] [styles.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/customer-app/src/styles.scss) (Customer)
- Replace entire contents with `@import 'design-system';` + Customer-specific top nav, mobile header, bottom nav, user menu dropdown, login gradient

---

### Phase 3: Clean Up Component SCSS Files

Remove global re-definitions from component SCSS files, keeping only truly component-specific styles:

#### [MODIFY] [payouts.component.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/admin-panel/src/app/pages/payouts/payouts.component.scss)
Remove duplicate `.card`, `.card-header`, `.card-body`, `.table`, `.form-group`, `.form-label`, `.form-input`, `.btn-primary`, `.btn-sm`, `.badge-*` definitions. Keep only `.payouts-page`, `.tabs-nav`, `.tab-btn`, `.payout-layout`.

#### [MODIFY] [notifications.component.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/admin-panel/src/app/pages/notifications/notifications.component.scss)
Remove duplicate `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`, `.close-btn`, `.form-group`, `.input-label`, `.input-field` definitions. Keep custom grid-based table (`.t-header`, `.t-row`), `.filter-input`, pagination, and notification-specific pills.

#### [MODIFY] [admin-users.component.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/admin-panel/src/app/pages/admin-users/admin-users.component.scss)
Remove duplicate `.page-header`, `.page-title`, `.page-subtitle`, `.alert`, `.form-group`, `.btn-primary` definitions. Keep custom `.glass-card`, `.form-card`, `.admin-form`, role badges, user cells.

#### [MODIFY] [support.component.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/vendor-app/src/app/pages/support/support.component.scss)
Remove duplicate `.card`, `.card-header`, `.card-body`, `.page-header`, `.badge` definitions. Keep `.support-layout`, ticket-specific styles.

#### [MODIFY] [stock-management.component.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/vendor-app/src/app/pages/stock-management/stock-management.component.scss)
Remove duplicate `.card`, `.card-header`, `.card-body`, `.page-header`, `.table`, `.badge-*` definitions. Keep `.stock-layout`, `.stock-input`, alert-specific styles.

#### [MODIFY] [payments.component.scss](file:///d:/Projects/NexConnect/shopping-app/frontend/projects/vendor-app/src/app/pages/payments/payments.component.scss)
Remove duplicate `.card`, `.card-header`, `.page-header`, `.table`, `.badge-*`, `.btn-icon` definitions. Keep `.payments-page` layout.

## Open Questions

> [!IMPORTANT]
> **Sidebar color per app**: Currently Admin & Vendor share indigo sidebar (`#1E1B4B → #312E81`), Delivery uses emerald (`#064E3B → #065F46`). Should all apps use the same sidebar color, or keep distinct branding per portal? My plan preserves the per-app distinction.

> [!IMPORTANT] 
> **Login page gradients**: Each app has a different login background gradient. Should these be unified or kept distinct? My plan preserves per-app distinction.

## Verification Plan

### Automated Tests
- Build all 4 apps: `npx ng build admin-panel`, `npx ng build vendor-app`, `npx ng build delivery-app`, `npx ng build customer-app` — all must succeed with no style-related errors.

### Manual Verification
- Serve each app and visually inspect key pages (login, dashboard, data tables, modals) to confirm no regressions.
