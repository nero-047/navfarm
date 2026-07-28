# NAVFarm mock demo account scenarios

All accounts below use `Demo123!`. They exist only when `NAVFARM_API_MODE=mock`; the login account cards are not rendered in proxy or production modes.

| Account | Landing and intended presentation scenario |
| --- | --- |
| `system@navfarm.demo` | Platform dashboard and tenant registry/creation workflow. |
| `tenant@navfarm.demo` | Tenant console, two companies, company/workspace setup and accounting configuration; no workspace membership or operational mutation permission. |
| `manager@navfarm.demo` | Green Valley Poultry → Poultry Operations workspace: batches, operations, QC, QR, resources and reports. |
| `viewer@navfarm.demo` | Green Valley view-only workspace; create/manage controls and mutation API calls are denied. |
| `multi@navfarm.demo` | Explicit membership across three companies and four workspaces; Green Valley contains Poultry Operations and Feed Mill. Context persists in the server session. |
| `mfa@navfarm.demo` | MFA verification before any application session; completion returns Poultry Operations membership/context. Code: `123456`; recovery: `NAVFARM-RECOVERY`. |
| `suspended@navfarm.demo` | Suspended-tenant access-denied page with sign-out only. |
| `onboarding@navfarm.demo` | BlueWater profile setup; direct operational routes return to setup review until operational readiness is met. |

The current readiness policy distinguishes mandatory workspace foundation (steps 1–9) from accounting, NOB/LOB and essential-master prerequisites for operations (steps 11–13). Team, notifications and review completion remain documented as recommended/finish-workflow items; this demo does not infer additional accounting-close rules beyond that policy.
