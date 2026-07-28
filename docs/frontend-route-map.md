# Frontend route map

## Public and authentication

| Route | Purpose |
| --- | --- |
| `/login`, `/signup` | Authentication and tenant signup |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/accept-invitation`, `/verify-email` | Account activation |
| `/mfa/setup`, `/mfa/verify`, `/mfa/recovery` | MFA lifecycle |
| `/trace/{company}/{pack}` | Public farm-to-fork trace page |

## Shared authenticated routes

| Route | Purpose |
| --- | --- |
| `/context-selection` | Explicit tenant, company, and workspace membership selection |
| `/onboarding` | Compatibility redirect to the active company's `/{company}/setup` flow |
| `/profile` | Profile, password, language, timezone, notifications, session |
| `/access-denied` | Suspended, inactive, membership, or permission failure |

## Scope routes

- Platform: `/admin/dashboard`, `/admin/tenants`, `/admin/tenants/new`,
  `/admin/tenants/{tenantId}/{overview|subscription|limits|companies|users|audit}`,
  `/admin/plans`, `/admin/plans/{planId}`, `/admin/masters`,
  `/admin/masters/{nobs|lobs|modules|reference-data}`, `/admin/audit`.
- Tenant: `/console/dashboard`, `/console/profile`, `/console/companies`,
  `/console/companies/new`, `/console/companies/{companyId}`, `/console/users`,
  `/console/invitations`, `/console/roles`, `/console/subscription`,
  `/console/usage`, `/console/audit`, `/console/notifications`.
- Company administration: `/{company}/overview`, `/{company}/workspaces`,
  `/{company}/setup`, `/{company}/members`, `/{company}/readiness`,
  `/{company}/settings`, `/{company}/settings/{section}`, `/{company}/setup/{step}`,
  `/{company}/masters`, `/{company}/masters/{resource}`,
  `/{company}/masters/{resource}/import`,
  `/{company}/settings/business-structure`,
  `/{company}/accounting/chart-of-accounts`,
  `/{company}/accounting/chart-of-accounts/{new|accountId}`, and
  `/{company}/accounting/{gl-mappings|costing|readiness}`.
- Workspace administration: `/{company}/workspaces`,
  `/{company}/workspaces/new`, and `/{company}/workspaces/{workspace}`.
- Canonical workspace operations:
  `/{company}/workspaces/{workspace}/{dashboard|batches|operations|quality|traceability|resources|costing|reports|masters|settings}`.

Company setup step routes are `profile`, `address`, `contacts`,
`localization`, `accounting`, `modules`, `admin`, `team`, `chart-of-accounts`,
`business-structure`, `masters`, `notifications`, and `review`.

Compatibility redirects: `/operator` -> `/admin/masters`; `/organization` and
`/tenant-admin` -> `/console/dashboard`; `/admin` and `/console` redirect to
their dashboards.

`/{company}/dashboard` redirects to the canonical company administration
overview at `/{company}/overview`. Other legacy company operational routes
`/{company}/{batches|operations|quality|traceability|resources|costing|reports}`
are resolvers only. One accessible workspace redirects to its canonical route,
multiple accessible workspaces redirect to `/{company}/workspaces`, and no
accessible workspace renders an explicit setup/access state. They never infer
a workspace from stale browser state.

The shell has distinct platform, tenant, company-administration and workspace
navigation models. Company mode never renders operational navigation. Workspace
mode is derived only from a canonical workspace URL plus the matching active
workspace membership.

The static `masters/nobs` and `masters/lobs` routes open the company
business-structure workspace. Unknown master resources return 404.
