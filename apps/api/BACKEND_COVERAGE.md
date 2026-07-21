# Backend and web coverage

Snapshot: 2026-07-21. Compared against the web app, the imported NestJS source,
and `rak docs/NAVFarm Wireframes Functional Doc.pdf`.

## Implemented API capabilities

| Area | API implementation |
| --- | --- |
| Platform health/docs | Database-independent liveness route and Swagger/OpenAPI UI |
| SaaS plans | Plan list/detail/create/update/delete |
| Tenants | Platform-admin tenant provisioning, list/detail/update, plan changes, company/user lookup, deletion |
| Authentication | Login, refresh-token rotation, current profile, admin/user registration, MFA verification and MFA secret URI |
| Companies | Tenant-scoped company create/read/update/deactivate |
| Onboarding | Steps 1-8 persistence, status across 15 steps, mandatory-step completion gate, company setup summary |
| NOB/LOB catalog | List and platform-admin CRUD |
| Users and RBAC | User CRUD, company user lists, role CRUD, assignments, and granular permission matrix |
| Localization | Language CRUD, translation resolution, and translation writes |
| Currency | Currency CRUD, exchange-rate listing and rate writes |
| Notifications | Channel/SMTP configuration CRUD, delivery logs, and SMTP test delivery |
| Audit | Tenant-scoped audit log queries |
| Persistence | MySQL control plane plus database-per-tenant Drizzle schemas and migrations |

## Present only as schema or placeholders

The imported backend names batch, breed, costing, item, location, QC, QR,
resource, slaughter, and UOM modules, but those folders contain no controllers
or services. Its Drizzle tenant migration currently covers platform/setup and
master-data tables only. Separate SQL design files describe additional
operational tables, but they are not part of the active Drizzle migration or
reachable through API endpoints.

## Web features with no matching API contract

| Web demo capability | Backend gap |
| --- | --- |
| Executive dashboard and charts | No KPI aggregation, dashboard, alert, or scheduler endpoints |
| Production batch lifecycle | No batch create/approve/start/pause/resume/cancel/close service or status-transition rules |
| Source-batch lineage | No batch input/output lineage API |
| Daily operations | No consumption, observation, mortality, output, overhead, or resource-entry API |
| Automated journals/WIP | No journal engine, entry-type mapping service, WIP ledger, or GL-posting API |
| STANDARD/FIFO/BIO_ASSET costing | No costing engine, FIFO layers, biological-asset valuation, or close-time variance posting |
| QC hold/pass/fail | No quality-lot, inspection, disposition, release, or close-blocking API |
| QR packs and public trace page | No pack issuance, QR payload, scan lookup, or trace-chain API |
| Resources | No manpower/equipment/vehicle/utility master or allocation API |
| Reports | No P&L, variance, cost, inventory, or traceability reporting API |
| GL/item mappings | No controller/service despite the settings UI and source documents requiring it |
| Master data UI | Tables exist for UOM, items, conversions, attributes, breeds, and locations, but there is no CRUD API |
| Full 15-step onboarding | Steps 9-15 are represented in status metadata, but only steps 1-8 have dedicated persistence endpoints; step 9 is partially covered by admin registration |
| Password reset UI | No forgot-password/reset-password API endpoints |
| Guided demo and browser persistence | Web behavior remains local mock state and is not synchronized to the API |

## Contract mismatches to resolve before connecting the web app

- The web currently stores authentication and farm workflows in browser storage;
  it has no API client, token lifecycle, or tenant-header handling.
- Web company/NOB identifiers are readable slugs/codes, while API records use
  tenant/company UUIDs plus codes.
- Web setup state is one object; the API splits it across company, address,
  contacts, fiscal, module, language, currency, user, and wizard-log records.
- Web operational types are demo-oriented and must not be treated as final
  backend contracts. The authoritative workflow requires balanced journals,
  QC gates, traceability, and costing invariants that are absent from the API.
- Production hardening remains: encrypt tenant DB credentials, restrict CORS,
  add rate limiting, remove cross-tenant login scans, complete MFA tenant
  context handling, add integration tests against MySQL, and implement secrets
  management/rotation.
