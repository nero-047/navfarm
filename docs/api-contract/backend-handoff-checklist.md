# Backend Handoff Checklist

Implementation sequence for the NestJS backend.

## 1. Authentication and Context

Frontend mock/contract status:

- Implemented in the frontend mock: cookie login/logout/session refresh; an
  unauthenticated MFA challenge followed by a complete session; suspended
  state; explicit membership fixtures; atomic context tuple validation; and
  specific context/capability error codes.
- Contract ready: `authLoginRequestSchema`, `mfaChallengeSchema`,
  `authSessionSchema`, `authContextRequestSchema`, and same-origin
  `/api/v1/auth/*` calls.
- Retired in the frontend: module-global/browser-token session helpers,
  browser-storage auth/context, and the second `/company-selection` flow.

Backend must build:

- Durable secure cookie-session auth, login/logout/session refresh.
- MFA challenge, verify and one-time recovery.
- Tenant/company/workspace membership persistence and active context.
- Suspended account/tenant/resource enforcement.
- CSRF, rate limiting, credential/recovery-code security and audit events.

Acceptance criteria:

- `authSessionSchema` responses validate in the frontend client.
- MFA challenge does not create an authenticated app session.
- Invalid context selection returns the documented stable ownership,
  membership, inactive/suspended, or stale-tuple code.
- Multi-company/workspace session persists selected context and clears stale
  workspace state when company changes.
- No tokens are stored in browser localStorage.
- Tenant/company administration alone never passes an operational mutation
  guard; the active workspace membership must carry the exact capability.

## 2. Tenant and Company Administration

Build:

- Platform dashboard and tenant registry.
- Tenant create/update/lifecycle.
- Plans, usage, tenant audit.
- Tenant dashboard, users, roles and invitations.
- Company create/list/detail.
- Company profile/settings aggregate and documented section mutations.
- Company members, invitations, active/inactive membership lifecycle.
- Standard company-role catalogue and assignment.
- Explicit workspace assignment add/change/remove with company/workspace role
  independence.

Acceptance criteria:

- Platform Admin can access `/admin/*`.
- Tenant Admin cannot access `/admin/*`.
- Tenant Admin can create a draft company and enter setup.
- Company administration works with `activeWorkspaceId: null`.
- Member/invitation/role/settings mutations require the exact documented
  capability combination and update the same membership model used by session
  restoration.
- Company-role changes never mutate workspace roles; workspace-role changes
  never mutate company roles.
- Workspace assignment appears in the restored session, and removal revokes
  workspace visibility.
- Suspended tenant access is blocked.

## 3. Onboarding and Readiness

Build:

- 15-step setup status.
- Profile, addresses, contacts, localization, fiscal, modules, administrator, team.
- Company accounting readiness plus separate workspace operational readiness.
- Company readiness aggregate covering foundation, setup, masters, accounting,
  workspace creation/membership, NOB/LOB and per-workspace operations.
- Setup completion.

Acceptance criteria:

- Incomplete onboarding routes to setup profile/review.
- Operations routes redirect when `operationsReady` is false.
- Readiness calculation is server-driven.
- Policy-pending readiness rules remain non-blocking until product approval.

## 4. Masters and Accounting Configuration

Build:

- Platform NOB/LOB/module/reference templates.
- Company NOB/LOB activation.
- Master data CRUD and lifecycle.
- Import template, validation and confirm.
- Chart of accounts.
- GL mappings.
- Costing configuration.
- Accounting readiness.

Acceptance criteria:

- Tenant Admin can manage setup/master-data configuration.
- Tenant Admin does not automatically gain operational mutation rights.
- Referenced records cannot be deactivated.
- Import confirm is blocked when invalid rows exist.
- Accounting readiness matches configured COA, GL, NOB/LOB and essential masters.

## 5. Operational Resources

Build:

- Batches list/create/update.
- Batch transitions.
- Operations recording.
- Resources and resource usage.

All operational tables, repositories, caches and handlers must partition and
authorize by `tenantId + companyId + workspaceId`; company-only partitioning is
not contract-compatible.

Acceptance criteria:

- Operations Manager can perform Phase 7 workflow.
- Viewer cannot create, update or mutate operational resources.
- Stale transition returns 409.
- Invalid lifecycle transition returns 409 or 422 as documented.
- Two workspaces in one company cannot list, read, mutate, aggregate or report
  each other's batches, operations, QC, QR, resources/usages, costing,
  journals, variances or reports.

## 6. QC and QR

Build:

- QC lots.
- QC disposition.
- QR pack generation.
- Trace payload lookup.

Acceptance criteria:

- QC hold blocks inventory release.
- PASS releases inventory and allows close/QR when other gates pass.
- FAIL blocks close.
- QR generation enforces QC and quantity gates.

## 7. Costing, Journals and Variance

Build:

- Authoritative costing snapshots.
- Journal generation.
- Variance calculations.
- Close finalization.

Acceptance criteria:

- Closed batches have zero WIP.
- Journal entries balance.
- STANDARD, FIFO and BIO_ASSET methods are represented according to final product rules.
- Variance report data is backend authoritative.

## 8. Reporting

Build:

- Operational summary.
- Costing report.
- Journal report.
- Variance analysis.
- Export behavior where needed.

Acceptance criteria:

- Reports reflect one explicit workspace scope only; company roll-ups require
  a separate, authorized aggregation endpoint.
- Viewer/reporting roles can read but not mutate.
- Export permissions use `reports.export`.

## 9. Audit, Idempotency and Concurrency

Build:

- Request ID propagation.
- Audit metadata on mutable records.
- Idempotency key store for mutations.
- Version/ETag or expected-version checks.

Acceptance criteria:

- Duplicate idempotency keys return the same mutation result.
- Stale writes return 409.
- Audit records include actor, timestamp and action.

## 10. Integration Testing

Build tests for:

- Auth/session/MFA.
- Tenant/company boundaries.
- RBAC matrix.
- Onboarding readiness.
- Masters/accounting import and lifecycle.
- Batch/QC/QR/close workflow.
- Viewer read-only restrictions.
- Multi-company and same-company/multi-workspace no data leakage.

Acceptance criteria:

- Frontend Playwright Phase 7.1 suite passes against backend mode.
- Runtime response contracts pass without client-side schema failures.
