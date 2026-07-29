# NAVFarm mock demo account scenarios

Status: deterministic frontend mock-demo fixtures. These accounts exist only
with `NAVFARM_API_MODE=mock`; they are not production identities or durable
backend records. All use `Demo123!`.

Every fixture explicitly declares authentication/MFA/suspension state, tenant
memberships and permissions, company memberships/roles/permissions, workspace
memberships/roles/permissions, allowed capabilities, initial context, and
expected landing route. No field is assigned from an email/username pattern,
tenant-role fallback, company-role fallback, or default workspace.

| Account | Deterministic result |
| --- | --- |
| `system@navfarm.demo` | Platform Administrator -> `/admin/dashboard`; platform administration only, with no company or workspace membership. |
| `tenant@navfarm.demo` | Tenant Administrator -> `/console/dashboard`; explicit tenant/company setup, membership, accounting, and workspace-administration permissions; no workspace membership and no operational access. |
| `companyadmin@navfarm.demo` | Company Administrator -> `/green-valley-poultry/overview`; company setup/accounting/workspace administration only; no operational access. |
| `accountant@navfarm.demo` | Accountant -> `/green-valley-poultry/accounting/readiness`; company accounting/readiness access; no workspace membership or operational mutation. |
| `auditor@navfarm.demo` | Auditor -> `/green-valley-poultry/overview`; read-only company/accounting/audit access; no workspace membership or operational mutation. |
| `manager@navfarm.demo` | Workspace Manager -> Poultry Operations dashboard; sees only its assigned workspace and can use the explicitly listed batch, operation, QC, traceability, resource, and report capabilities. |
| `viewer@navfarm.demo` | Workspace Viewer -> Poultry Operations dashboard; assigned workspace reads only. Mutation controls are absent and direct mutation receives `CAPABILITY_REQUIRED`. |
| `multi@navfarm.demo` | `/context-selection`; only active authorized companies and workspaces appear, grouped by company. Company administration and each workspace are explicit choices; no random selection occurs. |
| `mfa@navfarm.demo` | MFA challenge first; no protected session before code `123456` or recovery `NAVFARM-RECOVERY`; successful completion creates a full session at `/context-selection`. |
| `onboarding@navfarm.demo` | BlueWater company setup -> `/bluewater-aqua/setup/profile`; operations remain blocked by incomplete setup/readiness. |
| `suspended@navfarm.demo` | `/access-denied?reason=account_suspended`; no protected navigation/data and Sign out is the only application action. |
| `noworkspace@navfarm.demo` | `/green-valley-poultry/workspaces`; explicit company membership with no workspace assignment produces the no-workspace state. |
| `nocompany@navfarm.demo` | `/console/dashboard`; tenant-only read access and no company/workspace access. |

Operational mock state is partitioned by the complete
tenant/company/workspace scope. Company or tenant administration never implies
batch, operations, quality, traceability, resource, costing, or report
capabilities.
