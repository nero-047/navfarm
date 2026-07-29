# Demo Account Access Matrix

Status: implemented mock-demo fixtures. Source:
`apps/web/src/server/api/mock-repository.ts`. “Explicit” means the fixture
declares the membership and permission array directly; none are derived from
email, username, tenant/company role fallback, or a default workspace.

| Email | Explicit scopes | Landing route | Operational result | Intentional denial |
| --- | --- | --- | --- | --- |
| `system@navfarm.demo` | Platform only | `/admin/dashboard` | None | All company/workspace access |
| `tenant@navfarm.demo` | Tenant Admin + Green Valley company administration; no workspace | `/console/dashboard` | None | Workspace operations/mutations |
| `companyadmin@navfarm.demo` | Green Valley company administration; no workspace | `/green-valley-poultry/overview` | None | Workspace operations/mutations |
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
