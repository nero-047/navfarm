# Authorization Matrix

Source of truth: `apps/web/src/lib/authorization.ts`, `authSessionSchema`, and Phase 7.1 E2E role scenarios.

## Permission Codes

Current granular permissions:

- `platform.manage`
- `tenant.view`
- `tenant.manage`
- `company.view`
- `company.manage`
- `users.view`
- `users.manage`
- `roles.view`
- `roles.manage`
- `batches.view`
- `batches.create`
- `batches.approve`
- `operations.create`
- `costs.view`
- `finance.view`
- `finance.manage`
- `quality.view`
- `quality.manage`
- `traceability.view`
- `resources.view`
- `resources.manage`
- `reports.export`
- `audit.view`
- `notifications.manage`
- `workspaces.view`
- `workspaces.manage`
- `batches.close`

## Platform Roles

| Role | Scope | Permissions | Notes |
|---|---|---|---|
| Platform Admin (`SYSTEM_ADMIN`) | Platform | `platform.manage`, `tenant.view`, `tenant.manage`, all company permissions for platform oversight | Outside ordinary company RBAC. Can access `/admin/*`; ordinary tenant users must be redirected/403. |
| Platform Support (`PLATFORM_SUPPORT`) | Platform | Defined enum only; no frontend behavior currently implemented | Unresolved role behavior. |

## Tenant Roles

| Role | Scope | Permissions | Confirmed behavior |
|---|---|---|---|
| Tenant Admin (`TENANT_ADMIN`) | Active tenant | tenant/company/workspace configuration capabilities | May list, create and configure workspaces and memberships. Has no operational workspace membership or mutation capability unless separately assigned. |
| Tenant Member (`TENANT_MEMBER`) | Active tenant | No tenant-admin permissions by default | Company permissions depend on company membership. |
| Tenant Viewer/Billing | Tenant | Not represented as a concrete frontend enum yet | If added, split read-only tenant summary and billing/subscription actions explicitly. |

## Company Roles

| Role | Scope | Permissions | Confirmed behavior |
|---|---|---|---|
| Company Admin (`ADMIN`) | Company | all company permissions | Used by multi-company and MFA demo users. Company scoped only. |
| Super Admin (`SUPER_ADMIN`) | Company | all company permissions | Used for onboarding admin company setup. |
| Operations Manager (`FARM_MANAGER`) | Company | `company.view`, `batches.view`, `batches.create`, `batches.approve`, `operations.create`, `costs.view`, `quality.view`, `quality.manage`, `traceability.view`, `resources.view`, `resources.manage`, `reports.export` | Can execute Phase 7 batch/operation/QC/QR/close/report flow in Green Valley. No finance view/manage. |
| Accountant (`ACCOUNTANT`) | Company | `company.view`, `batches.view`, `costs.view`, `finance.view`, `finance.manage`, `reports.export`, `audit.view` | Used by tenant admin active company membership, but tenant-admin setup rights are tenant-scoped. |
| Auditor (`AUDITOR`) | Company | `company.view`, `batches.view`, `costs.view`, `finance.view`, `quality.view`, `traceability.view`, `resources.view`, `reports.export`, `audit.view` | Read-oriented access to accounting/masters tests; no create controls. |
| Supervisor (`SUPERVISOR`) | Company | `company.view`, `batches.view`, `batches.create`, `operations.create`, `quality.view`, `traceability.view`, `resources.view` | Existing role, not a Phase 7.1 demo account. |
| Viewer (`VIEWER`) | Company | `company.view`, `batches.view`, `quality.view`, `traceability.view`, `resources.view` | Genuinely read-only. No batch create/manage, operation recording, QC creation, or mutation API access. |
| Custom (`CUSTOM`) | Company | Explicit permissions array | No default permissions. |

## Scope Rules

- Platform Admin is outside company RBAC and must not be granted by company membership alone.
- Tenant Admin setup permissions do not imply operational mutation permissions.
- Company configuration permissions apply only to `activeCompanyId`.
- Operational permissions apply only to an explicit workspace membership and `activeWorkspaceId`.
- Every operational request validates the complete `(activeTenantId, activeCompanyId, activeWorkspaceId)` tuple and stored workspace ownership.
- Multi-company users must select context before company work unless a single active company is selected.
- Backend must filter all company collections by both tenant membership and company membership.
- A user with one company must not see records from another company unless their membership includes it.
- Suspended tenants cannot access tenant/company workspaces.

## Route Guard Expectations

| Scope | Frontend shell | Backend enforcement |
|---|---|---|
| Platform | `/admin/*` | Require `SYSTEM_ADMIN`; otherwise 403. |
| Tenant | `/console/*` | Require active tenant and `tenant.view`. |
| Company | `/{company}/settings`, `/masters`, `/accounting`, `/setup` | Require active company membership and company configuration capability. |
| Workspace | `/{company}/workspaces/{workspace}/*` | Require matching tenant/company/workspace membership and active context. |
| Operational mutations | workspace batch/QC/QR/resources close/write routes | Require the relevant workspace capability; tenant/company administration alone is insufficient. |
| Configuration mutations | setup, masters, NOB/LOB, accounting config | Require `company.manage` or explicit tenant-admin setup authority. |
