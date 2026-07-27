# Backend Handoff Checklist

Implementation sequence for the NestJS backend.

## 1. Authentication and Context

Build:

- Cookie-session auth.
- Login/logout/session refresh.
- MFA challenge, verify and recovery.
- Context selection.
- Suspended tenant behavior.

Acceptance criteria:

- `authSessionSchema` responses validate in the frontend client.
- MFA challenge does not create an authenticated app session.
- Invalid context selection returns 403.
- Multi-company session persists selected context.
- No tokens are stored in browser localStorage.

## 2. Tenant and Company Administration

Build:

- Platform dashboard and tenant registry.
- Tenant create/update/lifecycle.
- Plans, usage, tenant audit.
- Tenant dashboard, users, roles and invitations.
- Company create/list/detail.

Acceptance criteria:

- Platform Admin can access `/admin/*`.
- Tenant Admin cannot access `/admin/*`.
- Tenant Admin can create a draft company and enter setup.
- Suspended tenant access is blocked.

## 3. Onboarding and Readiness

Build:

- 15-step setup status.
- Profile, addresses, contacts, localization, fiscal, modules, administrator, team.
- Workspace readiness and operations readiness.
- Setup completion.

Acceptance criteria:

- Incomplete onboarding routes to setup profile/review.
- Operations routes redirect when `operationsReady` is false.
- Readiness calculation is server-driven.

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

Acceptance criteria:

- Operations Manager can perform Phase 7 workflow.
- Viewer cannot create, update or mutate operational resources.
- Stale transition returns 409.
- Invalid lifecycle transition returns 409 or 422 as documented.

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

- Reports reflect company scope only.
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
- Multi-company no data leakage.

Acceptance criteria:

- Frontend Playwright Phase 7.1 suite passes against backend mode.
- Runtime response contracts pass without client-side schema failures.

