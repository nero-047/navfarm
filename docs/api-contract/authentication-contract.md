# Authentication Contract

Production must use secure session credentials. Mock accounts and common demo passwords are not production behavior.

## Login

`POST /api/v1/auth/login`

Request:

```json
{ "email": "user@example.com", "password": "secret" }
```

Response when MFA is not required: `authSessionSchema`, plus HTTP-only session cookie.

Response when MFA is required:

```json
{
  "user": { "...": "minimal user identity" },
  "tenants": [],
  "companies": [],
  "activeTenantId": null,
  "activeCompanyId": null,
  "expiresAt": "2026-07-27T10:05:00.000Z",
  "mfaRequired": true,
  "challengeId": "challenge-id"
}
```

No application session cookie should be established until MFA verification or recovery succeeds.

## Session Response

`AuthSession` contains:

- `user`
- `tenants`
- `companies`
- `activeTenantId`
- `activeCompanyId`
- `expiresAt`
- optional `mfaRequired`
- optional `challengeId`

Company memberships include `companyId`, `tenantId`, `companyName`, `companySlug`, `status`, `onboardingStatus`, `role`, `permissions`, and `enabledModules`.

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

If the active tenant is suspended:

- Login may return a session so the UI can show the suspended access page.
- Protected tenant/company API calls must return 403.
- Frontend routes redirect to `/access-denied?reason=suspended-tenant`.
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
{ "tenantId": "tenant-id", "companyId": "company-id" }
```

Rules:

- `tenantId` may be null only when the UI intentionally returns to context selection.
- `companyId` may be null for tenant console context.
- Backend must verify tenant membership and company membership.
- Invalid membership returns 403.
- Multi-company selection persists in the session.

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

