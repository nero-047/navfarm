# Authentication Contract

Production must use secure session credentials. Mock accounts and common demo passwords are not production behavior.

## Login

`POST /api/v1/auth/login`

Request:

```json
{ "email": "user@example.com", "password": "secret" }
```

Response when MFA is not required: `authSessionSchema`, plus HTTP-only session cookie.

Response when MFA is required: `mfaChallengeSchema`.

```json
{
  "state": "MFA_PENDING",
  "user": { "...": "minimal user identity with no memberships" },
  "expiresAt": "2026-07-27T10:05:00.000Z",
  "challengeId": "challenge-id"
}
```

No application session cookie should be established until MFA verification or recovery succeeds.

## Session Response

`AuthSession` contains:

- `state`: `AUTHENTICATED` or `SUSPENDED`
- `user`
- `tenants`
- `companies`
- `workspaces`
- `activeTenantId`
- `activeCompanyId`
- `activeWorkspaceId`
- `expiresAt`

Company memberships include `companyId`, `tenantId`, `companyName`, `companySlug`, `status`, `onboardingStatus`, `role`, `permissions`, and `enabledModules`.
Workspace memberships independently include `workspaceId`, `tenantId`,
`companyId`, code/slug/name/type/status, role, permissions and enabled modules.
Company membership does not imply workspace membership.

`MFA_PENDING` is deliberately not an `AuthSession`. It contains no tenant,
company, workspace, or protected-data membership payload.

## MFA Verification

`POST /api/v1/auth/mfa/verify`

Request:

```json
{ "challengeId": "challenge-id", "code": "123456" }
```

Response: full `AuthSession` and session cookie.

Invalid code: 401 with error envelope.

## Recovery Code

`POST /api/v1/auth/mfa/recovery`

Request:

```json
{ "challengeId": "challenge-id", "recoveryCode": "RECOVERY-CODE" }
```

Response: full `AuthSession` and session cookie.

Backend responsibilities:

- One-time recovery-code use.
- Recovery-code hashing at rest.
- Audit event for recovery login.
- Rate limit and lockout policy.

## Suspended Account

If the account or its active tenant is suspended:

- Login may return a session so the UI can show the suspended access page.
- Protected tenant/company API calls must return 403.
- Frontend routes redirect to `/access-denied?reason=account_suspended`.
- Logout must clear the session.

## Incomplete Onboarding

If the active company has `onboardingStatus` other than `COMPLETED`:

- Login routes to `/onboarding`, resolved in the UI to `/{companySlug}/setup/profile`.
- Direct operational routes redirect to setup review when `operationsReady` is false.
- API must provide `GET /companies/{companyId}/setup/status`.

## Logout

`POST /api/v1/auth/logout`

Response:

```json
{ "success": true }
```

Backend must clear the HTTP-only cookie even if the session was already invalid.

## Session Refresh

`GET /api/v1/auth/session`

Response: `AuthSession`.

401 response clears frontend auth state and returns user to login.

## Context Selection

`PUT /api/v1/auth/context`

Request:

```json
{ "tenantId": "tenant-id", "companyId": "company-id", "workspaceId": "workspace-id" }
```

Rules:

- The session determines which tenant IDs are available. The visible selector
  never renders a tenant/organisation choice.
- `tenantId` may be null only for platform scope or an unresolved explicit
  company choice.
- `companyId` may be null for tenant console context.
- `workspaceId` may be null for company configuration or workspace selection.
- The complete tuple is sent atomically. Backend must verify the user's tenant
  membership, tenant status, company ownership and explicit membership, company
  status, workspace ownership and explicit membership, and workspace status.
- Changing tenant clears company and workspace. Changing company clears stale
  workspace state. Logout clears all three context levels.
- Invalid membership, ownership, inactive state, suspension, and stale tuple
  return specific stable error codes.
- Multi-company/workspace selection persists in the session.
- MFA verification and recovery return the same complete membership/context
  structure as ordinary login.
- The browser must not update its active context until the successful response
  validates as `authSessionSchema`.

## Required Security Behavior

- Same-origin HTTP-only session cookie.
- `SameSite=Lax`; `Secure` in production.
- CSRF protection for mutations.
- Rate limiting for login, MFA and recovery.
- MFA challenge expiration.
- No tokens in localStorage.
- No demo credentials or mock account cards in production mode.
- Request IDs on every response.
- Audit events for login, logout, MFA, recovery, context changes and failed permission checks.

## Delivery status

- Implemented mock demo: typed login/challenge/session/context/logout flows,
  opaque HTTP-only cookie, restore/hydration states, deterministic fixtures,
  and specific context failure codes.
- Frontend contract ready: Zod request/response schemas and same-origin
  `/api/v1` client boundary.
- Backend missing: durable identity/session store, credential security,
  CSRF/rate limiting/audit, membership persistence, and production
  authorization.
- Retired: browser token/local-storage auth, module-global session snapshot,
  and `/company-selection` business logic.
