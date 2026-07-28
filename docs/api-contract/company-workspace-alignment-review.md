# Company → Workspace alignment review

## Previous gap

The Phase 7 demo used company as both legal entity and operational data partition. That made multi-business-area companies ambiguous, allowed `company.manage` to be treated as operational authority in some mock paths, and left MFA/context payloads unable to identify an operational workspace.

## v1.1 alignment

- Workspace is now a first-class typed DTO and session membership.
- Tenant Admin configures companies and workspaces but has no implicit operational workspace membership.
- Operational roles are assigned per workspace.
- Canonical frontend routes include both company and workspace slugs.
- Company-only routes are compatibility surfaces, not the future API shape.
- Platform reference masters remain platform-scoped; company and workspace masters cannot be intercepted by that namespace.

## Migration impact for Arun

1. Add workspace persistence and membership tables with tenant/company foreign keys and uniqueness for company plus workspace code/slug.
2. Add `activeWorkspaceId` and workspace memberships to login, session, MFA and recovery responses.
3. Enforce nested scope on every operational query and command.
4. Move operational resource endpoints beneath `companies/{companyId}/workspaces/{workspaceId}` while temporarily supporting documented client compatibility.
5. Keep COA, GL mapping and company legal/fiscal configuration company-scoped.
6. Implement optimistic concurrency, idempotency and the existing v1.0 error envelope.

No database or NestJS implementation is included in this frontend phase.
