# Permission matrix

Navigation is derived from permissions and enabled company modules. Hidden
navigation is only a UX decision; mock mutations separately enforce permission
checks and a production backend must do the same.

| Role | Batches create/approve | Costs | Finance | User/role admin | Export | Operational entry |
| --- | --- | --- | --- | --- | --- | --- |
| System administrator | Platform-wide | Yes | Yes | Yes | Yes | Yes |
| Tenant administrator | Via company role | Via company role | Via company role | Tenant/company administration | Audit export | Via company role |
| Company super administrator | Yes / Yes | Yes | Full | Full | Yes | Yes |
| Company administrator | Yes / Yes | Yes | Full | Full except immutable super admin | Yes | Yes |
| Farm manager | Yes / Yes | Own farms | No | No | Yes | Yes |
| Accountant | No / No | All | Full | No | Yes | No |
| Auditor | No / No | Read-only | Read-only | No | Yes | No |
| Supervisor | Yes / No | Hidden | No | No | No | Yes |
| Viewer | No / No | Hidden | No | No | No | No |
| Custom | Granted | Granted | Granted | Granted | Granted | Granted |

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
