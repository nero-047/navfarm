# NAVFarm Frontend/API Readiness Consolidation Audit

## Post-Milestone 3 verdict

Demo Completion Milestones 1 through 3 are implemented for the web mock.
Authentication/session/context remains the Milestone 1 foundation. Company
administration now has a separate provider boundary plus typed Profile,
Members, Roles, Settings and Readiness resources. The application shell now
provides an atomic, accessible Company/Workspace switcher and the canonical
workspace route family has distinct Dashboard, Costing, Masters and Settings
presentations with typed mock boundaries where data is loaded. This does not
make the product ready for real API integration: the reference backend still
lacks the cookie-session/context/workspace and company-admin contracts, and
later frontend consolidation milestones remain.

## Scope and evidence

The original audit inspected the tracked web routes, live clients, mock
`/api/v1` dispatcher, contracts, tests, product/API documents, and read-only
Git objects from `origin/arun.pratap`. Milestone 1 additionally consulted
`rak docs/NAVFarm Wireframes Functional Doc.pdf` for company setup, product
hierarchy and role context, plus the current NOB/LOB workbooks for terminology
and configuration ownership. No backend, mobile, database, infrastructure, or
external integration was changed.

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
  and company members, invitations, roles, settings and readiness resources
  through typed same-origin `/api/v1` clients.
- The company layout no longer mounts `DemoStoreProvider`. Operational state is
  mounted only beneath `/{company}/workspaces/{workspace}`.
- `/{company}/members`, `/roles`, `/readiness`, `/profile`, and `/settings`
  are canonical company pages with no farm-demo dependency or active-workspace
  requirement.
- Member mutations update the explicit session membership model. Company role
  and workspace role mutations are independent, and reset restores canonical
  fixtures.
- The application shell derives a searchable Company/Workspace hierarchy from
  that same session graph. Inactive or inaccessible records never appear,
  Tenant is not selectable, and failed context changes retain the previously
  valid tuple.
- Workspace navigation requires the exact enabled module and read capability.
  Mutation controls independently require mutation capabilities.
- Workspace Dashboard, Settings and Masters load through typed nested mock
  endpoints. Costing is a distinct non-authoritative demo projection and
  company accounting configuration remains company-owned.
- Workspace identity, configured NOB, enabled LOBs, role and demo-data status
  remain visible across canonical workspace pages.

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

## Milestone 2 findings resolved

1. Company-wide operational provider coupling: resolved with a workspace-only
   provider layout.
2. Profile/settings farm-demo dependency: replaced by typed company modules.
3. Members/settings redirect and missing roles route: replaced with canonical
   typed pages.
4. Company readiness aliasing accounting: replaced by a multi-section
   aggregate linked to the dedicated accounting page.
5. Company/workspace role conflation: explicit independent mutation paths and
   tests.
6. Legacy company batch detail ownership: converted to a canonical workspace
   page plus compatibility redirect.

## Milestone 3 findings resolved

1. The shell selector now represents the documented Company/Workspace
   hierarchy without presenting Tenant as a selectable entity.
2. Context changes are atomic, double-submit safe and accessible by keyboard,
   with error recovery that preserves the previous tuple.
3. Cross-workspace routing preserves only supported list-level modules, drops
   record identifiers and otherwise falls back to Dashboard.
4. All ten canonical workspace pages are independently routed and gated by
   explicit workspace membership, enabled module and capability.
5. Workspace Dashboard, Settings and Masters use typed nested mock responses;
   Costing no longer aliases an accounting configuration page or claims
   authoritative journals.
6. Operational fixtures and browser state stay isolated by the full
   tenant/company/workspace tuple.
7. Manager, Viewer, Tenant/Company Admin, Accountant, Auditor, multi-company
   and no-workspace scenarios have explicit positive and negative browser
   coverage.

## Remaining frontend gaps

- User profile/password, setup helpers, and other older non-Milestone-2
  workflows still need strict request/response contract migration.
- Hybrid fallback can mask absent upstream endpoints and must be disabled for
  compatibility/integration runs.
- The final visual redesign is explicitly deferred.
- Workspace costing/report totals remain explicitly non-authoritative demo
  projections until production accounting rules and endpoints exist.

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
- Final custom-role catalogue, readiness policy, and industry-specific labels.

## Readiness estimates after Milestone 3

| Area | Estimate | Basis |
| --- | ---: | --- |
| Company/Workspace switcher and context completion | 98% | One shell hierarchy, atomic tuple commit, safe route policy, keyboard/mobile handling and negative membership coverage; production persistence/security remain out of scope. |
| Workspace demo completion | 94% | Ten canonical workspace destinations, typed Dashboard/Settings/Masters resources, module/capability gating and tuple isolation are implemented; durable data and authoritative costing remain absent. |
| Demo permission consistency | 97% | Exact company and workspace capabilities drive navigation, routes, actions and mock API enforcement across positive and negative account fixtures; durable custom-role policy remains unresolved. |
| Overall demo webapp completion | 88% | Authentication, context, company administration and broad workspace demo flows are coherent; final visual design and later strict boundary cleanup remain. |
| Frontend API-boundary readiness | 72% | Auth/context, company admin, workspace administration and new dashboard/settings/masters resources are typed; older lifecycle clients and backend DTO mismatches remain. |
| Combined backend integration readiness | 26% | Workspace persistence, session/context transport, authorization enforcement and shared contracts are still unreconciled. |

## Verdict

Milestone 3 is complete for the frontend mock demo. Its recorded validation
gate and focused screenshot audit pass. Real API integration remains blocked
by the backend and later milestones; no production authentication,
persistence, authorization, costing or reporting is claimed.
