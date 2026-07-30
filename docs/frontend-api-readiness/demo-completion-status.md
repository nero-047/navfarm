# Demo Completion Status

## Final frontend demo capability

Milestones 1–4 and the Phase 5 stabilisation pass complete the coherent local
web-demo journey across Platform, Tenant, Company, and Workspace scopes. The
demo includes typed mock
authentication and MFA, specific access outcomes, atomic Company/Workspace
selection, company setup and administration, Members, Roles, Readiness,
Settings, canonical operational workspace routes, Manager/Viewer differences,
and a public-safe trace page.

The final presentation layer adds shared semantic design tokens, persistent
light/dark preference, consistent controls/cards/tables/dialogs/states,
explicit scope identity, a focus-contained mobile drawer, keyboard-restoring
dialogs and menus, responsive tables/cards, and visible demo-only disclosure.
Phase 5 adds account-safe return routing, race-free sign-out and reset,
deterministic full-demo reset, exact sidebar ownership, canonical NOB/LOB
settings tabs, and account-scoped notification inboxes. Tenant/Organisation
switching is intentionally absent.

## Intentional mock behaviour

- Sessions, context changes, MFA, users, companies, workspaces, and operational
  records are local typed mock responses.
- The reset endpoint is test/development-only. It invalidates all mock sessions,
  clears the current cookie, and restores every in-memory mock repository to
  its seed state; the user must sign in again.
- Notification inbox contents and read state are deterministic,
  account-scoped, process-memory fixtures. They do not represent email, push,
  SMS, or background delivery.
- Costing, journals, reports, readiness, QR, and trace values are illustrative.
- Theme and sidebar persistence store UI preferences only.
- No mock action is represented as durable backend or production behavior.

## Canonical demo routes

- Platform: `/admin/dashboard`, `/admin/tenants`, `/admin/plans`,
  `/admin/masters`, `/admin/audit`
- Tenant: `/console/dashboard`, `/console/profile`, `/console/companies`,
  `/console/users`, `/console/invitations`, `/console/roles`,
  `/console/subscription`, `/console/usage`, `/console/audit`,
  `/console/notifications`
- Company: `/{company}/overview`, `/setup`, `/profile`, `/workspaces`,
  `/masters`, `/accounting`, `/members`, `/roles`, `/readiness`, `/settings`
- Workspace: `/{company}/workspaces/{workspace}/{dashboard,batches,operations,quality,traceability,resources,costing,reports,masters,settings}`
- Public trace: `/trace/{company}/{pack}`

## Remaining legacy UI

The canonical routes are presentation-ready, but legacy console modules under
`apps/web/src/components/console` remain outside the canonical navigation and
still account for the repository’s existing lint-warning backlog. Compatibility
operational URLs remain resolver redirects until documented links are fully
migrated. They are not a second business implementation.

## Backend work still missing

Durable session transport, password/MFA/email providers, authoritative RBAC,
tenant/company/workspace persistence, idempotency and concurrency, master-data
storage, batch/QC/QR workflows, resource allocation, journals, close policy,
variance/costing rules, reports, signed public trace payloads, and production
audit/event delivery remain backend work. Canonical endpoint and DTO
reconciliation is still required before mock fallback can be disabled.

## Production claims explicitly excluded

This frontend does not claim production authentication, security,
authorization enforcement, delivery integrations, data durability, accounting
accuracy, regulatory compliance, trace certification, availability, or backend
integration readiness. Public trace copy explicitly identifies demo data.

## Validation and evidence

- Final Phase 5 Nx gate: web typecheck, lint, unit tests, production build, web
  E2E typecheck, focused Phase 5 Playwright, and full Playwright all pass with
  Nx cache disabled.
- Lint: 0 errors and 136 warnings. The warning backlog is confined to older
  non-canonical console/client code and does not include a Phase 5 changed
  implementation file.
- Unit tests: 28 suites and 140 tests passing.
- Focused Phase 5 Playwright: 9 tests passing, including the explicit
  evidence-capture run.
- Full Playwright: 98 discovered, 94 passing, 4 intentional opt-in
  evidence-capture skips, and 0 failing.
- Focused Phase 5 Playwright covers stale/cross-account return URLs, sequential
  account outcomes, sign-out, full reset, exact sidebar ownership, NOB/LOB
  navigation, desktop notifications, and the mobile notification dialog.
- Accessibility checks: configured `jsx-a11y` lint rules plus semantic,
  keyboard, Escape, focus containment/restoration, selected/current-state, and
  overflow assertions.
- Evidence: exactly 25 manually inspected PNGs in
  `docs/screenshots/demo-completion-m4/`—11 desktop light, 6 desktop dark, and
  8 mobile. Every desktop image is 1440×900 and every mobile image is 390×844.
- Phase 5 evidence: exactly 4 manually inspected PNGs in
  `docs/screenshots/demo-stabilisation-p5/`—3 desktop at 1440×900 and 1 mobile
  at 390×844.

### Final screenshot inventory

Desktop light:

1. `login-demo-accounts-light-1440x900.png`
2. `platform-dashboard-light-1440x900.png`
3. `tenant-dashboard-light-1440x900.png`
4. `company-overview-light-1440x900.png`
5. `company-members-light-1440x900.png`
6. `company-readiness-light-1440x900.png`
7. `company-workspace-switcher-light-1440x900.png`
8. `workspace-dashboard-light-1440x900.png`
9. `workspace-batches-light-1440x900.png`
10. `workspace-quality-light-1440x900.png`
11. `workspace-traceability-light-1440x900.png`

Desktop dark:

12. `platform-dashboard-dark-1440x900.png`
13. `company-overview-dark-1440x900.png`
14. `company-members-dark-1440x900.png`
15. `workspace-dashboard-dark-1440x900.png`
16. `workspace-batches-dark-1440x900.png`
17. `workspace-costing-dark-1440x900.png`

Mobile:

18. `login-mobile-390x844.png`
19. `tenant-dashboard-mobile-390x844.png`
20. `company-members-mobile-390x844.png`
21. `company-readiness-mobile-390x844.png`
22. `workspace-switcher-mobile-390x844.png`
23. `workspace-dashboard-mobile-390x844.png`
24. `workspace-batches-viewer-mobile-390x844.png`
25. `suspended-account-mobile-390x844.png`

### Phase 5 screenshot inventory

1. `notification-popover-1440x900.png`
2. `clean-account-switch-accountant-1440x900.png`
3. `sidebar-accounting-active-1440x900.png`
4. `notification-mobile-390x844.png`

## Readiness estimates

| Area | Estimate | Basis |
| --- | ---: | --- |
| Visual consistency | 96% | Canonical scopes use shared tokens/primitives; legacy non-canonical console remains. |
| Responsive completion | 96% | Canonical route sets pass 1440×900, 1280×800, 1024×768, 768×1024, and 390×844 overflow checks. |
| Accessibility completion | 92% | Configured lint and focused keyboard/semantic checks pass; independent production accessibility certification remains outside scope. |
| Account isolation | 98% | Login return routing, context ownership, sequential account switches, sign-out, and reset are covered by unit and browser tests; production enforcement still belongs to the backend. |
| Navigation consistency | 98% | Canonical routes now have one exact sidebar owner and NOB/LOB configuration resolves through Settings; compatibility redirects remain documented. |
| Notification completeness | 90% | The account-scoped demo inbox, unread state, mark-one/all, desktop/mobile interactions, and failure states are implemented; delivery and durable storage remain backend work. |
| Practical demo readiness | 98% | Deterministic reset, clean account switching, canonical navigation, notifications, and focused evidence remove the principal live-demo reliability risks. |
| Overall demo webapp | 98% | The local presentation journey is coherent, deterministic, and evidence-backed. |
| Frontend API boundary | 72% | Typed mock boundaries are strong; older clients and real backend DTOs remain unreconciled. |

Verdict: Phase 5 frontend demo stabilisation is complete. The full validation
gate, focused Phase 5 suite, and four-image Phase 5 manual audit pass.
Backend/production integration remains blocked by the missing contracts and
services above.
