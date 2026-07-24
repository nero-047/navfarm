# Tenant lifecycle

Phase 2 models a tenant as a platform-owned subscription boundary containing
companies, users, invitations, roles, entitlements, usage, and audit events.

## States

| State | Meaning | Allowed administration |
| --- | --- | --- |
| `trial` | Active evaluation period | Normal tenant and company setup within trial limits |
| `active` | Paid or explicitly activated | Normal tenant and company setup within plan limits |
| `suspended` | Platform access paused | Read-only inspection; tenant and setup mutations denied |
| `inactive` | Not currently provisioned | Platform inspection and reactivation only |

Only a system administrator can create, suspend, activate, or reactivate a
tenant or alter its subscription and hard limits. Tenant administrators can
manage resources inside their own active tenant.

## Creation and audit

Tenant creation validates identity, plan, billing cycle, administrator contact,
currency, and requested limits. Tenant codes are unique. The mock repository
seeds deterministic lifecycle examples and records lifecycle changes in the
platform and tenant audit streams. Its process memory resets with the server
and is not production persistence.

No existing legacy route was deleted: `/organization` and `/tenant-admin`
continue to redirect to `/console/dashboard`.
