# NAVFarm web E2E coverage

Phase 7 coverage lives in `apps/web-e2e/src/example.spec.ts` and `apps/web-e2e/src/phase7.spec.ts`.

| Area | Browser coverage |
| --- | --- |
| Authentication and context | invalid/session-protected routing, system/tenant/company context selection and sign-out routes |
| Onboarding and tenant administration | incomplete-company onboarding redirect, tenant creation and company-creation route |
| Master data and accounting | masters, NOB/LOB, chart of accounts, GL mappings, readiness and permission restrictions |
| Operational demo | batch draft/approval, operation journal preview, QC hold/disposition, QR pack creation, close, variances and reports |
| Responsive UI | dashboard, batches, QC and reports at 1440x900, 1280x800, 768x1024 and 390x844 |

The suite uses the local mock API mode. It never calls a production API. Chromium is the stable functional runner; captures are written under `docs/screenshots/phase7/`.

Known boundary: the browser demo state is intentionally temporary mock state. The suite verifies the UI and its local API boundary, not a production persistence or authentication implementation.
