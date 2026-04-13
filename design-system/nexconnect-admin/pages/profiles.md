# Profiles Page Overrides

> **PROJECT:** NexConnect Admin
> **Generated:** 2026-04-05 16:09:37
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px (standard)
- **Layout:** Full-width sections, centered content

### Spacing Overrides

- No overrides — use Master spacing

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- No overrides — use Master colors

### Component Overrides

- Avoid: Use arbitrary large z-index values
- Avoid: No feedback during loading
- Avoid: Override system gestures

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Minimal glow (text-shadow: 0 0 10px), dark-to-light transitions, low white emission, high readability, visible focus
- Layout: Define z-index scale system (10 20 30 50)
- Feedback: Show spinner/skeleton for operations > 300ms
- Touch: Avoid horizontal swipe on main content
