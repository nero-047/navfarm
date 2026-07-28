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

Canonical permission identifiers are defined in
`apps/web/src/contracts/api.ts`; role defaults and permission evaluation are in
`apps/web/src/lib/authorization.ts`.

## Phase 2 administration boundaries

| Action | System administrator | Tenant administrator | Company administrator |
| --- | --- | --- | --- |
| View/create/suspend tenants and change subscriptions | Yes | No | No |
| View platform plans, usage, users, companies, and audit | Yes | No | No |
| Manage own tenant profile, companies, users, invitations, roles | Yes | Yes | No |
| Create a company within tenant entitlement limits | Yes | Yes | No |
| Edit company setup | Yes | Yes, with company membership | Yes, for assigned company |
| View company setup | Yes | Yes, with company membership | Yes, for assigned company |
| Enter operations before operations readiness | No; read-only | No; read-only | No; read-only |

The API repository enforces these rules independently of hidden navigation.
Suspended tenants cannot mutate tenant or company setup data.
