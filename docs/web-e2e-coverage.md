# NAVFarm web E2E coverage

Phase 7.1 coverage lives in `apps/web-e2e/src/example.spec.ts`, `apps/web-e2e/src/phase7.spec.ts` and `apps/web-e2e/src/phase71.spec.ts`.

| Area | Browser coverage |
| --- | --- |
| Authentication and context | mock-only account cards, protected routing, platform/tenant/manager/viewer destinations, MFA failure/recovery, suspended access and multi-company session persistence |
| Onboarding and tenant administration | incomplete-company profile setup, tenant creation and company-creation route |
| Master data and accounting | masters, NOB/LOB, chart of accounts, GL mappings, readiness and permission restrictions |
| Operational demo | batch draft/approval, operation journal preview, QC hold/disposition, QR pack creation, close, variances and reports |
| Responsive UI | document-overflow checks and presentation captures across 1440x900, 1280x800, 768x1024 and 390x844, including the mobile batch dialog |

The suite uses the local mock API mode. It never calls a production API. Chromium is the stable functional runner. Phase 7.1 covers 18 Chromium tests with deterministic mock resets for critical role scenarios. Presentation evidence is under `docs/screenshots/presentation/`; Phase 7 baseline evidence remains under `docs/screenshots/phase7/`.

Known boundary: the browser demo state is intentionally temporary mock state. The suite verifies the UI and its local API boundary, not a production persistence or authentication implementation.
