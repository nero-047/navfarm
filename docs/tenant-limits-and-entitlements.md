# Tenant limits and entitlements

Plans define default limits for companies, users, batches, API calls, and
storage plus feature entitlements. A tenant subscription can override permitted
limits.

The Phase 2 frontend displays current usage and warnings, but limits are also
enforced at the API boundary:

- Company creation returns `409 CONFLICT` when the company limit is reached.
- Invitations return `409 CONFLICT` when accepting another user would exceed
  the user limit.
- Suspended tenants receive `403 FORBIDDEN` for mutations.
- Duplicate tenant and company codes return `409 CONFLICT`.
- Permission and membership failures return `403 FORBIDDEN`.

The normalized error contains a stable code, message, request identifier, and
optional field/details payload. UI pre-checks improve feedback but are never
the authority.

Mock usage is deterministic seeded process memory. It is suitable for the demo,
tests, and proxy-contract development, not billing or operational persistence.
