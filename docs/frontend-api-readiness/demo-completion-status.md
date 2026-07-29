# Demo Completion Status

## Final frontend demo capability

Milestones 1–4 complete the coherent local web-demo journey across Platform,
Tenant, Company, and Workspace scopes. The demo includes typed mock
authentication and MFA, specific access outcomes, atomic Company/Workspace
selection, company setup and administration, Members, Roles, Readiness,
Settings, canonical operational workspace routes, Manager/Viewer differences,
and a public-safe trace page.

The final presentation layer adds shared semantic design tokens, persistent
light/dark preference, consistent controls/cards/tables/dialogs/states,
explicit scope identity, a focus-contained mobile drawer, keyboard-restoring
dialogs and menus, responsive tables/cards, and visible demo-only disclosure.
Tenant/Organisation switching is intentionally absent.

## Intentional mock behaviour

- Sessions, context changes, MFA, users, companies, workspaces, and operational
  records are local typed mock responses.
- The reset endpoint is test/development-only and disabled unless explicitly
  configured.
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

- Final Nx gate: web typecheck, lint, unit tests, production build, web E2E
  typecheck, and full Playwright all pass with Nx cache disabled.
- Lint: 0 errors and 136 warnings. The warning backlog is confined to older
  non-canonical console/client code and does not include a Milestone 4 changed
  file.
- Unit tests: 26 suites and 129 tests passing.
- Playwright: 89 discovered, 86 passing, 3 intentional opt-in evidence-capture
  skips, and 0 failing.
- Focused Milestone 4 Playwright covers representative scope/theme, keyboard,
  public-trace, debug-removal, and all five viewport audits.
- Accessibility checks: configured `jsx-a11y` lint rules plus semantic,
  keyboard, Escape, focus containment/restoration, selected/current-state, and
  overflow assertions.
- Evidence: exactly 25 manually inspected PNGs in
  `docs/screenshots/demo-completion-m4/`—11 desktop light, 6 desktop dark, and
  8 mobile. Every desktop image is 1440×900 and every mobile image is 390×844.

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

## Readiness estimates

| Area | Estimate | Basis |
| --- | ---: | --- |
| Visual consistency | 96% | Canonical scopes use shared tokens/primitives; legacy non-canonical console remains. |
| Responsive completion | 96% | Canonical route sets pass 1440×900, 1280×800, 1024×768, 768×1024, and 390×844 overflow checks. |
| Accessibility completion | 92% | Configured lint and focused keyboard/semantic checks pass; independent production accessibility certification remains outside scope. |
| Overall demo webapp | 96% | The local presentation journey is coherent and evidence-backed. |
| Frontend API boundary | 72% | Typed mock boundaries are strong; older clients and real backend DTOs remain unreconciled. |

Verdict: Milestone 4 frontend demo presentation is complete. The full
validation gate and 25-image manual audit pass. Backend/production integration
remains blocked by the missing contracts and services above.
