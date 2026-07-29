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
| `tenant@navfarm.demo` | Tenant Administrator -> `/console/dashboard`; explicit tenant/company setup, Members, Roles, Settings, Readiness, accounting, and workspace-administration permissions; no workspace membership and no operational access. |
| `companyadmin@navfarm.demo` | Company Administrator -> `/green-valley-poultry/overview`; company profile/setup, Members, Roles, Settings, Readiness, accounting, and workspace administration; no operational access until a separate workspace assignment is made. |
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

Member and role mutations use the same explicit identity records as restored
sessions. Assigning a workspace makes it visible on session refresh; removing
the assignment revokes it. Changing a company role leaves every workspace role
unchanged, and changing a workspace role leaves the company role unchanged.
Mock reset restores the canonical membership, role, and invitation fixtures.

Milestone 3 switcher outcomes:

- `multi@navfarm.demo` sees Green Valley, Harvest Ridge and BlueWater company
  administration choices, but only active explicitly assigned workspaces.
  Inactive company/workspace rows and BlueWater's draft workspace are absent.
- Poultry Operations is configured as Poultry with Rearing & Breeding, Laying
  and Commercial Broiler LOBs. Feed Mill is Feed & Processing / Feed
  Production. Crop Production is Agriculture / Crop Farming.
- `manager@navfarm.demo` and `viewer@navfarm.demo` see the same assigned
  workspace identity but different mutation controls. Viewer can read the
  supported Operations page; only Manager can record.
- Company Administrator, Tenant Administrator, Accountant, Auditor and
  no-workspace fixtures gain no operational entry from the switcher without a
  separate active workspace membership.
