# NAVFarm web application shell audit

Audited 2026-07-24 before the API architecture change. This file records the
replacement intent; no route listed below was deleted by the API work.

## Findings

| Route family | Current shell/page | Overlap | Decision |
| --- | --- | --- | --- |
| `/admin/*` | `src/app/admin/layout.tsx` | System administration overlaps the older `AdminShell` visual vocabulary, but has the complete dashboard, tenant, plan, master-data, and audit navigation. | Retain as the canonical system-admin shell. |
| `/console/*` | `src/app/console/layout.tsx` | Organization administration overlaps `/organization` and contains an embedded company onboarding shell. | Retain as the canonical tenant/company administration shell. |
| `/[company]/*` | `src/app/[company]/layout.tsx` | Some settings, company profile, and users concepts also exist in `/console`. This shell is operational, not administrative. | Retain as the canonical company operations workspace. |
| `/organization` | `TenantAdminPage` inside the legacy `modules/admin-demo` family, rendered through `AdminShell`. | Duplicates company and organization administration covered more fully by `/console/companies`, `/console/users`, and `/console/roles`. | Retain as a compatibility page for now. Replacement target is `/console/dashboard`; do not add new behavior here. |
| `/operator` | Server redirect to `/admin`. The unused `OperatorPage` component remains under `modules/admin-demo`. | Alias for system-admin master configuration. | Retain redirect. The documented replacement is `/admin/masters`. |
| `/tenant-admin` | Server redirect to `/console`. | Alias for organization administration. | Retain redirect. |
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

## Duplicate code to avoid extending

- `modules/admin-demo/admin-shell.tsx`, `tenant-admin-page.tsx`, and
  `operator-page.tsx` are a legacy shell family. They remain solely to preserve
  `/organization` compatibility.
- `src/services/api-client.ts` is a compatibility import facade. New code should
  import the typed client from `src/lib/api-client.ts`.
- `/api/hello` is the original scaffold endpoint and is not part of NAVFarm's
  versioned API. Product code must use `/api/v1/*`.

## Replacement safeguards

The contract-first migration changes the data boundary, not the user-facing
route inventory. Legacy local operational persistence is replaced by
`GET/PUT /api/v1/demo/companies/{companySlug}/state`. Authentication/session,
theme, and language preferences remain browser session/preferences and are not
treated as operational records.
