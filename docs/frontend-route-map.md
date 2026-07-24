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
| `/onboarding` | Continue mandatory company setup steps 1-9 |
| `/profile` | Profile, password, language, timezone, notifications, session |
| `/access-denied` | Suspended, inactive, membership, or permission failure |

## Scope routes

- Platform: `/admin/dashboard`, `/admin/tenants`, `/admin/tenants/{id}`,
  `/admin/plans`, `/admin/masters`, `/admin/audit`.
- Tenant: `/console/dashboard`, `/console/companies`, `/console/users`,
  `/console/roles`, `/console/audit`, `/console/notifications`.
- Company: `/{company}/dashboard`, `/batches`, `/batches/{batch}`,
  `/operations`, `/quality`, `/traceability`, `/resources`, `/reports`,
  `/settings`, `/settings/{section}`.

Compatibility redirects: `/operator` -> `/admin/masters`; `/organization` and
`/tenant-admin` -> `/console/dashboard`; `/admin` and `/console` redirect to
their dashboards.
