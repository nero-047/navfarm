# Recommended Implementation Sequence

These milestones are corrective planning, not authorization to begin implementation.

## Milestone 1: Session and context consolidation

- **Scope:** one `AuthContext` session source; remove live legacy helper callers; define cookie-session or JWT bridge; atomic tuple validation.
- **Dependencies:** agreed auth response, logout, MFA/recovery and context contract.
- **Likely modules:** `contexts/AuthContext.tsx`, `hooks/useAuth.ts`, auth forms, shell, access states; `origin/arun.pratap:apps/api/src/modules/auth/*`.
- **Acceptance:** refresh has no false denial; logout clears all context; invalid tenant/company/workspace tuple is rejected; MFA has no app session before success.
- **Tests:** browser refresh/logout/MFA/context matrix against non-mock backend; unit tuple validation.
- **Backend dependency:** new or adapter auth session endpoints.
- **Product decision:** session transport and multi-company identity model.
- **Complexity:** very high.

## Milestone 2: Company administration decoupling

- **Scope:** remove company-wide `DemoStoreProvider`; implement typed company settings, members/roles and readiness pages; retire settings aliases.
- **Dependencies:** milestone 1 company context and company API resource decisions.
- **Likely modules:** `[company]/layout.tsx`, settings/members/readiness routes, Phase 2/3 components, farm-demo boundaries.
- **Acceptance:** company routes do not import farm-demo state or active workspace; each readiness type has its own view.
- **Tests:** route/render isolation and company-only access tests.
- **Backend dependency:** company member/role/readiness resource design.
- **Product decision:** final setup/readiness taxonomy.
- **Complexity:** high.

## Milestone 3: Authorization and explicit fixtures

- **Scope:** one capability resolver; explicit fixtures; no company role grants workspace operations.
- **Dependencies:** Workspace membership persistence decision.
- **Likely modules:** authorization, access reasons, mock repository, operational repository, E2E fixtures.
- **Acceptance:** Viewer/Company Admin/Tenant Admin negative mutation matrix passes; no email fallback membership.
- **Tests:** unit capability table, mock API and browser negative cases.
- **Backend dependency:** workspace roles/permissions tables and guards.
- **Product decision:** workspace role catalogue and Tenant Admin override rules.
- **Complexity:** high.

## Milestone 4: Strict API boundary cleanup

- **Scope:** migrate or retire every legacy endpoint/client; require request/response schemas; disable hybrid fallback in compatibility testing.
- **Dependencies:** signed canonical endpoint map.
- **Likely modules:** API client/contracts, company module, notifications, audit, profile, legacy console modules.
- **Acceptance:** no live legacy API calls; all successful and error payloads validate; no silent empty fallback.
- **Tests:** contract tests against mock and backend mode.
- **Backend dependency:** envelope/versioning support.
- **Product decision:** whether legacy endpoints get a temporary adapter.
- **Complexity:** high.

## Milestone 5: Backend foundation reconciliation

- **Scope:** resolve JWT/cookie, per-tenant DB/context, Workspace persistence/membership, error envelope, and duplicate vertical module ownership.
- **Dependencies:** milestones 1–4 contracts.
- **Likely modules:** `origin/arun.pratap:apps/api/src/{main.ts,common,core,d rizzle,modules}`.
- **Acceptance:** OpenAPI/contract tests expose canonical auth, tenancy, company, workspace and error resources; no ambiguous vertical endpoint owner.
- **Tests:** backend unit, database tenancy/isolation, auth/MFA, role guard and API E2E suites.
- **Backend dependency:** primary work item.
- **Product decision:** tenancy model and Workspace meaning.
- **Complexity:** very high.

## Milestone 6: Incremental API integration

- **Scope:** integrate in slices: auth/context, company setup, workspace admin, batches/operations, QC/QR, resources, finance/reports.
- **Dependencies:** all previous milestones and contract test environment.
- **Likely modules:** canonical frontend repositories and corresponding backend resources.
- **Acceptance:** each slice runs browser E2E against backend mode with mock fallback disabled; scope and error tests pass.
- **Tests:** contract, API E2E, browser E2E, concurrency/idempotency and cross-workspace isolation.
- **Backend dependency:** canonical endpoint implementations.
- **Product decision:** operation close/accounting policy before financial slice.
- **Complexity:** very high.
