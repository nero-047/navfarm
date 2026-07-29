# Company → Workspace alignment review

## Previous gap

The Phase 7 demo used company as both legal entity and operational data partition. That made multi-business-area companies ambiguous, allowed `company.manage` to be treated as operational authority in some mock paths, and left MFA/context payloads unable to identify an operational workspace.

## v1.1 alignment

- Workspace is now a first-class typed DTO and session membership.
- Tenant Admin configures companies and workspaces but has no implicit operational workspace membership.
- Operational roles are assigned per workspace.
- Canonical frontend routes include both company and workspace slugs.
- Company administration routes are canonical for legal entity configuration,
  shared masters, accounting, memberships and readiness. Only old
  company-only operational routes are compatibility resolvers.
- Platform reference masters remain platform-scoped; company and workspace masters cannot be intercepted by that namespace.

## Migration impact for Arun

1. Add workspace persistence and membership tables with tenant/company foreign keys and uniqueness for company plus workspace code/slug.
2. Add `activeWorkspaceId` and workspace memberships to login, session, MFA and recovery responses.
3. Enforce nested scope on every operational query and command.
4. Move operational resource endpoints beneath `companies/{companyId}/workspaces/{workspaceId}` while temporarily supporting documented client compatibility.
5. Keep COA, GL mapping and company legal/fiscal configuration company-scoped.
6. Implement optimistic concurrency, idempotency and the existing v1.0 error envelope.

No database or NestJS implementation is included in this frontend phase.

## Phase 9.3 shell alignment

- `/{company}/overview` is the canonical company landing route;
  `/{company}/dashboard` redirects there.
- Tenant is established by the authenticated session and is never a visible
  switcher row. The switcher displays Company administration → authorized
  Workspaces and updates the full server-side tuple atomically.
- Company navigation and workspace navigation are separate registries.
- Workspace presentation is centralized by DTO workspace type and enabled
  modules without changing identifiers or permission rules.

## Demo Completion Milestone 3 alignment

The frontend demo defines Workspace as the operational partition inside a
Company. Explicit metadata now includes owner Company, configured NOB, enabled
LOBs/modules, readiness, member count and current user's workspace role.
Workspace Masters and Settings are distinct typed resources; Company shared
masters and accounting remain company-scoped. The durable Workspace/NOB/LOB
backend policy is still unresolved and this frontend mapping is not a database
contract.
