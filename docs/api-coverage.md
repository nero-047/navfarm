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
| NOB | `GET/POST /setup/wizard/nobs`, `DELETE /setup/wizard/nobs/{nobId}` | Consumed; read runtime contract/seeded, mutations pass-through |
| LOB | `GET /setup/wizard/lobs/{nobId}`, `POST /setup/wizard/lobs`, `DELETE /setup/wizard/lobs/{lobId}` | Consumed; read seeded, mutations pass-through |
| Setup | `GET /setup/wizard/status/{companyId}` | Consumed, seeded |
| Setup | `GET /setup/wizard/company-details/{companyId}` | Consumed, seeded |
| Setup | `POST /setup/wizard/step-1`, `/step-2`, `/step-3`, `/step-7` | Consumed, pass-through |
| Setup | `POST /setup/wizard/step-4/{companyId}/{languageId}` | Consumed, pass-through |
| Setup | `POST /setup/wizard/step-5/{companyId}/{currencyId}` | Consumed, pass-through |
| Setup | `POST /setup/wizard/step-6/{companyId}/{timezone}/{country}` | Consumed, pass-through |
| Setup | `POST /setup/wizard/step-8/{companyId}` | Consumed, pass-through |
| Setup | `POST /setup/wizard/complete/{companyId}` | Consumed, pass-through |
| Setup | `POST /setup/wizard/upload-logo` | Consumed, seeded placeholder |
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
| NOB/LOB config | `GET /nobs`; `GET /nobs/{nobId}/lobs`; `GET/PUT /companies/{companyId}/lobs`; `GET/PUT /companies/{companyId}/lobs/{lobId}/costing-policy` |
| Master data | CRUD collections below `/companies/{companyId}/masters/{uoms|items|breeds|locations|resources|entry-types|qc-parameters|scheduler-parameters}` |
| GL mapping | `GET/PUT /companies/{companyId}/gl/accounts`; `GET/PUT /companies/{companyId}/gl/item-mappings`; `GET/PUT /companies/{companyId}/gl/entry-type-mappings` |
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
   setup-step RPC paths. They remain proxied for compatibility. The required
   resource-oriented endpoints above should be introduced with explicit
   request/response schemas before pages migrate.
2. Runtime schemas currently cover auth sessions, companies, NOBs, languages,
   currencies, normalized errors, and the demo state repository. Other legacy
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
