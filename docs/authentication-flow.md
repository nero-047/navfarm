# Authentication and context flow

1. The browser posts credentials to same-origin `POST /api/v1/auth/login`.
2. Mock mode creates an opaque process-memory session and issues
   `navfarm_session` as `HttpOnly`, `SameSite=Lax`, path `/`. Proxy mode
   forwards upstream `Set-Cookie` without exposing tokens to JavaScript.
3. `AuthProvider` loads `GET /api/v1/auth/session` with credentials included.
4. MFA-enabled accounts continue through `/mfa/verify` or `/mfa/recovery`.
5. `destinationForSession` evaluates platform access, tenant status,
   memberships, company status, and onboarding:
   - platform user -> platform dashboard;
   - multiple unresolved memberships -> context selection;
   - suspended/inactive/no access -> access-denied;
   - incomplete mandatory setup -> onboarding;
   - otherwise -> company dashboard or tenant console.
6. Context changes call `PUT /api/v1/auth/context`; tenant/company identity is
   held in the server session, never localStorage.
7. Logout calls `POST /api/v1/auth/logout`, invalidates server state, and
   expires the cookie.

Mock process memory, including sessions, resets on Next.js restart. The optional
reset endpoint requires `NAVFARM_ENABLE_MOCK_RESET=true`, is absent in
production, and is intended only for development/tests.
