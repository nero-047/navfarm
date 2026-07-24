# NAVFarm API coverage

This is the contract inventory for the existing web demo and the required
NAVFarm product surface. Browser requests must use same-origin `/api/v1/*`.
The Next.js boundary runs in `mock`, `proxy`, or development-only `hybrid`
mode. `NAVFARM_API_UPSTREAM_URL` is server-only.

Legend:

- **Consumed**: an existing page calls the endpoint.
- **Seeded**: the in-process mock repository provides a useful response.
- **Pass-through**: the mock accepts mutations so existing demo flows remain
  usable; a domain-specific response contract is still required.
- **Required**: documented product behavior not yet consumed by a completed UI.

## Existing web calls

| Area | Method and `/api/v1` path | Coverage |
| --- | --- | --- |
| Auth | `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` | Consumed, runtime contracts, seeded HTTP-only session |
| Auth/users | `GET /auth/users`, `POST /auth/register-admin` | Consumed; read seeded, mutation pass-through |
| Tenants | `GET /tenant`, `POST /tenant/signup` | Consumed, seeded/pass-through |
| Tenants | `GET/PATCH /tenant/{tenantId}` | Consumed, seeded/pass-through |
| Tenants | `GET /tenant/{tenantId}/companies`, `GET /tenant/{tenantId}/users` | Consumed; users seeded, companies require canonicalization to `/company/tenant/{tenantId}` |
| Tenants | `POST /tenant/{tenantId}/change-plan` | Consumed, pass-through |
| Plans | `GET/POST /plan`, `PUT /plan/{planId}` | Consumed; read seeded, mutation pass-through |
| Companies | `GET /company/tenant/{tenantId}` | Consumed, runtime contract, seeded |
| Companies | `POST /company` | Consumed, runtime contract, seeded |
| Languages | `GET/POST /language` | Consumed; read runtime contract/seeded, mutation pass-through |
| Currencies | `GET/POST /currency` | Consumed; read runtime contract/seeded, mutation pass-through |
| NOB | `GET/POST /setup/wizard/nobs`, `DELETE /setup/wizard/nobs/{nobId}` | Inactive compatibility only after Phase 3 |
| LOB | `GET /setup/wizard/lobs/{nobId}`, `POST /setup/wizard/lobs`, `DELETE /setup/wizard/lobs/{lobId}` | Inactive compatibility only after Phase 3 |
| Legacy setup | `/setup/wizard/status`, `/company-details`, `/step-*`, `/complete`, `/upload-logo` | Retained compatibility handlers; inactive after migration to company setup contracts |
| Users | `GET/PUT/DELETE /user/{userId}`, `GET /user/company/{companyId}` | Consumed; reads partly seeded, mutations pass-through |
| User-company | `GET /user-company/{userId}/companies`, `GET /user-company/company/{companyId}/members` | Consumed, seeded |
| User-company | `POST /user-company/assign`, `DELETE /user-company/assign/{assignmentId}` | Consumed, pass-through |
| Roles | `GET /role/company/{companyId}`, `POST /role/create`, `PUT/DELETE /role/{roleId}` | Consumed; read seeded, mutations pass-through |
| Roles | `GET/POST /role/permissions/{roleId}`, `POST /role/assign`, `DELETE /role/assign/{assignmentId}` | Consumed; read seeded, mutations pass-through |
| Notifications | `GET /notification/company/{companyId}`, `GET /notification/logs/{companyId}` | Consumed, seeded |
| Notifications | `POST /notification`, `PUT /notification/{notificationId}`, `POST /notification/test` | Consumed, pass-through |
| Audit | `GET /audit-log` | Consumed, seeded |
| Demo repository | `GET/PUT /demo/companies/{companySlug}/state` | Consumed, runtime contract, seeded; replaces operational localStorage |

## Required domain endpoints

These are derived from the functional document and current Final_Docs domain
catalog. They are intentionally contracts to design, not invented backend
implementations.

| Domain | Required versioned endpoints |
| --- | --- |
| Company setup | `GET/PATCH /companies/{companyId}/profile`; `GET/PUT /companies/{companyId}/addresses`; `GET/PUT /companies/{companyId}/contacts`; `GET/PUT /companies/{companyId}/localization`; `GET/PUT /companies/{companyId}/fiscal`; `GET/PUT /companies/{companyId}/modules`; `GET /companies/{companyId}/setup-status` |
| NOB/LOB config | Implemented Phase 3 platform template and company NOB/LOB endpoints below |
| Master data | Implemented Phase 3 CRUD/lifecycle/import/export pattern below; scheduler definitions remain Phase 4 |
| GL mapping | Implemented Phase 3 `/accounting/accounts`, `/accounting/gl-mappings`, `/accounting/costing`, and `/accounting/readiness` |
| Batches | `GET/POST /companies/{companyId}/batches`; `GET/PATCH /companies/{companyId}/batches/{batchId}`; `POST /.../{batchId}/approve`; `POST /.../{batchId}/pause`; `POST /.../{batchId}/resume`; `POST /.../{batchId}/close`; `GET/PUT /.../{batchId}/inputs` |
| Daily operations | `GET/POST /companies/{companyId}/batches/{batchId}/entries`; `GET/PATCH/DELETE /.../entries/{entryId}`; `GET /.../{batchId}/journals` |
| Inventory/costing | `GET /companies/{companyId}/inventory/lots`; `GET /.../lots/{lotId}/layers`; `GET /batches/{batchId}/wip`; `GET /batches/{batchId}/cost-summary`; `GET /batches/{batchId}/variances` |
| Quality control | `GET/POST /companies/{companyId}/quality/lots`; `GET/PATCH /.../quality/lots/{qualityLotId}`; `POST /.../{qualityLotId}/hold`; `POST /.../{qualityLotId}/pass`; `POST /.../{qualityLotId}/fail` |
| QR traceability | `GET/POST /companies/{companyId}/qr/packs`; `GET /qr/packs/{packId}`; `GET /trace/{publicCode}`; `GET /batches/{batchId}/genealogy` |
| Resources | CRUD at `/companies/{companyId}/resources`; `GET/POST /companies/{companyId}/resource-allocations`; `PATCH /.../resource-allocations/{allocationId}` |
| Scheduler/KPI | CRUD at `/companies/{companyId}/schedules`; `GET /companies/{companyId}/kpis`; `GET /batches/{batchId}/kpis`; `GET/PATCH /companies/{companyId}/alerts/{alertId}` |
| Slaughter/output split | `GET/PUT /companies/{companyId}/cost-split-rules`; `GET/POST /batches/{batchId}/outputs`; `GET /batches/{batchId}/yield-summary` |
| Reporting | `GET /companies/{companyId}/reports/batch-summary`; `/profit-and-loss`; `/variance`; `/inventory-valuation`; `/traceability`; `/kpi`; export variants should use content negotiation or `/exports` jobs |
| Audit/notifications | `GET /companies/{companyId}/audit-events`; `GET/PUT /companies/{companyId}/notification-settings`; `GET /companies/{companyId}/notification-deliveries` |

## Contract gaps and migration notes

1. The older backend uses singular nouns (`/company`, `/tenant`, `/role`) and
   setup-step RPC paths. They remain proxied for compatibility. Active Phase 2
   pages use the resource-oriented contracts listed below. Phase 3 removed
   active admin and onboarding use of `/setup/wizard/nobs` and
   `/setup/wizard/lobs`; the handlers remain for inactive legacy source.
2. Runtime schemas cover auth sessions, Phase 2 platform and tenant resources,
   all active company setup resources, companies, NOBs, languages, currencies,
   normalized errors, and the demo state repository. Other legacy
   calls pass through untyped to avoid silently removing functionality; each is
   listed above so the remaining contract work is visible.
3. Mock persistence is process memory. Restarting the dev server resets it.
   This is deliberate demo behavior and must not be represented as durable
   production persistence.
4. Hybrid mode never falls back for validation, authentication, permission,
   network, timeout, or server failures. Development fallback is limited to
   404/501 responses whose exact `METHOD /path` appears in
   `NAVFARM_HYBRID_MOCK_ENDPOINTS`.

## Phase 1 authentication and user APIs

| Method and route | Request contract | Response contract | Permission | Mock status | Frontend status | Backend status |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /auth/login` | `{email,password}` | `AuthSession` or MFA challenge; sets HTTP-only cookie | Public | Complete | Complete | Proxy-compatible, upstream pending |
| `POST /auth/logout` | Empty | `{success}`; clears cookie | Session | Complete | Complete | Proxy-compatible, upstream pending |
| `GET /auth/session` | Cookie | `AuthSession` | Session | Complete | Complete | Proxy-compatible, upstream pending |
| `PUT /auth/context` | `{tenantId,companyId}` | `AuthSession` | Membership | Complete | Complete | Proxy-compatible, upstream pending |
| `POST /auth/forgot-password` | `{email}` | `{success}` | Public | Complete, non-enumerating | Complete | Upstream pending |
| `POST /auth/reset-password` | `{token,password}` | `{success}` | Valid reset token | Complete demo | Complete | Upstream pending |
| `POST /auth/accept-invitation` | `{token,fullName,password}` | `{success}` | Valid invitation | Complete demo | Complete | Upstream pending |
| `POST /auth/verify-email` | `{token}` | `{success}` | Valid verification token | Complete demo | Complete | Upstream pending |
| `POST /auth/mfa/setup` | `{code}` | `{success}` | Session | Complete demo | Complete | Upstream pending |
| `POST /auth/mfa/verify` | `{challengeId,code}` | `AuthSession`; sets cookie | Valid challenge | Complete (`123456`) | Complete | Upstream pending |
| `POST /auth/mfa/recovery` | `{challengeId,recoveryCode}` | `AuthSession`; sets cookie | Valid challenge | Complete (`NAVFARM-RECOVERY`) | Complete | Upstream pending |
| `POST /auth/change-password` | `{currentPassword,newPassword}` | `{success}` | Session | Pass-through | Complete | Upstream pending |
| `PATCH /users/me` | Profile/preferences fields | `AuthSession` | Session | Complete | Complete | Upstream pending |
| `POST /__mock/reset` | Empty | `{success}` | Development/test configuration only | Complete, production-disabled | Not exposed in UI | Not applicable |

## Phase 2 platform administration APIs

| Method and route | Purpose | Contract/mock/frontend status |
| --- | --- | --- |
| `GET /platform/dashboard` | Platform KPIs, trends, alerts, and activity | Complete |
| `GET/POST /platform/tenants` | Filtered tenant directory and tenant creation | Complete |
| `GET/PATCH /platform/tenants/{tenantId}` | Tenant overview and profile changes | Complete |
| `POST /platform/tenants/{tenantId}/{activate|suspend|reactivate}` | Tenant lifecycle | Complete |
| `GET/PATCH /platform/tenants/{tenantId}/subscription` | Plan and billing state | Complete |
| `GET/PATCH /platform/tenants/{tenantId}/limits` | Entitlement limits | Complete |
| `GET /platform/tenants/{tenantId}/{companies|users|audit}` | Tenant drill-down collections | Complete |
| `GET /platform/{companies|users|usage|audit}` | Cross-tenant platform views | Complete |
| `GET /platform/plans`, `GET /platform/plans/{planId}` | Plan catalogue and detail | Complete |

All endpoints require a system-administrator session. Collection responses
support the documented search, filter, sort, and pagination contract.

## Phase 2 tenant administration APIs

| Method and route | Purpose | Contract/mock/frontend status |
| --- | --- | --- |
| `GET/PATCH /tenants/{tenantId}` | Tenant profile | Complete |
| `GET /tenants/{tenantId}/dashboard` | Tenant KPIs and warnings | Complete |
| `GET /tenants/{tenantId}/{usage|subscription|audit}` | Usage, subscription, audit | Complete |
| `GET/POST /tenants/{tenantId}/companies` | Company directory and creation | Complete; limit enforced |
| `GET /tenants/{tenantId}/companies/{companyId}` | Company summary | Complete |
| `GET /tenants/{tenantId}/users` | Tenant users | Complete |
| `GET/POST /tenants/{tenantId}/invitations` | Invitation directory and creation | Complete; limit enforced |
| `POST /tenants/{tenantId}/invitations/{invitationId}/resend` | Resend invitation | Complete |
| `DELETE /tenants/{tenantId}/invitations/{invitationId}` | Revoke invitation | Complete |
| `GET /tenants/{tenantId}/roles` | Tenant role catalogue | Complete |

## Phase 2 company setup APIs

All active onboarding requests are below
`/companies/{companyId}/setup`. Each resource has a shared runtime-validated
TypeScript request/response contract and uses the normalized API error shape.

| Method and suffix | Purpose | Status |
| --- | --- | --- |
| `GET /status`, `POST /complete` | Readiness and final completion | Complete |
| `GET/PATCH /profile` | Company identity and registration | Complete |
| `GET/POST /addresses`, `PATCH/DELETE /addresses/{addressId}` | Addresses | Complete |
| `GET/POST /contacts`, `PATCH/DELETE /contacts/{contactId}` | Contacts | Complete |
| `GET/PATCH /localization` | Language, currency, timezone, region | Complete |
| `GET/PATCH /fiscal` | Fiscal calendar and costing defaults | Complete |
| `GET/PATCH /modules` | Enabled modules | Complete |
| `GET/PATCH /administrator` | Primary administrator | Complete |
| `GET/POST /team`, `PATCH/DELETE /team/{memberId}` | Initial team | Complete |
| `GET/PATCH /chart-of-accounts` | COA/GL readiness | Complete |
| `GET/PATCH /business-structure` | NOB/LOB configuration | Complete |
| `GET/PATCH /essential-masters` | UOM, item, breed, location, resource readiness | Complete |
| `GET/PATCH /notifications` | Notification preferences | Complete |

The temporary readiness split is explicit: steps 1–9 establish workspace
readiness; chart of accounts, business structure, and essential masters
establish operations readiness. The policy is centralized in
`apps/web/src/lib/readiness-policy.ts`.

## Phase 3 platform reference APIs

| Method and route | Purpose | Status |
| --- | --- | --- |
| `GET /platform/masters/nobs` | RAK-backed NOB template catalogue | Complete |
| `GET /platform/masters/lobs` | LOB templates, permitted costing methods and dependencies | Complete |
| `GET /platform/masters/modules` | Supported module catalogue | Complete |
| `GET /platform/masters/reference-data` | Languages, currencies and timezones | Complete |

## Phase 3 company NOB/LOB APIs

| Method and route | Purpose | Status |
| --- | --- | --- |
| `GET /companies/{companyId}/business-structure` | Completeness, blockers, company NOBs and LOBs | Complete |
| `GET/POST /companies/{companyId}/nobs` | List or enable a company NOB | Complete |
| `PATCH /companies/{companyId}/nobs/{companyNobId}` | Company code/name changes | Complete |
| `POST /companies/{companyId}/nobs/{companyNobId}/{activate\|deactivate}` | Lifecycle with dependency conflict | Complete |
| `GET/POST /companies/{companyId}/lobs` | List or enable a permitted LOB | Complete |
| `PATCH /companies/{companyId}/lobs/{companyLobId}` | Company LOB changes | Complete |
| `POST /companies/{companyId}/lobs/{companyLobId}/{activate\|deactivate}` | Lifecycle with dependency conflict | Complete |

## Phase 3 company master-data APIs

The collection/detail/create/update/activate/deactivate pattern is complete for
the strict resource schemas `uoms`, `uom-conversions`, `item-categories`,
`items`, `attributes`, `breeds`, `locations`, `resources`,
`operational-parameters`, and `qc-parameters`.

| Method and route | Purpose | Status |
| --- | --- | --- |
| `GET /companies/{companyId}/masters` | Counts, state, blockers, permissions and import availability | Complete |
| `GET/POST /companies/{companyId}/masters/{resource}` | Search/filter/sort/page collection and create | Complete |
| `GET/PATCH /companies/{companyId}/masters/{resource}/{id}` | Detail and update | Complete |
| `POST /companies/{companyId}/masters/{resource}/{id}/{activate\|deactivate}` | Non-destructive lifecycle | Complete |
| `GET /companies/{companyId}/masters/{resource}/import-template` | CSV template metadata/content | Complete demo contract |
| `POST /companies/{companyId}/masters/{resource}/import/validate` | Validation preview | Complete demo contract |
| `POST /companies/{companyId}/masters/{resource}/import/confirm` | Confirm a valid preview | Complete demo contract |
| `GET /companies/{companyId}/masters/imports/{importId}` | Import status | Complete |
| `GET /companies/{companyId}/masters/{resource}/export` | CSV export payload | Complete demo contract |

CSV parsing/storage and XLSX generation remain backend prerequisites. The mock
models deterministic valid, partial, and invalid previews without pretending
to persist uploaded files.

## Phase 3 accounting APIs

| Method and route | Purpose | Status |
| --- | --- | --- |
| `GET/POST /companies/{companyId}/accounting/accounts` | Chart of accounts collection/create | Complete |
| `GET/PATCH /companies/{companyId}/accounting/accounts/{accountId}` | Account detail/update | Complete |
| `POST /companies/{companyId}/accounting/accounts/{accountId}/{activate\|deactivate}` | Lifecycle/dependency validation | Complete |
| `GET/POST /companies/{companyId}/accounting/gl-mappings` | Supported event mapping collection/create | Complete |
| `PATCH /companies/{companyId}/accounting/gl-mappings/{mappingId}` | Update mapping | Complete |
| `GET/PATCH /companies/{companyId}/accounting/costing` | `STANDARD`, `FIFO`, `BIO_ASSET` policy | Complete |
| `GET /companies/{companyId}/accounting/readiness` | Resource-derived operations readiness | Complete |

Phase 3 does not calculate costs, generate journals, balance entries, or post
accounting results. Slaughter split remains a Phase 4 batch/output resource
because the RAK structure requires `batch_id`, actual outputs and weights.
