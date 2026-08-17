# Phase 7 — Visual QA Evidence

Durable record of the Phase 7 review of the Navfarm application webapp
against `apple.design.md`. Captured with scripted Playwright passes
against the real app (stubbed API responses, seeded auth session),
reviewed image-by-image before this report was written. Two passes:
an initial checklist audit, then a deeper product-design pass that
checked source code directly rather than trusting screenshots alone —
see "Correction from the deeper pass" below for why that mattered.

## Finding going in

Before touching any code, the reference families and a representative
sample of the rest of the application were inspected. Nearly everything
was **already compliant** with `apple.design.md` — this reflects real
design-system work already done in earlier phases, not something Phase 7
needed to redo. The first pass's job was: confirm the reference families
hold up under full state/viewport/theme coverage, sweep every remaining
reachable page for violations, and fix what's actually broken — not a
blind rewrite.

## Correction from the deeper pass

The first pass judged some multi-panel layouts as "one shared container"
from screenshots alone. That was wrong in one case, caught by checking
source directly: **`admin/tenants/[id]/page.tsx`'s stat row was itself a
four-card KPI wall** (a `StatCard` component rendering `rounded-lg p-5
border` individually, used ×4) — the exact anti-pattern the dashboards
had, on the page this document had incorrectly cited as the *source* of
the correct pattern. Light, similarly-colored borders on adjacent boxes
can look like one container at a glance; they aren't. Fixed the same way
as the dashboards, and the same page's `MiniCard` component (individually
bordering every field in a 7-column detail grid, inconsistent with the
lighter `InfoRow` pattern two sections above it on the same page) was
brought in line too. `console/users/page.tsx` had the identical three-card
version of the same mistake, also fixed. An exhaustive follow-up sweep
(source-level, not visual) across every remaining reachable file confirmed
no further instances of either pattern. Eight files also had `shadow-sm`
on table wrappers, buttons, and pills — `apple.design.md` §33 is explicit
that default elevation is none; all removed except the one on
`admin/tenants/[id]`'s actual modal dialog, which is the legitimate
floating-surface exception the same rule allows.

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
`admin-tenant-detail_1440_light.png` / `FIXED-admin-tenant-detail_1440_
{light,dark}.png`, `admin-masters`, `FIXED-admin-masters_1440_light.png`,
`admin-plans`, `FIXED-admin-plans_1440_light.png`, `admin-audit`,
`FIXED-admin-audit_1440_light.png`.

**Result: real fixes required and made** — see "Correction from the
deeper pass" above. `admin/tenants/[id]` (the primary reference
implementation for this family) had its own stat-card wall and an
inconsistent field-card pattern, both fixed; it, `admin/tenants`,
`admin/plans`, and `admin/audit` all had an unnecessary `shadow-sm` on
their table wrapper and/or primary action button, also removed.

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

`console-companies`, `console-audit`, `console-inventory`, `login`
(1440 light each) — reviewed, compliant, no changes.

`console-users` (Team Management) — had the same three-card KPI-wall
mistake as the reference-family finding above; fixed
(`FIXED-console-users_1440_light.png`, populated with real stubbed rows
to confirm the fix didn't disturb data rendering, role badges, or the
edit action).

`console-roles`, `console-notifications` — no card-wall, but each had an
unnecessary `shadow-sm` (a "Create Role" button, a tab-panel wrapper, a
callout row, and a logs table); removed
(`FIXED-console-roles_1440_light.png`, `FIXED-console-notifications_
1440_light.png`).

`/signup`, `/reset-password` (`DEEP-signup_*`, `DEEP-reset-password_*`,
1440 + 390, light) — directly rendered and reviewed this pass, not just
checked via source as in the first pass. Compliant: obvious purpose,
one dominant primary action, no card-wall, restrained brand presence.

Onboarding wizard (`DEEP-onboarding-wizard_1440_light.png`) — directly
rendered. Compliant. One thing considered and deliberately not changed:
the setup-flow header shows a permanent "Sign Out" text link, which
brushes against §15's rule against permanent sign-out infrastructure —
but it's the same visual weight as the adjacent theme toggle, not a
"large" or "loud" element, and the wizard is explicitly its own
temporary flow outside the main shell (Phase 5's taxonomy lists
onboarding under "Full page," a distinct category). Proportionate, not
a violation.

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
- After the deeper pass found a screenshot-only review had missed a
  card-wall (see above), every remaining reachable page was re-checked
  by reading its source for the anti-pattern's actual JSX/CSS signature
  (a `.map()` rendering 3+ individually `rounded-*`+`border` cells into
  a `grid ... gap-*`), not by eyeballing another screenshot — including a
  second, independent agent sweep across every reachable file that found
  zero further instances.
- Every code change made (both dashboards, `admin/tenants/[id]`,
  `console/users`, and the eight shadow removals) was diffed line-by-line
  against the prior version to confirm zero data/calculation/handler
  changes — see the Phase 6/7 commit messages for the exact method.
