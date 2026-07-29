# NAVFarm Frontend/API Readiness Consolidation Audit

## Executive verdict

**Not ready for API integration.** The web mock demonstrates useful flows, but it has two authentication/context generations, incomplete company administration, and operational authorization that can disagree with navigation. `origin/arun.pratap` is available and contains a substantial JWT, per-tenant-database API, but it does not implement the frontend v1.1 cookie-session, workspace, or response-contract model. Integration must wait for the milestones in `implementation-sequence.md`.

## Scope and methodology

Audit-only review on `integration/frontend-api-readiness`. Inspected tracked frontend routes, live clients, mock `/api/v1` dispatcher, contracts, unit/Playwright specifications, repository/product/API documents, and read-only Git objects from `origin/arun.pratap`. No app tests or screenshot-generating tests were run. Facts below cite source paths; conclusions are labelled as findings or required decisions.

## Sources inspected

- Instructions: `AGENTS.md`, `CLAUDE.md`, `.agents/skills/*`, root and app READMEs.
- Product/API: `rak docs/Final_Docs/0.NAVFarm_company setup & db structure.xlsx`, `1. NOB_LOB Master File.xlsx`, `2. Master Tables_Structure.xlsx`, other listed workbooks, and `docs/**/*.md` named in the task.
- The functional PDF exists at `rak docs/NAVFarm Wireframes Functional Doc.pdf`, but this environment lacks PDF text extraction utilities; no assertion here is attributed to its unreadable text.
- Frontend: `apps/web/src/app`, `contexts/AuthContext.tsx`, `hooks/useAuth.ts`, contracts, authorization/access-reasons, shell, auth/workspace/farm-demo modules, `server/api`, services and tests.
- Backend reference: `origin/arun.pratap:apps/api/src/{main.ts,app.module.ts,common,core,d rizzle,modules}` (space above is descriptive only; actual branch paths cited below contain `drizzle`). Swagger is generated at runtime by `origin/arun.pratap:apps/api/src/main.ts`; no committed OpenAPI document was found.

## Documented target architecture

The current API documents describe `Platform -> Tenant -> Company -> Workspace -> NOB/LOB -> operational resources`; a same-origin HTTP-only cookie session; atomic tenant/company/workspace context selection; explicit workspace membership; company-scoped setup/accounting/shared masters; and workspace-scoped operations. See `docs/authentication-flow.md`, `docs/frontend-route-map.md`, and `docs/api-contract/navfarm-api-contract-v1.1-workspace-draft.md`.

## Actual frontend architecture

- Canonical path: `AuthProvider` hydrates `GET /api/v1/auth/session`, commits an `AuthSession`, and calls `/auth/context` through `apps/web/src/lib/api-client.ts`.
- Legacy path: `apps/web/src/hooks/useAuth.ts` maintains module-global `currentSession`; live `/console/notifications` and `/admin/audit` consume its fake token/user helpers and legacy endpoint clients.
- Mock path: `apps/web/src/app/api/v1/[...path]/route.ts` selects mock/proxy/hybrid. `mock-repository.ts` owns process-memory sessions and fixtures. Hybrid may fall back to mock on configured upstream 404/501.
- Scope leakage: `apps/web/src/app/[company]/layout.tsx` mounts `DemoStoreProvider` around every company route. `/{company}/settings/*` directly renders `modules/farm-demo/workspace-page.tsx`.

## Actual Arun backend architecture

- `origin/arun.pratap:apps/api/src/main.ts` exposes `/api/v1`, Swagger, Bearer JWT documentation, and an `x-tenant-id` operational-context expectation.
- `origin/arun.pratap:apps/api/src/modules/auth/auth.controller.ts` provides JWT login/refresh/MFA verify and `/auth/me`; it has no documented `/auth/session`, logout, context-selection, or recovery endpoint matching the frontend contract.
- `origin/arun.pratap:apps/api/src/core/database/connection-manager.service.ts` opens a database pool per tenant. `tenant.middleware.ts` selects tenant context. This is not the frontend contract's shared session-context model.
- `origin/arun.pratap:apps/api/src/core/database/schema.ts` models company and company-scoped user/role tables, but no Workspace/WorkspaceMembership model was found. Operational controllers are company/tenant-context oriented and are not nested workspace endpoints.
- The branch contains duplicate vertical module families (`agri`/`agri-v2`, `aquaculture`/`aquaculture-v2`, `livestock`/`livestock-v2`, feed production variants), which requires an ownership decision before exposing canonical workflows.

## Critical blockers

1. **Session contract mismatch.** Frontend requires HTTP-only session hydration and `AuthSession`; Arun returns JWT/refresh-token style responses and uses Bearer authentication. No compatible context tuple or logout/session contract exists.
2. **Workspace is not persisted in Arun.** Frontend canonical operations require explicit workspace membership and full tuple isolation; the reference schema/controllers do not expose workspace identity or membership.
3. **Authorization disagreement.** Frontend navigation uses workspace capabilities, while mock mutation prechecks permit company management/tenant administration. A company admin with Viewer workspace membership can potentially mutate workspace data.
4. **Two live client generations.** Legacy routes use global auth state and uncontracted endpoints alongside v1 routes; refresh can produce false unauthenticated/forbidden behavior.
5. **Company administration is coupled to operational fixtures.** It cannot safely be mapped to a real company API while `DemoStoreProvider` supplies state to setup/settings/members routes.

## High-severity findings

- `mock-repository.ts` validates tenant membership and company membership independently in `/auth/context`, but does not validate the selected company belongs to the selected tenant.
- `/{company}/members` redirects to `/{company}/settings/users`; no company roles route exists. `/{company}/readiness` aliases accounting readiness.
- `CanonicalWorkspaceContent` uses a `sessionStorage` transition exception and auto-selects context on route render (`modules/workspaces/route-content.tsx`), creating a stale-context rendering window.
- Email-based `workspaceAssignments()` fallbacks create implicit memberships for users not explicitly present in the membership fixture.
- `api-client.ts` validates only routes listed in `runtimeContracts`; many live legacy calls are unvalidated and several callers catch errors as empty arrays.

## Medium-severity findings

- `/company-selection` is a second, legacy create/select flow using `/company` and an in-memory company cache.
- Workspace `costing` is rendered as reports and workspace `masters/settings` share the farm-demo settings page; these are not distinct canonical resources.
- The account/profile page posts legacy `/auth/change-password`, which the mock does not model as a documented v1 flow.
- Current route docs acknowledge legacy endpoints but do not identify their still-reachable pages.

## Low-severity findings

- `apps/web/src/app/api/hello/route.ts` is unrelated legacy API surface and should retire.
- Current README language describing platform starters conflicts with the mature mock/demo and reference backend branch; document the product phase explicitly.

## Safe technical corrections

1. Make `AuthContext` the sole browser session source and delete/retire live callers of `hooks/useAuth.ts` compatibility helpers.
2. Retire `/company-selection`; use only `/context-selection` and server-authorized company/workspace selection.
3. Introduce a single scope guard and one backend authorization resolver for `(tenantId, companyId, workspaceId, capability)`.
4. Move `DemoStoreProvider` below canonical workspace-operation routes; replace company settings/members/readiness aliases with typed company views.
5. Make all fixture memberships explicit and test negative scope/role cases.
6. Remove legacy clients or give each a canonical endpoint, request schema, response schema, and error behavior. Disable hybrid fallback in compatibility tests.

## Unresolved product decisions

- Whether Workspace is a business area, NOB, LOB, site, or a separate partition; documents deliberately do not settle this.
- Final mandatory onboarding steps and the accounting-readiness gate for operations/close.
- Tenant Admin company-accounting authority and readiness override policy.
- Backend tenancy strategy and whether company/workspace data belongs in each tenant database.
- Final industry-specific workspace labels and operational rules.

## Recommended milestones

Execute the six milestones in `implementation-sequence.md` in order. Backend work begins with a contract/architecture decision milestone, not endpoint-by-endpoint proxy wiring.

## Non-goals

This audit does not redesign product policy, migrate data, implement a backend, claim mock data is production behavior, or declare any readiness state complete.

## Readiness estimates

| Area | Estimate | Basis |
|---|---:|---|
| Web mock-demo consistency | 65% | Broad happy-path and scope tests; legacy routes and implicit fixture behavior remain. |
| Frontend API-boundary readiness | 30% | Typed core exists, but legacy clients, fallback, and ownership coupling remain. |
| Arun backend foundation readiness | 35% | Large module/schema base exists, but auth/session, workspace and canonical contracts are mismatched. |
| Combined integration readiness | 20% | The shared contract, tenancy model, and authorization model are not reconciled. |

## Final verdict

**Formal audit complete; integration is blocked by architecture and contract reconciliation.**
