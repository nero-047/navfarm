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
