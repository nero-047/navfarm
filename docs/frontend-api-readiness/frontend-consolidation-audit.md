# NAVFarm Frontend/API Readiness Consolidation Audit

## Post-Milestone 1 verdict

Demo Completion Milestone 1 is implemented for the web mock: authentication,
session restoration, the active context tuple, demo identities, and operational
mutation authorization now have one internally consistent policy. This does
not make the product ready for real API integration. The reference backend
still lacks the frontend cookie-session/context/workspace contract, and later
frontend consolidation milestones remain.

## Scope and evidence

The original audit inspected the tracked web routes, live clients, mock
`/api/v1` dispatcher, contracts, tests, product/API documents, and read-only
Git objects from `origin/arun.pratap`. Milestone 1 additionally consulted
`rak docs/NAVFarm Wireframes Functional Doc.pdf` for company setup and role
context and validated the implementation through unit, type, lint, build, and
Playwright coverage. No backend, mobile, database, infrastructure, or external
integration was changed.

## Documented target architecture

`Platform -> Tenant -> Company -> Workspace -> NOB/LOB -> Operations`, with a
same-origin HTTP-only cookie session, atomic tenant/company/workspace context,
explicit workspace membership, company-scoped setup/accounting/masters, and
workspace-scoped operations.

Tenant remains an authenticated isolation dimension. The user-facing selector
contains only Company administration and assigned Workspaces.

## Current frontend architecture

- `AuthProvider` is the only live browser session source. It hydrates
  `GET /api/v1/auth/session`, exposes loading/authenticated/unauthenticated/
  suspended/MFA-pending states, and commits context only after a validated
  server response.
- The former `hooks/useAuth.ts` module-global snapshot and token/company helper
  consumers are removed. `/admin/audit` and `/console/notifications` use the
  canonical context/client.
- `/context-selection` is the sole selector. `/company-selection` is a
  server-side redirect; its in-memory company cache/switcher is retired.
- `mock-repository.ts` owns process-memory sessions and fully explicit identity,
  tenant, company, workspace, permission, initial-context, and destination
  fixtures. No email/username or role fallback assigns membership/capability.
- `PUT /auth/context` validates the complete tuple, ownership, explicit
  membership, and active status and returns stable reason codes.
- Operational mutations resolve the authenticated active workspace membership
  and exact capability. Tenant/company administration never substitutes for a
  workspace capability.
- Runtime Zod contracts cover the changed login/MFA/session/context responses
  through the typed same-origin `/api/v1` client.

## Milestone 1 findings resolved

1. Dual session sources and refresh races: resolved for live web consumers.
2. Duplicate company-selection flow/cache: retired.
3. Tenant/company/workspace tuple ownership gap: resolved in the mock.
4. Email-derived workspace assignment: removed.
5. Company/Tenant Admin operational escalation: removed.
6. Render-time canonical route auto-selection and sessionStorage transition
   exception: removed. Only the documented single-workspace legacy redirect
   may select explicitly before navigation.
7. MFA challenge creating an incomplete application session: removed.

## Remaining frontend gaps

- Company administration is still coupled to some farm-demo presentation/state
  and dedicated company members/readiness/settings resources remain incomplete.
- Workspace costing, masters, and settings still reuse demo pages rather than
  distinct final resources.
- Profile/password, invitations, setup helpers, and other older non-Milestone-1
  workflows still need strict request/response contract migration.
- Hybrid fallback can mask absent upstream endpoints and must be disabled for
  compatibility/integration runs.
- The final visual redesign is explicitly deferred.

## Backend/integration blockers

1. The reference backend uses JWT/refresh/Bearer behavior and has no compatible
   `/auth/session`, logout, atomic context, or recovery contract.
2. It has no canonical persisted Workspace/WorkspaceMembership model matching
   the web tuple and nested operational resources.
3. Durable explicit permission enforcement, stable error codes, CSRF, rate
   limiting, audit, idempotency, and concurrency guarantees are missing.
4. Frontend v1 response schemas and reference backend DTO/envelopes differ.
5. Duplicate backend vertical module families still require an owner decision.

## Unresolved product decisions

- Exact meaning/relationship of Workspace versus site/NOB/LOB.
- Final 15-step onboarding numbering and readiness gates.
- Tenant Administrator accounting/readiness override policy.
- Production cookie-session adapter versus JWT transport and tenancy/database
  strategy for multi-tenant memberships.
- Final workspace role catalogue, custom roles, and industry-specific labels.

## Readiness estimates after Milestone 1

| Area | Estimate | Basis |
| --- | ---: | --- |
| Demo authentication/context consistency | 95% | One live source, deterministic hydration/MFA/logout/context, and negative scope coverage; production security is out of scope. |
| Demo permission consistency | 92% | Explicit fixtures and exact operational capability checks; complete future RBAC/custom-role policy is unresolved. |
| Overall demo webapp completion | 72% | Core demo flows are broad, but company-resource decoupling, final UX, and later consolidation remain. |
| Frontend API-boundary readiness | 48% | Milestone 1 auth/context is typed; several non-M1 legacy workflows and backend DTO mismatches remain. |
| Combined backend integration readiness | 25% | Workspace persistence, session/context transport, and shared contracts are not reconciled. |

## Verdict

Milestone 1 is complete for the frontend mock demo. Real API integration
remains blocked by the backend and later frontend milestones; no production
authentication, persistence, or authorization is claimed.
