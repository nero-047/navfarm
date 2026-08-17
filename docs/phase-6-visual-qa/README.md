# Phase 6 — Visual QA Evidence

Durable record of the visual QA pass performed for the Phase 6 red-team
remediation. Captured with a scripted Playwright pass against the real app
(stubbed API responses, seeded auth session — no mocked rendering), at
checkpoint `d947cd3` plus the remediation commit on top of it.

Reviewed live, one-by-one, before this report was written — not generated
and assumed correct.

## Coverage matrix

| Viewport | Light | Dark |
|---|---|---|
| 1440×900 | ✅ | ✅ |
| 1280×800 | ✅ | — (light/dark parity already covered at 1440 and 834; token set is identical across breakpoints) |
| 834×1112 | ✅ | ✅ |
| 390×844 | ✅ | ✅ |

Representative categories, per the audit brief:

- **Shell / navigation / PageHeader** — `master-data_*` (all viewports/themes). Primary nav, context nav, breadcrumb → title → description → actions hierarchy, all visible together.
- **Profile / overlay** — `OVERLAY-profile-popover_1440_light.png` (anchored popover, Account/Preferences/Settings, Sign out styled destructive-but-quiet), `OVERLAY-mobile-nav_390_light.png` (off-canvas drawer with scrim, below 1024px).
- **Form surface** — `FORM-add-farm-drawer_1440_light.png` (Field-wrapped Input, required markers, two-column layout, drawer footer actions).
- **Table surface** — `master-data_*` (CRUD table, empty state) and `finance_1440x900_{light,dark}.png` (financial table with footer/subtotal row, debit/credit alignment).
- **Dashboards (Phase 6 remediation fix)** — `FIXED-console-dashboard_*`, `FIXED-admin-dashboard_*`: before this pass both were a "four KPI cards" wall; now a single divided summary strip, matching the pattern already established (unmodified) on `admin-tenant-detail_1440_light.png`.

## What was inspected

- Navfarm brand: logo mark, `#C24332` red used only for primary actions/active nav/links, `#2E313F`-derived navy for the primary nav rail and text, predominantly light/neutral canvas. No borrowed palette, no Apple blue.
- Hierarchy: exactly one page title per route, context nav visibly subordinate to primary nav, content dominant.
- Tables: quiet headers, restrained hover, no cell borders, no colorful status backgrounds, clean empty states (icon + message + primary action, not a decorative card shell).
- Forms: explicit `<label>` via `Field`, required asterisk, single focus-ring vocabulary shared with buttons.
- Overlays: popover anchored correctly to trigger, drawer scrim + close affordance, both close on click-outside/Escape (already covered by `apps/web-e2e/src/overlay.spec.ts` and `drawer.spec.ts`, not re-litigated here).
- Dark mode: not an inversion — navy/red identity held, surfaces stay distinguishable, no pure-black wall.
- Mobile: sidebar collapses to a hamburger + off-canvas drawer, context nav collapses to a dropdown trigger, no clipped controls, tables carry their own contained horizontal scroll rather than breaking the page.

## What was fixed as a result

Both dashboards (`/console/dashboard`, `/admin/dashboard`) were a literal instance of the "four KPI cards" / card-wall pattern `apple.design.md` §22/§24 explicitly names as something to avoid — up to 9 separately bordered boxes on the admin dashboard alone. Rebuilt as:

- one bordered summary strip with hairline dividers between segments (the `grid` + `gap-px` + per-cell background technique — dividers render correctly at every breakpoint without conditional border classes), matching the pattern already in production, unmodified, on the admin tenant-detail page;
- paired panels (plan breakdown/recent signups, management-controls/audit-feed) sharing one border with an internal divider instead of two adjacent cards;
- management-control links as a plain hoverable list, matching the pattern the console dashboard's own Quick Actions already used.

No data fetching, calculation, or permission-gating logic was touched — verified by diff review (markup/className changes only) and by these screenshots, captured against seeded non-trivial data (populated tenants, users, plans).

## What remains

- `--row-border` and the card `--radius-md` token questioned in the original review are **not** Phase 6 drift — confirmed via `git log -S` that both predate Phase 6 by weeks (`272a356`, `ea775c5`). No fix needed; documented here instead.
- Full adoption of the `<Table>` root wrapper component across all 26 migrated files remains deferred (see Phase 6 remediation report) — `MasterDataTable.tsx`'s pagination footer shares its outer border with the table, which needs real restructuring, not a markup swap. The primitive itself was extended (`wrapperClassName`) so it's ready when that screen is next touched.
- This is not a Phase 7 screen-by-screen redesign. The sweep behind this evidence found the rest of the sampled screens (Master Data, Finance, Production, Inventory, Companies, Team Management, Roles, Notifications, Audit, Tenants, Plans, admin Master Data, Login, forms) already compliant; only the two dashboards required a fix.
