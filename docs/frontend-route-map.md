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
| `/context-selection` | Explicit tenant/company membership selection |
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
- Company: `/{company}/dashboard`, `/batches`, `/batches/{batch}`,
  `/operations`, `/quality`, `/traceability`, `/resources`, `/reports`,
  `/settings`, `/settings/{section}`, `/{company}/setup/{step}`,
  `/{company}/masters`, `/{company}/masters/{resource}`,
  `/{company}/masters/{resource}/import`,
  `/{company}/settings/business-structure`,
  `/{company}/accounting/chart-of-accounts`,
  `/{company}/accounting/chart-of-accounts/{new|accountId}`, and
  `/{company}/accounting/{gl-mappings|costing|readiness}`.

Company setup step routes are `profile`, `address`, `contacts`,
`localization`, `accounting`, `modules`, `admin`, `team`, `chart-of-accounts`,
`business-structure`, `masters`, `notifications`, and `review`.

Compatibility redirects: `/operator` -> `/admin/masters`; `/organization` and
`/tenant-admin` -> `/console/dashboard`; `/admin` and `/console` redirect to
their dashboards.

The static `masters/nobs` and `masters/lobs` routes open the company
business-structure workspace. Unknown master resources return 404.
