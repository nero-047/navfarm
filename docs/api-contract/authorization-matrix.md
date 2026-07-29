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
- `traceability.manage`
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
| Company Admin (`ADMIN`) | Company | company configuration/accounting defaults | Used by multi-company and MFA demo users. Does not itself grant workspace operations. |
| Super Admin (`SUPER_ADMIN`) | Company | all company permissions | Used for onboarding admin company setup. |
| Operations Manager (`FARM_MANAGER`) | Company membership plus assigned workspace | `company.view`; operational permissions are resolved from workspace membership | Can execute the Phase 7 flow only in assigned workspaces. No finance view/manage. |
| Accountant (`ACCOUNTANT`) | Company | Fixture: `company.view`, `costs.view`, `finance.view`, `finance.manage`, `audit.view` | No workspace membership or operational capability. |
| Auditor (`AUDITOR`) | Company | Fixture: `company.view`, `costs.view`, `finance.view`, `audit.view` | Read-only company/audit scope; no workspace membership. |
| Supervisor (`SUPERVISOR`) | Company | Catalogue role only | Company role does not confer operations; an explicit workspace membership must carry capabilities. |
| Viewer (`VIEWER`) | Company | Fixture: `company.view` | Workspace read capabilities exist only on the separate Viewer workspace membership. |
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
- Role names are descriptive metadata. The mock session and mutation repository
  authorize only the explicit permission arrays on the active membership; there
  is no tenant-role or company-role operational fallback.

## Route Guard Expectations

| Scope | Frontend shell | Backend enforcement |
|---|---|---|
| Platform | `/admin/*` | Require `SYSTEM_ADMIN`; otherwise 403. |
| Tenant | `/console/*` | Require active tenant and `tenant.view`. |
| Company | `/{company}/settings`, `/masters`, `/accounting`, `/setup` | Require active company membership and company configuration capability. |
| Workspace | `/{company}/workspaces/{workspace}/{dashboard|batches|operations|quality|traceability|resources|costing|reports|masters|settings}` | Require matching tenant/company/workspace membership and active context. |
| Operational mutations | workspace batch/QC/QR/resources close/write routes | Require the relevant workspace capability; tenant/company administration alone is insufficient. |
| Configuration mutations | setup, masters, NOB/LOB, accounting config | Require `company.manage` or explicit tenant-admin setup authority. |

Operational API denials use `CAPABILITY_REQUIRED`. Scope failures use
`TENANT_MEMBERSHIP_REQUIRED`, `COMPANY_NOT_IN_TENANT`,
`COMPANY_MEMBERSHIP_REQUIRED`, `WORKSPACE_NOT_IN_COMPANY`,
`WORKSPACE_MEMBERSHIP_REQUIRED`, the relevant inactive/suspended code, or
`STALE_CONTEXT`.

This matrix is implemented in the mock frontend boundary and documents the
future backend contract; the real backend enforcement is still missing.
