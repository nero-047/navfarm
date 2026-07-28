# NAVFarm API Contract v1.1 Draft — Workspace Alignment

Status: backward-compatible frontend integration draft. It supplements, and does not replace, the approved v1.0 contract.

## Hierarchy and ownership

`Platform → Tenant / Organisation → Company → Workspace / business area → NOB / LOB → operational resources`

- Tenant owns organisation identity, plan, usage, billing, branding, tenant users and the company registry.
- Company owns legal identity, contacts, fiscal/currency/timezone configuration, Chart of Accounts, GL mappings, company roles and shared masters.
- Workspace owns its type, enabled modules, NOB/LOB configuration, operational locations and masters, resources, QC parameters, batches, daily operations, traceability, operational costing, KPIs and reports.
- Tenant or company membership never implies workspace access. A workspace membership is explicit.

## Workspace DTO

Required response fields are `workspaceId`, `tenantId`, `companyId`, `workspaceCode`, `workspaceSlug`, `workspaceName`, `workspaceType`, `status`, `primaryNobId`, `enabledModules`, `readiness`, `createdAt`, and `updatedAt`.

`workspaceType` is one of `POULTRY`, `AGRICULTURE`, `PIGGERY`, `DAIRY`, `AQUACULTURE`, `FEED_PROCESSING`, or `OTHER`. Timestamps are ISO-8601 UTC. Write DTOs must not accept server-owned IDs or timestamps.

## Endpoints

| Method | Endpoint | Scope |
|---|---|---|
| GET, POST | `/tenants/{tenantId}/companies/{companyId}/workspaces` | Tenant/company workspace administration |
| GET, PATCH | `/companies/{companyId}/workspaces/{workspaceId}` | Workspace detail/configuration |
| GET | `/companies/{companyId}/workspaces/{workspaceId}/readiness` | Workspace readiness |
| GET, POST | `/companies/{companyId}/workspaces/{workspaceId}/batches` | Workspace operations |
| GET, POST | `/companies/{companyId}/workspaces/{workspaceId}/operations` | Daily operations |
| GET, POST | `/companies/{companyId}/workspaces/{workspaceId}/quality-lots` | QC |
| GET, POST | `/companies/{companyId}/workspaces/{workspaceId}/qr-packs` | Traceability |
| GET, POST | `/companies/{companyId}/workspaces/{workspaceId}/resources` | Resources |
| GET | `/companies/{companyId}/workspaces/{workspaceId}/{costing|journals|variances|reports}` | Cost/report projections |

Every handler validates the tuple `(authenticated tenant membership, company membership, workspace membership)` and the resource's stored scope. A missing/inaccessible resource is returned consistently without leaking whether another scope owns it.

## Session and context

The session contains `tenants`, `companies`, `workspaces`, `activeTenantId`, `activeCompanyId`, and `activeWorkspaceId`. `PUT /auth/context` accepts those three IDs. Changing tenant clears company and workspace; changing company clears workspace; a workspace must belong to the selected company and be explicitly assigned. Logout clears all three. MFA verification and recovery return the same full membership structure as ordinary login.

## Concurrency, idempotency, and errors

- Creation and transition commands accept `Idempotency-Key`; replay returns the original successful result.
- PATCH/transition commands use an opaque `version` or `If-Match`; stale writes return `409 CONFLICT`.
- Validation, authorization, lifecycle conflicts and unavailable upstreams use the v1.0 error envelope with `requestId`.
- Collections follow the v1.0 `page`, `pageSize`, `sort`, `order`, and filter conventions.

## Compatibility

Company-only operational URLs remain frontend compatibility entries. A single accessible workspace redirects to the canonical route; multiple workspaces show selection; none show setup/access state. The backend should not add new company-only operational endpoints.
