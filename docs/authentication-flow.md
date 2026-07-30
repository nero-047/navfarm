# Authentication and context flow

Status: implemented for the frontend mock demo; the matching backend session
service is not implemented.

1. The browser posts validated credentials to same-origin
   `POST /api/v1/auth/login`.
2. A non-MFA success creates an opaque process-memory session and issues
   `navfarm_session` as `HttpOnly`, `SameSite=Lax`, path `/`. The response is a
   complete `AuthSession`.
3. An MFA login returns a validated `MfaChallenge` and does not issue an
   application session cookie. Verification or recovery creates the complete
   session and enters `/context-selection`.
4. `AuthProvider` is the sole live browser session source. On mount it remains
   `loading` while `GET /api/v1/auth/session` restores the cookie session.
   Guards must not decide access during that state. Its other explicit states
   are `authenticated`, `unauthenticated`, `suspended`, `mfa_pending`, and the
   transient `signing_out` state.
5. `destinationForSession` resolves deterministic landings:
   Platform Administrator -> platform dashboard; Tenant Administrator ->
   tenant console; Company Administrator/Auditor -> company overview;
   Accountant -> accounting readiness; assigned operational role -> its
   explicit workspace; unresolved multi-company/MFA context ->
   `/context-selection`; incomplete setup -> company setup.
   A requested `returnTo` is considered only after the new session exists. The
   shared validator requires the new session to own the complete active
   tenant/company/workspace scope and required route capability. It rejects
   external URLs, nested return destinations, inactive or stale memberships,
   compatibility URLs, and every record-detail URL. Rejected destinations fall
   back to `destinationForSession`.
6. The authenticated session establishes `activeTenantId`. Users can select
   only Company administration or an assigned Workspace. The visible selector
   never offers tenant or organisation switching.
7. Every `PUT /api/v1/auth/context` sends the complete
   `(tenantId, companyId, workspaceId)` tuple. Company administration sends
   `workspaceId: null`. The server verifies resource ownership, explicit
   memberships, and active status before returning a new session; the client
   commits it only after success.
8. `GET /api/v1/auth/session` rejects a stored stale tuple rather than silently
   repairing it. `POST /api/v1/auth/logout` invalidates server state, expires
   the cookie, and clears tenant/company/workspace state in `AuthProvider`.
   The provider enters `signing_out` before the old shell can evaluate guards,
   closes transient shell UI, and replaces the route with clean `/login`.
   Explicit sign-out never retains `returnTo`.

`/company-selection` is retired and redirects to `/context-selection`.
Legacy token, browser-storage, and module-global session helpers have no live
consumer.

The authenticated shell uses the same context operation as
`/context-selection`. It groups active accessible companies and their active
assigned workspaces, prevents duplicate submissions, marks the selected row,
and preserves the previous tuple when the API rejects a change. Company
administration always sends `workspaceId: null`. Workspace selection sends the
workspace's owning tenant and company in the same request. Search, open/close,
Escape, focus restoration, focus containment and native button keyboard
activation are UI behavior only and create no second context store.

After a successful workspace change, only a supported canonical module list
may be retained. Record identifiers are stripped. A module hidden by the target
workspace's enabled-module or capability set falls back to Dashboard.

Mock process memory resets on Next.js restart. The optional reset endpoint
requires `NAVFARM_ENABLE_MOCK_RESET=true`, is absent in production, and is for
development/tests only. `Reset demo data` calls this one endpoint, invalidates
every active mock session, restores authentication, membership, role,
invitation, settings, readiness, notification, and operational fixtures, then
opens clean `/login`. Normal sign-out preserves business mutations. None of
this represents durable authentication, production authorization, or a
connected backend.

## Final presentation behavior

The root layout applies the saved light/dark preference before hydration to
avoid a theme flash. That preference is independent of the mock session.
Login and workflow inputs have visible labels and announced errors; demo
credentials explicitly disclaim production authentication and email delivery.
Signup and password-recovery remain compatibility routes but are not exposed
as primary login actions while their production lifecycles are incomplete.
The mobile navigation drawer, context switcher, company dialogs, and account
menu handle Escape and restore focus. Suspended accounts retain their specific
reason and sign-out action in both themes and at mobile width.
