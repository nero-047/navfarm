# Phase 7 — Visual QA Evidence

Durable record of the Phase 7 review of the Navfarm application webapp
against `apple.design.md`, at commit `4a7f527` and the Phase 7 commit on
top of it. Captured with scripted Playwright passes against the real app
(stubbed API responses, seeded auth session), reviewed image-by-image
before this report was written.

## Finding going in

Before touching any code, the reference families and a representative
sample of the rest of the application were inspected. Nearly everything
was **already compliant** with `apple.design.md` — this reflects real
design-system work already done in earlier phases, not something Phase 7
needed to redo. Phase 7's job turned out to be: confirm the reference
families hold up under full state/viewport/theme coverage, sweep every
remaining reachable page for violations, and fix what's actually broken
— not a blind rewrite.

## Reference 1 — Master Data

`master-data_*` (all 4 viewports × light/dark, 8 images) plus state
coverage: `STATE-master-data-loading_1440_light.png`,
`STATE-master-data-error_1440_light.png` (a distinct red banner above an
otherwise-empty table — API failure is never silently rendered as "no
records"), `FORM-add-farm-drawer_1440_light.png` /
`FORM-edit-farm-drawer_1440_light.png` (Field-wrapped Input, required
markers, pre-populated on edit), `OVERLAY-profile-popover_1440_light.png`,
`OVERLAY-mobile-nav_390_light.png`. Establishes the pattern: breadcrumb →
title → description → actions → table, context nav grouped by section,
drawer forms with `Field`/`Input`, canonical Table primitives, quiet
empty state (icon + message + inline "Add the first one" action, not a
decorative card shell).

**Result: compliant, no changes needed.**

## Reference 2 — Operational (Production)

`production_*` (all 4 viewports × light/dark, 8 images),
`OPS-production-batches_1440_light.png` (populated batch row). Chosen
over Inventory/Finance as the operational reference because it's the
most structurally demanding surface in the app (12 tables in one panel,
per the Phase 6B migration). Confirmed the same PageHeader/ContextNav/
Table pattern as Master Data, correctly propagated by the Phase 6B table
migration — no Phase 7 changes needed here either.

**Result: compliant, no changes needed.**

## Reference 3 — Analytics/Reporting (Finance)

`finance_*` (all 4 viewports × light/dark, 8 images),
`ANALYTICS-trial-balance_1440_light.png`. Finance's Trial Balance/Balance
Sheet/P&L are the application's actual reporting surfaces — reviewed in
source during Phase 6 remediation (footer/subtotal math, debit/credit
alignment, `isBalanced` styling all confirmed byte-identical through the
table migration) and visually confirmed here at every breakpoint.

**Result: compliant, no changes needed.**

## Reference 4 — Settings/Admin

`admin-tenants_*` (list, 5 images across viewports/themes),
`admin-tenant-detail_1440_light.png` (already used the divided
summary-strip pattern before Phase 7 touched anything — this is where
that pattern was copied from for the dashboard fix), `admin-masters`,
`admin-plans`, `admin-audit` (1440 light each).

**Result: compliant, no changes needed** beyond the dashboard (below).

## Dashboards — the one real fix

`FIXED-console-dashboard_*` and `FIXED-admin-dashboard_*` (both, full 4
viewports × light/dark = 16 images). Both dashboards were a literal
"four KPI cards" card-wall (`apple.design.md` §22/§24) — up to 9
separately bordered boxes on the admin dashboard. This was identified
and fixed during Phase 6 remediation (commit `4a7f527`) using the exact
pattern later confirmed to already be established elsewhere in the app
(the admin tenant-detail page's stat row). Re-verified here at full
matrix coverage: holds up correctly in dark mode and down to 390px, with
no clipped content and all data/calculations intact.

## Representative remaining screens

`console-companies`, `console-users`, `console-roles`,
`console-notifications`, `console-audit`, `console-inventory`, `login`
(1440 light each) — all reviewed and compliant, no changes.

## Pages found and intentionally left unchanged

Two clusters of pages are **unreachable from any real user flow** —
confirmed by tracing every redirect and every in-app link (login,
signup, and the root `/` redirect only ever send a user to `/admin` or
`/console`; nothing links anywhere else):

1. **`/organization`** (`apps/web/src/modules/admin-demo/tenant-admin-page.tsx`
   + `admin-shell.tsx`) — runs an entirely separate, pre-Phase-1 shell
   with no relation to the canonical one: a solid brand-red header bar
   (`bg-(--accent)` across the whole header — exactly what §5.2/§13
   warn against), a permanently visible "Sign Out" text link in the nav
   (exactly what §15 says not to do), and its own ad-hoc `<h1>` instead
   of the shared `PageHeader`. It also has the same four-card KPI-wall
   pattern the dashboards had. **Not fixed** — it duplicates
   functionality that already exists properly on `/admin/tenants/[id]`
   and `/console/companies`+`/console/users`, and investing a shell-level
   rewrite into a page nobody can reach is the same category of mistake
   as the Phase 6 dead-code cluster. Flagged for deletion alongside it,
   not touched.
2. **`/privacy`, `/terms`** — link only to each other; nothing else in
   the app links to them. Their styling ignores the token system
   entirely (hardcoded hex colors throughout) rather than using
   `--surface`/`--text-primary`/`--accent`/etc. **Not fixed**, same
   reasoning as above — orphaned, not a live UX surface.

Combined with the six-file `operational-console.tsx` cluster already
flagged during Phase 6 remediation, the app now has a fully mapped set
of ten orphaned files across three independent dead clusters. None were
deleted (permission-blocked in this session, as before) or redesigned
(no user ever sees them) — all documented here for a future cleanup
pass.

## What was verified, not just claimed

- Every reference family screenshot was opened and reviewed, not
  generated and assumed correct.
- Reachability of `/organization`, `/privacy`, `/terms` was established
  by grepping every `router.push`/`router.replace`/`href` in the auth
  and root-redirect code paths, not by inspection of the pages alone.
- The one code change made (dashboards) was diffed line-by-line against
  the prior version to confirm zero data/calculation/handler changes —
  see the Phase 6 remediation commit message for the exact method.
