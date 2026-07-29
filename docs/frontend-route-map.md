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
| `/context-selection` | Canonical Company administration and Workspace selection; tenant is session-established and is not selectable |
| `/company-selection` | Retired compatibility redirect to `/context-selection` |
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
  `/{company}/profile`, `/{company}/setup`, `/{company}/members`,
  `/{company}/roles`, `/{company}/readiness`,
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
  `/{company}/workspaces/{workspace}/{dashboard|batches|operations|quality|traceability|resources|costing|reports|masters|settings}`
  and `/{company}/workspaces/{workspace}/batches/{batch}`.

Company setup step routes are `profile`, `address`, `contacts`,
`localization`, `accounting`, `modules`, `admin`, `team`, `chart-of-accounts`,
`business-structure`, `masters`, `notifications`, and `review`.

Compatibility redirects: `/operator` -> `/admin/masters`; `/organization` and
`/tenant-admin` -> `/console/dashboard`; `/admin` and `/console` redirect to
their dashboards. `/company-selection` redirects server-side to
`/context-selection` and contains no selection/cache business logic.

`/{company}/dashboard` redirects to the canonical company administration
overview at `/{company}/overview`. Other legacy company operational routes
`/{company}/{batches|operations|quality|traceability|resources|costing|reports}`
and `/{company}/batches/{batch}` are resolvers only. One accessible workspace
redirects to its canonical route, multiple accessible workspaces redirect to
`/{company}/workspaces`, and no accessible workspace renders an explicit
setup/access state. They never infer a workspace from stale browser state.

The shell has distinct platform, tenant, company-administration and workspace
navigation models. Company mode never renders operational navigation. Workspace
mode is derived only from a canonical workspace URL plus the matching active
workspace membership. Session restoration completes before these guards run;
company administration does not require an active workspace.

The company layout owns only `ApplicationShell`; operational
`DemoStoreProvider` state is mounted by the canonical
`/{company}/workspaces/{workspace}` layout. Profile, Members, Roles &
permissions, Readiness, Settings, setup, masters, accounting, and workspace
administration therefore render with `activeWorkspaceId: null`.

`/{company}/members`, `/{company}/roles`, and `/{company}/readiness` are
canonical pages, not settings/accounting aliases. Settings supports the
documented `localization`, `fiscal`, `modules`, and `notifications` sections;
`settings/business-structure` remains the canonical NOB/LOB configuration page.

The static `masters/nobs` and `masters/lobs` routes open the company
business-structure workspace. Unknown master resources return 404.

## Milestone 3 workspace route status

The shell switcher is the one live in-application Company/Workspace switcher.
`/context-selection` remains the post-login selection screen and delegates
context mutation to the same `AuthContext`; it is not a second persistent shell
switcher. The closed shell trigger shows Company plus either `Company
administration` or the active Workspace. No tenant/organisation option is
rendered.

All eleven canonical workspace URLs listed above are implemented. Dashboard,
Batches/detail, Operations, Quality, Traceability, Resources and Reports use
the workspace provider and typed nested operational client. Costing, Workspace
Masters and Workspace Settings are distinct pages. Workspace Masters reads
workspace-owned operational values and links to, but does not mutate, Company
shared masters. Workspace Settings is read-only for operational roles and
links authorized Company/Tenant administrators to the company-scoped
configuration page.

Workspace navigation requires an active matching membership, active workspace,
enabled module and exact workspace capability. A switch preserves only a
supported canonical module list. Any record-detail route drops the record ID;
an unsupported destination opens the target Dashboard. Legacy company-only
operational routes remain resolver-only compatibility routes.

## Milestone 4 presentation state

All canonical families above now share the same theme-aware shell and
presentation primitives. Platform and Tenant show static scope ownership;
Company pages explicitly remain usable without a workspace; Workspace pages
show company, workspace, NOB/LOB, and operational role. The interactive
switcher remains Company/Workspace only. Canonical route families are audited
for document overflow at 1440×900, 1280×800, 1024×768, 768×1024, and 390×844.
`/trace/{company}/{pack}` uses a separate public-safe surface with no protected
navigation.
