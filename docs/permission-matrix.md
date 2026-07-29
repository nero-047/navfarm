# Permission matrix

Navigation is derived from permissions, explicit workspace membership, and enabled workspace modules. Hidden
navigation is only a UX decision; mock mutations separately enforce permission
checks and a production backend must do the same.

| Identity | Company configuration | Company accounting | Workspace operations |
| --- | --- | --- | --- |
| System administrator | Platform oversight only | No implicit company authority | No implicit workspace access |
| Tenant administrator | Tenant, company, workspace and membership management | Per documented company configuration rule | Only with an explicit workspace role |
| Company administrator roles | According to company permissions | According to `finance.view/manage` | No automatic access; requires workspace membership |
| Workspace Manager | No implicit company configuration | No implicit company accounting | Assigned workspace capabilities, including permitted mutations |
| Workspace Viewer | No implicit company configuration | No implicit company accounting | Assigned workspace read capabilities only |

## Phase 3 configuration access

| Role | Platform templates | Company masters | COA/GL/costing |
| --- | --- | --- | --- |
| System administrator | View/manage | Full through company context | Full through company context |
| Tenant administrator | No platform access | Full for granted company | Full for granted company |
| Company super administrator / administrator | No | Full | Full |
| Farm manager | No | Read; mutation only with `company.manage` | No |
| Accountant | No | Read | Full |
| Auditor | No | Read only | Read only |
| Supervisor / viewer | No | Read only | No unless explicitly granted |
| Custom | Permission-driven | Permission-driven | Permission-driven |

The API enforces the same boundary as navigation. Platform reads require
`SYSTEM_ADMIN`; master mutations require `company.manage`; accounting reads
require `finance.view` or `company.manage`; accounting mutations require
`finance.manage` or `company.manage`.

## Workspace operational capabilities

`canViewWorkspace`, `canCreateOperations`, `canManageQuality`,
`canManageTraceability`, `canManageResources`, `canCloseBatch`, and
`canViewReports` are derived from the active workspace membership. Company
`company.manage` is configuration authority and never grants these operational
capabilities. Switching company clears workspace context; switching workspace
changes the operational partition.

Navigation and mutations use the same resolver: company permissions are read
from the active company membership, while operational permissions are read
only from the active workspace membership. `workspaceType`, enabled modules and
that permission set jointly filter workspace navigation.

The mock does not derive permissions from role names at runtime. Each demo
membership carries an explicit permission list. Role tables below document the
intended catalogue; the session and API authorize the actual explicit list.

Canonical permission identifiers are defined in
`apps/web/src/contracts/authorization.ts` and re-exported by
`contracts/api.ts`; role defaults and permission evaluation are in
`apps/web/src/lib/authorization.ts`.

## Company administration capabilities

| Surface/action | Read capability | Mutation capability |
| --- | --- | --- |
| Company profile, Settings, Readiness | `company.view` | `company.manage` |
| Company Members and invitations | `users.view` | `users.manage` |
| Company role catalogue | `roles.view` | Assignment requires `users.manage` + `roles.manage` |
| Workspace assignment summaries | `users.view` | `users.manage` + `workspaces.manage` |
| Shared masters | `masters.view` | `masters.manage` or documented company administration authority |
| Accounting | `finance.view` | `finance.manage` |

`workspaces.view/manage` are company-administration capabilities. Operational
workspace navigation still reads the explicit active workspace permission
array and never falls back to either company capability.

Operational mutation checks are resource-specific:

| Mutation | Required active-workspace capability |
| --- | --- |
| Create/update batch | `batches.create` |
| Approve batch | `batches.approve` |
| Close batch | `batches.close` |
| Record daily operation | `operations.create` |
| Change QC state | `quality.manage` |
| Generate/update QR traceability | `traceability.manage` |
| Create/update resource or usage | `resources.manage` |

A missing permission returns `403 CAPABILITY_REQUIRED`; a mismatched
tenant/company/workspace or missing membership returns its specific scope code.

Workspace navigation uses these read requirements:

| Workspace page | Module requirement | Read/navigation requirement |
| --- | --- | --- |
| Dashboard | none | `workspaces.view` |
| Batches | `Batches` | `batches.view` |
| Operations | `Batches` | `workspaces.view`; writes still require `operations.create` |
| Quality | `QC` | `quality.view` |
| Traceability | `QR` | `traceability.view` |
| Resources | `Resources` | `resources.view` |
| Costing | `Finance` | `costs.view` |
| Reports | `Analytics` | `reports.export` |
| Workspace Masters / Settings | none | `workspaces.view` |

Company/Tenant administrators may configure a workspace only through
`workspaces.manage`. That capability does not create an operational membership.
Workspace Manager/Viewer roles do not receive Company Members, Roles, shared
masters or accounting authority.

## Phase 2 administration boundaries

| Action | System administrator | Tenant administrator | Company administrator |
| --- | --- | --- | --- |
| View/create/suspend tenants and change subscriptions | Yes | No | No |
| View platform plans, usage, users, companies, and audit | Yes | No | No |
| Manage own tenant profile, companies, users, invitations, roles | Yes | Yes | No |
| Create a company within tenant entitlement limits | Yes | Yes | No |
| Edit company setup | Yes | Yes, with company membership | Yes, for assigned company |
| View company setup | Yes | Yes, with company membership | Yes, for assigned company |
| View company profile/settings/readiness | Only with explicit company context | Yes | Yes |
| Manage company Members, invitations and workspace assignments | No implicit company authority | Yes, with explicit capabilities | Yes, with `users.manage` + relevant role/workspace capability |
| View Roles & permissions | No implicit company authority | Yes | Yes, with `roles.view` |
| Enter operations before operations readiness | No; read-only | No; read-only | No; read-only |

The API repository enforces these rules independently of hidden navigation.
Suspended tenants cannot mutate tenant or company setup data.

Milestone 4 changes presentation only. Theme, responsive layout, mobile
navigation, dialogs, badges, and access-state copy do not grant capabilities.
Manager and Viewer controls remain derived from the same permission model, and
the Company/Workspace switcher still filters by explicit active memberships.
Static Platform/Tenant scope labels are not switch controls.
