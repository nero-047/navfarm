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
