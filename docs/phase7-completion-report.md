# Phase 7 completion report

## Scope

Phase 7 adds and refreshes Playwright coverage for the NAVFarm web demo only. No API service, database, mobile app, authentication provider, or external integration was changed.

## Changes

- Added deterministic Chromium runner settings for mock mode, traces, failure screenshots/videos, retries in CI, and a clean test-server start.
- Replaced stale onboarding and master-data expectations in the existing suite.
- Added an operational workflow specification covering batch creation/approval, an output operation and accounting preview, QC release, QR generation, close, variances and reports.
- Added responsive capture/overflow checks for 1440x900, 1280x800, 768x1024 and 390x844.

## Validation record

| Check | Result |
| --- | --- |
| `pnpm nx reset` | Non-blocking failure: `ENOTEMPTY, Directory not empty: /Users/nero/Desktop/navfarm/.nx/cache '/Users/nero/Desktop/navfarm/.nx/cache'`. Cache was not manually modified. |
| `pnpm nx run web:typecheck --skipNxCache` | Passed |
| `pnpm nx run web:lint --skipNxCache` | Passed with 148 existing warnings |
| `pnpm nx run web:test --skipNxCache` | Passed: 15 suites, 69 tests |
| `pnpm nx run web:build --skipNxCache` | Passed |
| `pnpm nx run web-e2e:typecheck --skipNxCache` | Passed |
| Existing E2E baseline | Reproduced stale onboarding and fixture assertions before their refresh. |
| `pnpm nx run web-e2e:e2e --skipNxCache` | Passed: 11 Chromium tests, 0 failed, 0 skipped, about 1.2 minutes. |

## Follow-up

The run created ten responsive screenshots under `docs/screenshots/phase7/`: dashboard (1440x900, 1280x800, 768x1024, 390x844), batches (1440x900, 390x844), QC (768x1024, 390x844), and reports (1440x900, 390x844). Every captured viewport passed the document-level horizontal-overflow assertion.

Two defects were fixed during the final E2E pass:

- The operational mock route matcher intercepted Phase 3 master-data URLs, causing `Operational workspace is not initialized`; it now only claims operational resource paths.
- Company selection now waits for the real operational-bootstrap response before the suite enters dependent routes, avoiding a mock-state initialization race.

The regenerated Phase 2/3 screenshot files are retained as refreshed evidence from the existing screenshot tests. Two additional Phase 2 onboarding-redirect PNGs are untracked. These are not Phase 7’s primary visual set and should be reviewed before being treated as approved replacements. Do not treat the demo mocks as a production backend contract.

## Phase 7.1 continuation

Phase 7.1 preserves the Phase 7 mock boundary and adds presentation-ready, deterministic account scenarios. The login page now presents mock-only credential-fill cards; it does not sign a user in automatically and the cards are omitted outside mock mode. MFA challenges are not committed to the application session before verification.

| Area | Phase 7.1 result |
| --- | --- |
| Role destinations | Platform, tenant, manager, viewer, multi-company, suspended and onboarding accounts use distinct deterministic outcomes. |
| Permission boundaries | Viewer mutation controls are absent and a direct mock mutation returns 403. Tenant administration retains configuration/accounting access without batch or daily-operation mutation rights. |
| MFA | Invalid verification leaves protected routes inaccessible; recovery code creates the authenticated session. |
| Onboarding | Incomplete BlueWater setup opens directly and operational URLs return to setup review while operations readiness is false. |
| Phase 2/3 regression | The operational adapter has a regression test proving it does not intercept master-data or accounting resources. |
| Responsive evidence | 11 new PNGs in `docs/screenshots/presentation/`; all required viewports have document-level overflow assertions. |

Readiness remains explicitly defined by the current policy: steps 1–9 establish workspace readiness; accounting/GL, NOB/LOB and essential masters establish operations readiness. No additional accounting-close requirement was invented.

The Phase 2/3 screenshots remain intentionally refreshed by their existing browser evidence tests. The two untracked onboarding-redirect screenshots remain outside the approved Phase 7.1 presentation set and require user review before adoption.

## Phase 9 API-readiness continuation

Phase 9 supersedes the earlier company-only operational mock boundary. Every operational URL, typed client request, repository partition and authorization check now carries `tenantId + companyId + workspaceId`. Repository isolation tests cover two workspaces belonging to the same company and prove both read and mutation separation.

Workspace administration now uses typed same-origin `/api/v1` clients for list, create, detail/edit, enabled modules, membership and readiness. The UI provides explicit loading, empty, error and permission states. Tenant administrators can configure workspaces without acquiring implicit operational permissions.

Legacy company operational routes for dashboard, batches, operations, quality, traceability, resources, costing and reports are compatibility resolvers only:

- one accessible workspace redirects to its canonical `/{company}/workspaces/{workspace}/{section}` route;
- multiple accessible workspaces render an explicit selector;
- no accessible workspaces render setup/access guidance.

The old Phase 7/7.1 validation tables above remain historical records. Current quality-gate results and the approved screenshot manifest belong in the Phase 9 audit documents; they must not be inferred from those earlier counts.

### Phase 9 final validation record

| Check | Result |
| --- | --- |
| `pnpm nx run web:typecheck --skipNxCache` | Passed |
| `pnpm nx run web:lint --skipNxCache` | Passed with 148 pre-existing warnings and 0 errors |
| `pnpm nx run web:test --skipNxCache` | Passed: 18 suites, 80 tests |
| `pnpm nx run web:build --skipNxCache` | Passed |
| `pnpm nx run web-e2e:typecheck --skipNxCache` | Passed |
| `pnpm nx run web-e2e:e2e --skipNxCache` | Passed: 26 Chromium tests |
| `git diff --check` | Passed after documentation synchronization |
