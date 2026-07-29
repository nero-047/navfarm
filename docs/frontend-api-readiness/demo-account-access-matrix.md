# Demo Account Access Matrix

Status: implemented mock-demo fixtures. Source:
`apps/web/src/server/api/mock-repository.ts`. “Explicit” means the fixture
declares the membership and permission array directly; none are derived from
email, username, tenant/company role fallback, or a default workspace.

| Email | Explicit scopes | Landing route | Operational result | Intentional denial |
| --- | --- | --- | --- | --- |
| `system@navfarm.demo` | Platform only | `/admin/dashboard` | None | All company/workspace access |
| `tenant@navfarm.demo` | Tenant Admin + Green Valley Profile/Members/Roles/Settings/Readiness/workspace administration; no workspace | `/console/dashboard` | None | Workspace operations/mutations |
| `companyadmin@navfarm.demo` | Green Valley Profile/Members/Roles/Settings/Readiness/workspace administration; no workspace | `/green-valley-poultry/overview` | None until explicitly assigned | Workspace operations/mutations without explicit assignment |
| `accountant@navfarm.demo` | Green Valley finance/readiness; no workspace | `/green-valley-poultry/accounting/readiness` | None | Batch/QC/QR/resource mutations |
| `auditor@navfarm.demo` | Green Valley company/finance/audit read; no workspace | `/green-valley-poultry/overview` | None | All operational mutations |
| `manager@navfarm.demo` | Green Valley + Poultry Operations Manager | `/green-valley-poultry/workspaces/poultry-operations/dashboard` | Explicit batch, operation, quality, traceability, resource, report capabilities | Other companies/workspaces |
| `viewer@navfarm.demo` | Green Valley + Poultry Operations Viewer | same workspace dashboard | Explicit reads only | Mutation controls hidden; API returns `CAPABILITY_REQUIRED` |
| `multi@navfarm.demo` | Explicit active/inactive companies and explicit per-workspace roles across two tenant memberships | `/context-selection` | Only selected active assigned workspace capabilities | Inactive/mismatched/unassigned contexts |
| `mfa@navfarm.demo` | Green Valley Admin + Poultry Manager, disclosed only after MFA | `/context-selection` after verification | Explicit workspace capabilities after selection | All protected access before verification |
| `onboarding@navfarm.demo` | BlueWater company Admin + draft Aquaculture workspace | `/bluewater-aqua/setup/profile` | Blocked by setup/readiness | Operational routes |
| `suspended@navfarm.demo` | Suspended tenant membership | `/access-denied?reason=account_suspended` | None | All protected data/navigation |
| `noworkspace@navfarm.demo` | Green Valley company Viewer; no workspace | `/green-valley-poultry/workspaces` | None | No-workspace state |
| `nocompany@navfarm.demo` | Tenant read only | `/console/dashboard` | None | Company/workspace access |

Refresh restores the complete valid tuple through `AuthProvider`. Logout
destroys the process-memory session/cookie and clears all context. These are
frontend mock behaviors; persistent accounts, memberships, and permissions
remain a backend requirement.

Milestone 2 mutations reuse these same fixture records. Tenant/Company Admin
may administer explicit workspace assignments but still receives no implicit
operational membership. Accountant, Auditor and Viewer member/assignment
mutations return `CAPABILITY_REQUIRED`; Auditor may view documented company
settings/readiness in a read-only state.

Milestone 3 uses the same fixture graph as the authenticated session,
Company/Workspace switcher, workspace administration, workspace settings and
operational mock APIs. Reset restores that one canonical graph. A context
change is committed only after `PUT /auth/context` returns a valid session;
failed selections retain the previous complete tuple. Safe workspace switches
preserve only supported list-level modules and intentionally drop record IDs
or fall back to the destination workspace dashboard.
