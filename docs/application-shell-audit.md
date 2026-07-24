# NAVFarm web application shell audit

Audited 2026-07-24 before the API architecture change and updated after the
Phase 1 shell consolidation.

## Findings

| Route family | Current shell/page | Overlap | Decision |
| --- | --- | --- | --- |
| `/admin/*` | Shared `ApplicationShell`, platform scope | Canonical system administration. | Retained. |
| `/console/*` | Shared `ApplicationShell`, tenant scope | Canonical tenant/organization administration. | Retained. |
| `/[company]/*` | Shared `ApplicationShell`, company scope | Canonical operational workspace. | Retained with existing operational pages unchanged. |
| `/organization` | Compatibility redirect | Former legacy `AdminShell` page. | Redirects to `/console/dashboard`. |
| `/operator` | Compatibility redirect | Former system configuration alias. | Redirects to `/admin/masters`. |
| `/tenant-admin` | Compatibility redirect | Former tenant alias. | Redirects to `/console/dashboard`. |
| `/admin` | Client-side role guard and redirect to `/admin/dashboard`. | Root alias only. | Retain. |
| `/console` | Client-side role guard and redirect to `/console/dashboard`. | Root alias only. | Retain. |

## Components and pages retained

- Authentication: `AuthProvider`, login, signup, and reset-password forms.
- System administration: `/admin/dashboard`, `/admin/tenants`,
  `/admin/tenants/[id]`, `/admin/plans`, `/admin/masters`, and `/admin/audit`.
- Organization administration: `/console/dashboard`, `/console/companies`,
  `/console/users`, `/console/roles`, `/console/audit`, and
  `/console/notifications`.
- Company operations: dashboard, batches and batch details, daily operations,
  quality, traceability, resources, reports, profile, settings, and the public
  trace page.
- Reusable UI: company cards/switcher, onboarding wizard and step components,
  farm-demo workflow dialogs/charts, and shared UI primitives.

## Consolidated shell

`src/components/shell/application-shell.tsx` now owns the responsive sidebar,
mobile drawer, header, breadcrumbs, secure tenant/company context switcher,
notifications, profile menu, collapsed-sidebar preference, loading,
route-transition, and access-denied states. Scope-specific navigation is
declared in `src/components/shell/navigation.ts`.

## Legacy code to avoid extending

- `modules/admin-demo/admin-shell.tsx`, `tenant-admin-page.tsx`, and
  `operator-page.tsx` are retained source only; no active route renders them.
- `src/services/api-client.ts` is a compatibility import facade. New code should
  import the typed client from `src/lib/api-client.ts`.
- `/api/hello` is the original scaffold endpoint and is not part of NAVFarm's
  versioned API. Product code must use `/api/v1/*`.

## Replacement safeguards

Authentication identity is now loaded from `GET /api/v1/auth/session` using a
same-origin HTTP-only cookie. Only UI preferences (theme, language, collapsed
sidebar) remain in localStorage. Company onboarding was moved from an embedded
console-shell gate to `/onboarding`; the existing wizard components remain.
