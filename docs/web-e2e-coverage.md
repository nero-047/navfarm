# NAVFarm web E2E coverage

Phase 9 coverage lives in `apps/web-e2e/src/example.spec.ts`, `apps/web-e2e/src/phase7.spec.ts`, `apps/web-e2e/src/phase71.spec.ts`, `apps/web-e2e/src/phase9-api-readiness.spec.ts` and `apps/web-e2e/src/presentation-final.spec.ts`.

| Area | Browser coverage |
| --- | --- |
| Authentication and context | mock-only account cards, protected routing, platform/tenant/manager/viewer destinations, MFA failure/recovery, suspended access and tenant/company/workspace session persistence |
| Workspace administration | typed `/api/v1` workspace list, create, detail/edit, enabled modules, membership, readiness and empty/loading/error presentation |
| Onboarding and tenant administration | incomplete-company profile setup, tenant creation and company-creation route |
| Master data and accounting | masters, NOB/LOB, chart of accounts, GL mappings, readiness and permission restrictions |
| Operational demo | batch draft/approval, operation journal preview, QC hold/disposition, QR pack creation, resources/usages, costing, close, journals, variances and reports under an explicit `tenantId + companyId + workspaceId` scope |
| Workspace isolation | repository tests prove two workspaces in one company cannot read or mutate each other's batches, operations, quality lots, QR packs, resources/usages, costing, journals or variances |
| Legacy compatibility | dashboard, batches, operations, quality, traceability, resources, costing and reports verify the one-workspace redirect, multi-workspace selector and no-workspace access/setup outcomes |
| Responsive UI | document-overflow checks and presentation captures across 1440x900, 1280x800, 768x1024 and 390x844, including the mobile batch dialog |

The suite uses local same-origin `/api/v1` mock mode and never calls a production API. Chromium is the stable functional runner. Deterministic mock resets isolate critical role and workspace scenarios. Audited evidence is under `docs/screenshots/presentation-final/`; earlier phase evidence remains historical and is not automatically approved for presentation use.

Known boundary: browser state is intentionally temporary mock state. The suite verifies the UI, the typed same-origin API boundary and workspace isolation rules, not production persistence or authentication.
