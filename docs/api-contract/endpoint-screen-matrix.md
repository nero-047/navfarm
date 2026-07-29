# Endpoint Screen Matrix

This matrix maps implemented web screens and actions to required API endpoints. Schema names refer to Zod contracts in `apps/web/src/contracts` and `apps/web/src/modules/farm-demo/operational-contracts.ts`.

| Frontend route | Screen/action | Endpoint | Method | Permission | Request schema | Response schema | Loading/error/empty behavior | Mock implementation |
|---|---|---:|---|---|---|---|---|---|
| `/login` | Sign in | `/api/v1/auth/login` | POST | none | `authLoginRequestSchema` | `authSessionSchema \| mfaChallengeSchema` | Shows auth error; MFA challenge redirects to verify without creating an app session | `mock-repository.ts` |
| `/mfa/verify` | Verify MFA | `/api/v1/auth/mfa/verify` | POST | MFA challenge | `{ challengeId, code }` | `authSessionSchema` | Invalid code alert | `mock-repository.ts` |
| `/mfa/recovery` | Recovery code | `/api/v1/auth/mfa/recovery` | POST | MFA challenge | `{ challengeId, recoveryCode }` | `authSessionSchema` | Invalid code alert | `mock-repository.ts` |
| all protected routes | Refresh session | `/api/v1/auth/session` | GET | authenticated | none | `authSessionSchema` | Loading shell; 401 returns to login | `mock-repository.ts` |
| shell/profile menu | Logout | `/api/v1/auth/logout` | POST | authenticated | none | `successSchema` | Redirects to login | `mock-repository.ts` |
| `/context-selection` | Select Company administration or assigned Workspace (no tenant selector) | `/api/v1/auth/context` | PUT | explicit membership | `authContextRequestSchema`: full `{ tenantId, companyId, workspaceId }` tuple | `authSessionSchema` | Client commits only after success; specific ownership/membership/status error codes | `mock-repository.ts` |
| `/company-selection` | Retired selection flow | n/a | redirect | authenticated | n/a | n/a | Server redirect to `/context-selection` only | n/a |
| `/profile` | Update profile | `/api/v1/users/me` | PATCH | authenticated | `{ fullName, language, timezone }` | `authSessionSchema` | Shows form error | `mock-repository.ts` |
| `/admin/dashboard` | Platform dashboard | `/api/v1/platform/dashboard` | GET | `platform.manage` | none | `platformDashboardSchema` | Loading/error/metric cards | `phase2-repository.ts` |
| `/admin/tenants` | Tenant registry | `/api/v1/platform/tenants` | GET | `tenant.view` plus platform | query page/filter | `platformTenantListSchema` | Empty table when no tenants | `phase2-repository.ts` |
| `/admin/tenants/new` | Create tenant wizard | `/api/v1/platform/tenants` | POST | `tenant.manage` plus platform | `createTenantSchema` | `platformTenantSchema` | Step validation errors | `phase2-repository.ts` |
| `/admin/tenants/[tenantId]/*` | Tenant details | `/api/v1/platform/tenants/{tenantId}` | GET/PATCH | `tenant.view/manage` plus platform | `tenantPatchSchema` | `platformTenantSchema` | Not found/forbidden panels | `phase2-repository.ts` |
| `/admin/tenants/[tenantId]/companies` | Platform company list | `/api/v1/platform/tenants/{tenantId}/companies` | GET | platform | none | `companySummarySchema[]` | Empty company list | `phase2-repository.ts` |
| `/admin/tenants/[tenantId]/users` | Platform user list | `/api/v1/platform/tenants/{tenantId}/users` | GET | platform | none | `tenantUserSchema[]` | Empty user list | `phase2-repository.ts` |
| `/admin/tenants/[tenantId]/audit` | Platform audit | `/api/v1/platform/tenants/{tenantId}/audit` | GET | platform | none | `platformAuditSchema` | Empty audit list | `phase2-repository.ts` |
| `/admin/plans` | Plans | `/api/v1/platform/plans` | GET | platform | none | `planSchema[]` | Empty state | `phase2-repository.ts` |
| `/admin/masters/*` | Platform NOB/LOB/modules/reference data | `/api/v1/platform/masters/{section}` | GET | platform | none | template schemas | Error panel | `phase3-repository.ts` |
| `/console/dashboard` | Tenant dashboard | `/api/v1/tenants/{tenantId}/dashboard` | GET | `tenant.view` | none | `tenantDashboardSchema` | Limit warnings/empty lists | `phase2-repository.ts` |
| `/console/companies` | Tenant companies | `/api/v1/tenants/{tenantId}/companies` | GET | `tenant.view` | none | `companySummarySchema[]` | Empty list | `phase2-repository.ts` |
| `/console/companies/new` | Create company | `/api/v1/tenants/{tenantId}/companies` | POST | `tenant.manage` | `createCompanySchema` | `companySummarySchema` | Validation errors | `phase2-repository.ts` |
| `/console/users` | Tenant users | `/api/v1/tenants/{tenantId}/users` | GET | `users.view` | none | `tenantUserSchema[]` | Empty table | `phase2-repository.ts` |
| `/console/invitations` | Invitations | `/api/v1/tenants/{tenantId}/invitations` | GET/POST | `users.view/manage` | `createInvitationSchema` | `invitationSchema[]`/`invitationSchema` | Empty table/errors | `phase2-repository.ts` |
| `/console/roles` | Tenant roles | `/api/v1/tenants/{tenantId}/roles` | GET | `roles.view` | none | `roleSummarySchema[]` | Empty roles list | `phase2-repository.ts` |
| `/console/audit` | Tenant audit | `/api/v1/tenants/{tenantId}/audit` | GET | `audit.view` | none | `platformAuditSchema` | Empty audit list | `phase2-repository.ts` |
| `/{company}/setup/*` | Onboarding status | `/api/v1/companies/{companyId}/setup/status` | GET | `company.view` | none | `setupStatusSchema` | Blocks/review panel | `company-setup-repository.ts` |
| `/{company}/setup/profile` | Company profile | `/api/v1/companies/{companyId}/setup/profile` | GET/PATCH | `company.manage` for PATCH | `setupProfileSchema` | `setupProfileSchema` | Form errors | `company-setup-repository.ts` |
| `/{company}/setup/addresses` | Addresses | `/api/v1/companies/{companyId}/setup/addresses` | GET/POST/PATCH/DELETE | `company.manage` for mutation | `addressSchema` | `addressSchema[]`/`addressSchema` | Empty addresses | `company-setup-repository.ts` |
| `/{company}/setup/contacts` | Contacts | `/api/v1/companies/{companyId}/setup/contacts` | GET/POST/PATCH/DELETE | `company.manage` for mutation | `contactSchema` | `contactSchema[]`/`contactSchema` | Empty contacts | `company-setup-repository.ts` |
| `/{company}/setup/localization` | Language/currency/timezone | `/api/v1/companies/{companyId}/setup/localization` | GET/PATCH | `company.manage` for PATCH | `localizationSchema` | `localizationSchema` | Form errors | `company-setup-repository.ts` |
| `/{company}/setup/fiscal` | Fiscal setup | `/api/v1/companies/{companyId}/setup/fiscal` | GET/PATCH | `company.manage` for PATCH | `fiscalSchema` | `fiscalSchema` | Validation errors | `company-setup-repository.ts` |
| `/{company}/setup/modules` | Modules | `/api/v1/companies/{companyId}/setup/modules` | GET/PATCH | `company.manage` for PATCH | `moduleSelectionSchema` | `moduleSelectionSchema` | Requires at least one module | `company-setup-repository.ts` |
| `/{company}/setup/administrator` | Admin account | `/api/v1/companies/{companyId}/setup/administrator` | GET/PATCH | `company.manage` | `administratorSchema` | `administratorSchema` | Form errors | `company-setup-repository.ts` |
| `/{company}/setup/team` | Team | `/api/v1/companies/{companyId}/setup/team` | GET/POST/PATCH/DELETE | `users.manage` | `teamMemberSchema` | `teamMemberSchema[]`/`teamMemberSchema` | Empty list | `company-setup-repository.ts` |
| `/{company}/setup/review` | Complete setup | `/api/v1/companies/{companyId}/setup/complete` | POST | `company.manage` | none | `setupStatusSchema` | Disabled until ready | `company-setup-repository.ts` |
| `/{company}/profile` | View/edit legal company profile | `/api/v1/companies/{companyId}/setup/profile` | GET/PATCH | `company.view`; `company.manage` for PATCH | `setupProfileSchema` | `setupProfileSchema` | Loading, empty, validation, error, read-only, saved/dirty states | `company-setup-repository.ts` via `companyAdminClient` |
| `/{company}/settings`, `/settings/{section}` | Aggregate/edit localisation, fiscal, modules and notifications | `/api/v1/companies/{companyId}/settings` | GET/PATCH | `company.view`; `company.manage` for PATCH | `companySettingsMutationSchema` (one section) | `companySettingsSchema` | Loading/error/read-only/save confirmation/unsaved warning | `company-setup-repository.ts` via `companyAdminClient` |
| `/{company}/members` | Member list/detail and workspace summaries | `/api/v1/companies/{companyId}/members`, `/members/{userId}` | GET | `users.view` | none | `companyMemberListResponseSchema`, `companyMemberSchema` | Search/filter, desktop table, mobile cards, loading/error/empty | `company-admin-repository.ts` |
| `/{company}/members` | Invite/resend/cancel | `/api/v1/companies/{companyId}/invitations`, `/invitations/{invitationId}/{resend}` | GET/POST/DELETE | `users.view/manage` | `inviteCompanyMemberRequestSchema` | invitation schemas | Duplicate, validation, status, destructive confirmation | `company-admin-repository.ts` |
| `/{company}/members` | Company role/membership mutation | `/api/v1/companies/{companyId}/members/{userId}/{role|membership}` | PATCH | `users.manage`; role also `roles.manage` | company role/membership mutation schemas | `companyMemberSchema` | Reserved/custom role validation and confirmation | `company-admin-repository.ts` |
| `/{company}/members` | Add/change/remove workspace assignment | `/api/v1/companies/{companyId}/members/{userId}/workspace-assignments/{workspaceId?}` | POST/PATCH/DELETE | `users.manage` + `workspaces.manage` | workspace assignment/role mutation schemas | `companyMemberSchema` | Cross-company rejection, independent roles, destructive confirmation | `company-admin-repository.ts` |
| `/{company}/roles` | Company and workspace role catalogue | `/api/v1/companies/{companyId}/roles` | GET | `roles.view` | none | `companyRoleCatalogueSchema` | Permission matrix, role detail, custom role planned state | `company-admin-repository.ts` |
| `/{company}/readiness` | Company readiness aggregate | `/api/v1/companies/{companyId}/readiness` | GET | `company.view` | none | `companyReadinessAggregateSchema` | Separate sections, workspace links, non-blocking policy pending notes | `company-admin-repository.ts` |
| `/{company}/masters` | Master dashboard | `/api/v1/companies/{companyId}/masters` | GET | `company.view` | none | `masterDashboardSchema` | Loading/error category cards | `phase3-repository.ts` |
| `/{company}/masters/{resource}` | Master list/create/edit/status | `/api/v1/companies/{companyId}/masters/{resource}` and `/{recordId}` | GET/POST/PATCH | `company.view`; `company.manage` for mutation | resource schema | `masterListResponseSchema` or resource schema | Empty table/errors | `phase3-repository.ts` |
| `/{company}/masters/{resource}/import` | Import validation | `/api/v1/companies/{companyId}/masters/{resource}/import/validate` | POST | `company.manage`; Tenant Admin allowed setup config | `{ scenario }` now; production file metadata pending | `importPreviewSchema` | Preview or validation error | `phase3-repository.ts` |
| `/{company}/masters/{resource}/import` | Confirm import | `/api/v1/companies/{companyId}/masters/{resource}/import/confirm` | POST | `company.manage`; Tenant Admin allowed setup config | `{ importId }` | `importPreviewSchema` | Disabled with invalid rows | `phase3-repository.ts` |
| `/{company}/settings/business-structure` | NOB/LOB config | `/api/v1/companies/{companyId}/business-structure`, `/nobs`, `/lobs` | GET/POST/PATCH | `company.view/manage` | `companyNobSchema`, `companyLobSchema` variants | business structure schemas | Blocking issues shown | `phase3-repository.ts` |
| `/{company}/accounting/chart-of-accounts` | COA | `/api/v1/companies/{companyId}/accounting/accounts` | GET/POST/PATCH | `finance.view/manage` | `accountSchema` | `accountSchema[]`/`accountSchema` | Empty tree/errors | `phase3-repository.ts` |
| `/{company}/accounting/gl-mappings` | GL mappings | `/api/v1/companies/{companyId}/accounting/gl-mappings` | GET/POST/PATCH | `finance.view/manage` | `glMappingSchema` | `glMappingSchema[]`/`glMappingSchema` | Completeness/error cards | `phase3-repository.ts` |
| `/{company}/accounting/costing` | Costing config | `/api/v1/companies/{companyId}/accounting/costing` | GET/PATCH | `finance.view/manage` | partial `costingConfigurationSchema` | `costingConfigurationSchema` | Warnings for BIO_ASSET | `phase3-repository.ts` |
| `/{company}/accounting/readiness` | Company accounting readiness | `/api/v1/companies/{companyId}/accounting/readiness` | GET | `company.view` | none | `operationsReadinessSchema` | Accounting configuration ready/incomplete | `phase3-repository.ts` |
| `/{company}/workspaces` | List/select workspaces | `/api/v1/tenants/{tenantId}/companies/{companyId}/workspaces` | GET | tenant admin or explicit workspace membership | none | `workspaceSchema[]` | Loading, retry, empty/access state | `mock-repository.ts` |
| `/{company}/workspaces/new` | Create workspace | `/api/v1/tenants/{tenantId}/companies/{companyId}/workspaces` | POST | `canManageWorkspaces` | `workspaceCreateSchema` | `workspaceSchema` | Field/error/saving states | `mock-repository.ts` |
| `/{company}/workspaces/{workspace}` | Detail/edit/readiness/members | `/api/v1/tenants/{tenantId}/companies/{companyId}/workspaces/{workspaceId}`, `/readiness`, `/members` | GET/PATCH/POST | explicit workspace view; Company/Tenant admin for mutation | workspace update/member schemas | workspace/readiness/member schemas | Loading, retry, empty members | `mock-repository.ts`; old `/companies/...` form is compatibility-only |
| shell context switcher | Select Company administration or a workspace | `/api/v1/auth/context` | PUT | authorized tenant/company/workspace membership | full `{ tenantId, companyId, workspaceId }` tuple; `workspaceId: null` for company mode | `authSessionSchema` | Searchable authorized hierarchy; atomic context change | `mock-repository.ts` |
| canonical workspace dashboard/batches | Dashboard/bootstrap/list/create/save/transition | `/api/v1/tenants/{tenantId}/companies/{companyId}/workspaces/{workspaceId}/dashboard`, `/operational-bootstrap`, `/batches`, `/batches/{batchId}/transitions` | GET/POST/PUT | workspace view/batch capabilities | operational schemas | `workspaceDashboardSchema` and operational schemas | Workspace-isolated loading/errors | `operational-repository.ts` |
| canonical workspace operations/QC/QR | Daily operations, QC disposition, QR packs | same scoped root plus `/operations`, `/quality-lots`, `/qr-packs` | GET/POST/PUT | workspace operation/QC/traceability capabilities | operational schemas | operational schemas | Mutation controls follow workspace role | `operational-repository.ts` |
| canonical workspace resources/costing/reports | Resources/usages, costing, journals, variances, summary | same scoped root plus `/resources`, `/resource-usages`, `/costing`, `/journals`, `/variances`, `/reports/summary` | GET/POST/PUT | workspace resource/report capabilities | operational schemas | operational schemas | Empty collections and typed errors | `operational-repository.ts` |
| canonical Workspace Masters | Read workspace-owned operational masters | same scoped root plus `/masters` | GET | explicit active workspace membership | none | `workspaceMasterSchema[]` | Loading, retry, empty; no Company master mutation | `mock-repository.ts` |
| canonical Workspace Settings | Read identity, ownership, NOB/LOB/modules/readiness/member summary/current role | same scoped root plus `/settings` | GET | explicit active workspace membership | none | `workspaceSettingsSchema` | Loading, retry, read-only role state | `mock-repository.ts` |

Milestone 1 migrated `/admin/audit` and `/console/notifications` off the legacy
authentication helpers and removed the legacy company-selection client/cache
from live use. Other pre-existing legacy endpoints outside the changed
session/context surface remain: `/language`, `/currency`, `/setup/wizard/*`,
`/role/*`, `/user-company/*`, `/auth/change-password`, and
`/auth/register-admin`. They require later typed-contract migration or explicit
retirement before backend integration.

The Milestone 2 company-admin paths above are one documented frontend/mock
convention behind `companyAdminClient`. Their Zod request/response contracts
and runtime response validation are ready; durable users, invitations,
memberships, roles, settings, and readiness endpoints are not implemented by
the real backend. Final backend route/DTO mapping remains a handoff item rather
than a direct dependency on Arun's current routes.

Milestone 3 uses the nested tenant/company/workspace convention for every
changed workspace client call. The older company-only workspace-detail
endpoints remain response-compatible adapters for Milestone 2 callers but are
not the canonical backend handoff. Dashboard, Workspace Masters and Workspace
Settings endpoints are implemented only in the mock boundary; their durable
backend resources are missing. Costing/report values remain non-authoritative
demo projections and no production export is claimed.

Milestone 4 is a presentation-only consumer of this matrix. It introduces no
backend endpoints. Representative light/dark, responsive, loading/error, and
permission-state tests exercise the existing typed mock boundary, while real
session, workspace, costing, report, and public-trace implementations remain
missing.
