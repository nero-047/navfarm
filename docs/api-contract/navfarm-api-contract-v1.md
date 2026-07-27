# NAVFarm API Contract v1

Status: frozen for backend handoff after Phase 7.1 frontend validation.

Scope: endpoints currently required by the web frontend mock demo. The backend must not infer additional production behavior from demo credentials, browser-only state, or mock reset routes.

## Base Path

All application endpoints are served under `/api/v1`.

Frontend clients call relative paths such as `/auth/session`; the browser client prefixes `/api/v1`.

## Authentication Model

Authentication is cookie-session based.

- Login creates an HTTP-only same-origin session cookie unless MFA is required.
- MFA login returns an MFA challenge response but does not create an application session until verification or recovery succeeds.
- Session refresh uses `GET /auth/session`.
- Logout clears the session cookie using `POST /auth/logout`.
- Production must not expose demo passwords, mock account cards, or mock reset endpoints.

Canonical schemas:

- `authSessionSchema`
- `sessionUserSchema`
- `tenantMembershipSchema`
- `companyMembershipSchema`

## Session and MFA Lifecycle

1. `POST /auth/login`
   Request: `{ email: string, password: string }`
   Response: `AuthSession`

2. If `mfaRequired: true`, response includes `challengeId` and no authenticated workspace session should exist.

3. `POST /auth/mfa/verify`
   Request: `{ challengeId: string, code: string }`
   Response: `AuthSession`

4. `POST /auth/mfa/recovery`
   Request: `{ challengeId: string, recoveryCode: string }`
   Response: `AuthSession`

5. `GET /auth/session`
   Response: current `AuthSession`; 401 when missing or expired.

6. `PUT /auth/context`
   Request: `{ tenantId: string | null, companyId: string | null }`
   Response: updated `AuthSession`.

7. `POST /auth/logout`
   Response: `{ success: true }`

## Tenant and Company Context

Every authenticated response includes:

- `tenants`: memberships available to the user.
- `companies`: company memberships available to the user.
- `activeTenantId`: selected tenant, nullable.
- `activeCompanyId`: selected company, nullable.

Rules:

- Platform Admin routes do not require company context.
- Multiple tenant/company users must explicitly select context.
- Company permissions are scoped to `activeCompanyId`.
- Company data must be filtered by tenant and company membership.
- Suspended active tenant returns access-denied behavior; API should use 403 for protected resources.

## Route Groups

### Auth

- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/logout`
- `PUT /auth/context`
- `POST /auth/mfa/verify`
- `POST /auth/mfa/recovery`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/accept-invitation`
- `POST /auth/verify-email`
- `POST /auth/mfa/setup`
- `PATCH /users/me`

### Platform Administration

- `GET /platform/dashboard`
- `GET /platform/tenants`
- `POST /platform/tenants`
- `GET /platform/tenants/{tenantId}`
- `PATCH /platform/tenants/{tenantId}`
- `POST /platform/tenants/{tenantId}/activate`
- `POST /platform/tenants/{tenantId}/suspend`
- `POST /platform/tenants/{tenantId}/reactivate`
- `GET /platform/tenants/{tenantId}/usage`
- `GET /platform/tenants/{tenantId}/audit`
- `GET /platform/tenants/{tenantId}/companies`
- `GET /platform/tenants/{tenantId}/users`
- `GET /platform/plans`
- `GET /platform/plans/{planId}`
- `GET /platform/masters/nobs`
- `GET /platform/masters/lobs`
- `GET /platform/masters/modules`
- `GET /platform/masters/reference-data`

### Tenant Administration

- `GET /tenants/{tenantId}`
- `PATCH /tenants/{tenantId}`
- `GET /tenants/{tenantId}/dashboard`
- `GET /tenants/{tenantId}/usage`
- `GET /tenants/{tenantId}/subscription`
- `GET /tenants/{tenantId}/companies`
- `POST /tenants/{tenantId}/companies`
- `GET /tenants/{tenantId}/users`
- `GET /tenants/{tenantId}/invitations`
- `POST /tenants/{tenantId}/invitations`
- `POST /tenants/{tenantId}/invitations/{invitationId}/resend`
- `DELETE /tenants/{tenantId}/invitations/{invitationId}`
- `GET /tenants/{tenantId}/roles`
- `GET /tenants/{tenantId}/audit`

### Company Onboarding and Readiness

- `GET /companies/{companyId}/setup/status`
- `GET/PATCH /companies/{companyId}/setup/profile`
- `GET/POST /companies/{companyId}/setup/addresses`
- `PATCH/DELETE /companies/{companyId}/setup/addresses/{addressId}`
- `GET/POST /companies/{companyId}/setup/contacts`
- `PATCH/DELETE /companies/{companyId}/setup/contacts/{contactId}`
- `GET/PATCH /companies/{companyId}/setup/localization`
- `GET/PATCH /companies/{companyId}/setup/fiscal`
- `GET/PATCH /companies/{companyId}/setup/modules`
- `GET/PATCH /companies/{companyId}/setup/administrator`
- `GET/POST /companies/{companyId}/setup/team`
- `PATCH/DELETE /companies/{companyId}/setup/team/{memberId}`
- `GET/PATCH /companies/{companyId}/setup/chart-of-accounts`
- `GET/PATCH /companies/{companyId}/setup/business-structure`
- `GET/PATCH /companies/{companyId}/setup/essential-masters`
- `GET/PATCH /companies/{companyId}/setup/notifications`
- `POST /companies/{companyId}/setup/complete`

### Phase 3 Masters and Accounting

- `GET /companies/{companyId}/business-structure`
- `GET/POST /companies/{companyId}/nobs`
- `PATCH /companies/{companyId}/nobs/{companyNobId}`
- `POST /companies/{companyId}/nobs/{companyNobId}/activate`
- `POST /companies/{companyId}/nobs/{companyNobId}/deactivate`
- `GET/POST /companies/{companyId}/lobs`
- `PATCH /companies/{companyId}/lobs/{companyLobId}`
- `POST /companies/{companyId}/lobs/{companyLobId}/activate`
- `POST /companies/{companyId}/lobs/{companyLobId}/deactivate`
- `GET /companies/{companyId}/masters`
- `GET /companies/{companyId}/masters/{resource}`
- `POST /companies/{companyId}/masters/{resource}`
- `GET/PATCH /companies/{companyId}/masters/{resource}/{recordId}`
- `POST /companies/{companyId}/masters/{resource}/{recordId}/activate`
- `POST /companies/{companyId}/masters/{resource}/{recordId}/deactivate`
- `POST /companies/{companyId}/masters/{resource}/import/validate`
- `POST /companies/{companyId}/masters/{resource}/import/confirm`
- `GET /companies/{companyId}/masters/imports/{importId}`
- `GET /companies/{companyId}/masters/{resource}/export`
- `GET /companies/{companyId}/masters/{resource}/import-template`
- `GET/POST /companies/{companyId}/accounting/accounts`
- `GET/PATCH /companies/{companyId}/accounting/accounts/{accountId}`
- `POST /companies/{companyId}/accounting/accounts/{accountId}/activate`
- `POST /companies/{companyId}/accounting/accounts/{accountId}/deactivate`
- `GET/POST /companies/{companyId}/accounting/gl-mappings`
- `PATCH /companies/{companyId}/accounting/gl-mappings/{mappingId}`
- `GET/PATCH /companies/{companyId}/accounting/costing`
- `GET /companies/{companyId}/accounting/readiness`

### Operational Demo Contracts

These are frontend-confirmed mock workflow endpoints and should be implemented as production APIs only after the unresolved decisions are closed.

- `GET/POST /companies/{companyId}/batches`
- `PUT /companies/{companyId}/batches/{batchId}`
- `POST /companies/{companyId}/batches/{batchId}/transitions`
- `GET/POST /companies/{companyId}/operations`
- `PUT /companies/{companyId}/operations/{operationId}`
- `GET/POST /companies/{companyId}/quality-lots`
- `PUT /companies/{companyId}/quality-lots/{lotId}`
- `POST /companies/{companyId}/quality-lots/{lotId}/disposition`
- `GET/POST /companies/{companyId}/qr-packs`
- `PUT /companies/{companyId}/qr-packs/{packId}`
- `GET/POST /companies/{companyId}/resources`
- `PUT /companies/{companyId}/resources/{resourceId}`
- `GET/POST /companies/{companyId}/resource-usages`
- `GET /companies/{companyId}/costing`
- `GET /companies/{companyId}/journals`
- `GET /companies/{companyId}/variances`
- `GET /companies/{companyId}/reports/summary`

## DTO Naming

Request DTOs are the input schemas in `apps/web/src/contracts` and `apps/web/src/modules/farm-demo/operational-contracts.ts`.

Important request schemas:

- `createTenantSchema`
- `tenantPatchSchema`
- `createInvitationSchema`
- `createCompanySchema`
- `setupProfileSchema`
- `addressSchema` without generated `addressId` for create
- `contactSchema` without generated `contactId` for create
- `localizationSchema`
- `fiscalSchema`
- `moduleSelectionSchema`
- `administratorSchema`
- `teamMemberSchema` without generated fields for create
- `chartOfAccountsSchema`
- `businessStructureSchema`
- `essentialMastersSchema`
- `setupNotificationsSchema`
- `companyNobSchema` and `companyLobSchema` for responses; creates use template IDs plus selected company NOB/LOB settings.
- Master record schemas keyed by `masterResourceSchema`
- `importPreviewSchema`
- `accountSchema`
- `glMappingSchema`
- `costingConfigurationSchema`
- `newBatchSchema`
- `transitionRequestSchema`
- `newOperationSchema`
- `createQualityLotSchema`
- `qualityDispositionRequestSchema`
- `createQrPackSchema`
- `resourceRecordSchema`
- `resourceUsageSchema`

## Pagination, Filtering, Sorting

Current frozen conventions:

- List endpoints that are paged return `{ items, page, pageSize, total, totalPages }` when represented by `platformTenantListSchema`.
- Master data lists return `{ resource, records, page, pageSize, total }`.
- Query filters currently used by frontend: `page`, `pageSize`, `search`, `status`.
- Sorting is not yet consumed by the frontend. If implemented, use `sort=field` and `sort=-field` but do not require it for v1 frontend compatibility.
- Empty lists return an empty `items` or `records` array with counts set to zero.

## Error Envelope

All errors must use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Review the submitted fields.",
    "status": 422,
    "requestId": "req_123",
    "timestamp": "2026-07-27T10:00:00.000Z",
    "fieldErrors": {
      "email": ["Enter a valid email address."]
    },
    "details": {}
  }
}
```

`timestamp` and `fieldErrors` are required for backend v1 responses. They are optional in the frontend parser only to remain compatible with the current mock adapter.

## Validation, Conflict, Permission Responses

- 400: malformed request, missing JSON body, unsupported method where not otherwise represented.
- 401: no session, expired session, invalid login, expired MFA challenge.
- 403: authenticated but not permitted, suspended tenant, tenant/company membership mismatch.
- 404: route or resource not found.
- 409: lifecycle conflict, duplicate code, referenced record, stale `expectedStatus`, version conflict.
- 422: syntactically valid request that violates business rules or DTO validation.
- 429: rate limit.
- 500: internal error.

## Idempotency

Backend v1 should accept an optional `Idempotency-Key` header on all non-GET mutation endpoints.

Required for production:

- Tenant creation
- Company creation
- Invitation creation/resend
- Master import confirm
- Batch creation
- Batch transitions
- Operation recording
- QC disposition
- QR pack generation
- Resource usage recording
- Close/finalization

The frontend does not yet send this header. Backend can safely support it now and the frontend can adopt it later.

## Concurrency and Versioning

Current frontend sends `expectedStatus` for batch transitions. Backend must reject mismatches with 409.

Recommended v1 production rule:

- Mutable domain records should include a numeric `version` or ETag.
- Mutations should accept `If-Match` or body `expectedVersion`.
- Stale updates return 409 with current state in `details`.

Existing frontend DTOs do not yet include `version`; treat versioning as backend-required for production and frontend-follow-up for full integration.

## Audit Metadata

Phase 3 configuration records include:

```ts
audit: {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
```

Backend should preserve this shape for all configurable records and add it to operational writes when productionized.

## Date and Time Conventions

- API date-times are ISO-8601 UTC strings.
- User timezone is part of `sessionUserSchema.timezone`.
- Date-only fields, such as effective dates, use `YYYY-MM-DD`.
- Backend must not localize persisted timestamps; localization is a presentation concern.

## Monetary and Quantity Representation

Current Phase 3 master/accounting contracts use decimal strings for durable financial/configuration values.

- Use decimal strings for money, rates, quantities that require precision, standard costs, conversion factors and accounting amounts in production.
- Current operational demo schemas use numbers for UI simulations. Treat them as provisional until backend precision rules are finalized.
- Currency fields use ISO 4217 three-letter codes.

