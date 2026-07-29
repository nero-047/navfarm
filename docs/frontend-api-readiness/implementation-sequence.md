# Recommended Implementation Sequence

These milestones are corrective planning. Milestones 1, 2 and 3 are complete
for the frontend mock demo and contract boundary only; none claims backend
delivery. Do not begin later milestones merely because this status changed.

## Milestone 1: Session and context consolidation

- **Status:** complete for the frontend mock demo; backend implementation
  remains missing.
- **Delivered:** one `AuthContext` source; explicit hydration/MFA/suspension
  states; retired live helpers and `/company-selection`; Company/Workspace-only
  selector; atomic authorized context; explicit account fixtures; exact
  workspace mutation capabilities; unit and Playwright matrices.
- **Contract ready:** typed login/challenge/session/context/logout responses and
  stable denial codes at the same-origin `/api/v1` boundary.
- **Backend dependency:** durable session/MFA/membership/context endpoints and
  production enforcement are required before non-mock integration.
- **Remaining product decision:** production session adapter/transport and
  cross-tenant membership/tenancy model.

## Milestone 2: Company administration decoupling

- **Status:** complete for the frontend mock demo; backend implementation
  remains missing.
- **Delivered:** workspace-only `DemoStoreProvider`; typed company Profile,
  Members, invitations, Roles, Settings and Readiness pages; independent
  company/workspace role mutations; canonical fixture updates/reset; company
  navigation and legacy redirect cleanup; desktop/mobile acceptance coverage.
- **Contract ready:** `/companies/[c]/{members,invitations,roles,settings,readiness}`
  request/response schemas and typed client.
- **Backend dependency:** durable company member/invitation/role/settings/
  readiness resources and enforcement.
- **Remaining product decision:** custom roles plus final readiness taxonomy and
  accounting gate.

## Milestone 3: Company/Workspace switcher and workspace demo completion

- **Status:** complete for the frontend mock demo; the recorded validation gate
  and focused screenshot audit pass. Backend implementation remains missing.
- **Delivered:** one searchable Company/Workspace hierarchy in the application
  shell; no visible tenant selector; atomic tuple switching; safe list-route
  preservation and record-route fallback; active membership filtering;
  keyboard/mobile behavior; workspace-aware NOB/LOB/module identity; canonical
  Dashboard, Batches, Operations, Quality, Traceability, Resources, Costing,
  Reports, Masters and Settings routes; distinct typed Dashboard, Masters and
  Settings mock resources; role/module-aware navigation and actions.
- **Contract ready:** nested
  `/tenants/[t]/companies/[c]/workspaces/[w]` workspace detail, readiness,
  members, dashboard, settings and masters responses plus existing operational
  resource schemas.
- **Backend dependency:** durable Workspace/WorkspaceMembership persistence,
  metadata, settings, master ownership, dashboard projection and exact
  authorization enforcement.
- **Remaining product decision:** durable Workspace/NOB/LOB cardinality,
  lifecycle and cross-workspace reporting, plus authoritative costing/report
  semantics.
- **Complexity:** high.

## Milestone 4: Final presentation readiness

- **Status:** complete for the frontend mock demo; the full validation gate and
  exact 25-image manual evidence audit pass. Backend implementation remains
  missing.
- **Scope:** shared visual system, light/dark themes, responsive canonical
  routes, accessible shell/dialog/drawer behavior, public trace presentation,
  final evidence, and demonstration guide.
- **Dependencies:** completed auth/context, company administration, and
  canonical workspace milestones.
- **Acceptance:** full Nx validation gate, configured accessibility checks,
  five-viewport canonical-route audit, exactly 25 manually inspected evidence
  PNGs, and no Tenant/Organisation switch control.
- **Boundary:** no backend contract expansion; API-boundary cleanup and
  incremental integration remain later phases.

## Milestone 5: Strict API boundary cleanup

- **Scope:** migrate or retire every legacy endpoint/client; require request/response schemas; disable hybrid fallback in compatibility testing.
- **Dependencies:** signed canonical endpoint map.
- **Likely modules:** API client/contracts, company module, notifications, audit, profile, legacy console modules.
- **Acceptance:** no live legacy API calls; all successful and error payloads validate; no silent empty fallback.
- **Tests:** contract tests against mock and backend mode.
- **Backend dependency:** envelope/versioning support.
- **Product decision:** whether legacy endpoints get a temporary adapter.
- **Complexity:** high.

## Milestone 6: Backend foundation reconciliation

- **Scope:** resolve JWT/cookie, per-tenant DB/context, Workspace persistence/membership, error envelope, and duplicate vertical module ownership.
- **Dependencies:** milestones 1–5 contracts.
- **Likely modules:** `origin/arun.pratap:apps/api/src/{main.ts,common,core,d rizzle,modules}`.
- **Acceptance:** OpenAPI/contract tests expose canonical auth, tenancy, company, workspace and error resources; no ambiguous vertical endpoint owner.
- **Tests:** backend unit, database tenancy/isolation, auth/MFA, role guard and API E2E suites.
- **Backend dependency:** primary work item.
- **Product decision:** tenancy model and Workspace meaning.
- **Complexity:** very high.

## Milestone 7: Incremental API integration

- **Scope:** integrate in slices: auth/context, company setup, workspace admin, batches/operations, QC/QR, resources, finance/reports.
- **Dependencies:** all previous milestones and contract test environment.
- **Likely modules:** canonical frontend repositories and corresponding backend resources.
- **Acceptance:** each slice runs browser E2E against backend mode with mock fallback disabled; scope and error tests pass.
- **Tests:** contract, API E2E, browser E2E, concurrency/idempotency and cross-workspace isolation.
- **Backend dependency:** canonical endpoint implementations.
- **Product decision:** operation close/accounting policy before financial slice.
- **Complexity:** very high.
