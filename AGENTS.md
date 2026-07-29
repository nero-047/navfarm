<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# NAVFarm Project Context

## Current Product Phase and Scope

- NAVFarm is currently a frontend demo. The backend will be designed and implemented by another developer.
- Current product work is limited to the web demo in `apps/web` and, when explicitly requested, the Flutter app in `apps/mobile`.
- Do not implement or modify `apps/api`, databases, migrations, authentication services, server APIs, or external integrations unless the user explicitly expands the scope.
- Do not invent backend contracts. For demo features, use clearly local mock data, typed fixtures, component state, and/or browser storage. Keep mock boundaries easy to replace with real APIs later.
- Never represent mock persistence, mock authentication, calculated sample data, or placeholder integrations as production behavior.

## Product Source of Truth

- Read the relevant material in `rak docs/` before planning or implementing NAVFarm product behavior.
- Start with `rak docs/NAVFarm Wireframes Functional Doc.pdf` for the end-to-end functional process and UI/business rules.
- When files `0`, `1`, or `2` exist in both the root of `rak docs/` and `rak docs/Final_Docs/`, consult the `Final_Docs` copy first and treat it as the current version unless the user says otherwise.
- The workbooks cover company/tenant setup, NOB/LOB configuration, master data, GL mappings, QC/QR, slaughter cost splitting, resources, scheduler/KPI rules, variance calculations, and worked datasets. Use them to shape labels, flows, validation, information architecture, and realistic demo data.
- The docs describe the intended future system and data model; they do not authorize backend implementation in the current frontend-only phase.

## Domain Model Snapshot

- NAVFarm is multi-tenant: a tenant can contain one or more companies, with company-scoped users, roles, modules, language, currency, fiscal, and setup configuration.
- The main business hierarchy is Nature of Business (NOB) -> Line of Business (LOB) -> production batch. Supported domains include poultry, livestock/dairy, agriculture, aquaculture, beekeeping/insect farming, and feed/processing.
- Core future concepts include `STANDARD`, `FIFO`, and `BIO_ASSET` costing; batch WIP; automatic double-entry journals; close-time price/usage/output/overhead variances for standard-cost batches; QC hold/pass/fail; QR traceability; schedulers and KPI alerts; resources; and multi-level locations.
- The functional document defines a 15-step onboarding flow, with company profile, address, contacts, language, currency, timezone/region, fiscal setup, modules, and admin account treated as the mandatory foundation. Confirm exact step numbering and mandatory flags against the docs when building that flow.
- Demo screens should preserve farm-to-fork traceability and the relationships between source batches, daily operations, outputs/harvests, quality checks, costing, and reports even when the underlying data is mocked.

## Web Demo Conventions

- The web app is Next.js 16 + React 19 under `apps/web` and normally runs at `http://localhost:3001` during local development.
- The web demo uses the cookie-backed `AuthProvider` plus same-origin
  `/api/v1/auth/*` mock endpoints as its only live browser session source.
  Authentication and the active tenant/company/workspace tuple must not be
  mirrored to `localStorage`, `sessionStorage`, or a module-global snapshot.
  Mock sessions are process-memory fixtures, not durable or production
  authentication.
- The authenticated session establishes the tenant. Visible context selection
  is limited to Company administration and explicitly assigned Workspaces;
  never add tenant/organisation switching to the company/workspace selector.
- Company roles and tenant-administration permissions never grant workspace
  operational capabilities. Operational reads and mutations require a matching
  active tenant/company/workspace tuple, explicit workspace membership, and
  the requested workspace capability.
- Company administration is independent of operational demo state.
  `apps/web/src/app/[company]/layout.tsx` owns the company shell only;
  `DemoStoreProvider` is mounted exclusively by
  `apps/web/src/app/[company]/workspaces/[workspace]/layout.tsx`.
- Canonical company administration routes include `/{company}/profile`,
  `/members`, `/roles`, `/readiness`, and `/settings`. Their screens use the
  typed `modules/company-admin/client.ts` boundary and must never import mock
  repositories or farm-demo state directly.
- Company roles and workspace roles are separate assignments. Member changes
  must update the canonical explicit identity fixture, while workspace access
  is added/changed/removed only through an explicit workspace assignment.
- Company readiness aggregates company foundation, onboarding, shared masters,
  accounting, workspace creation/membership, NOB/LOB, and per-workspace
  operational readiness. Accounting readiness remains a separate detailed
  route. Unresolved readiness rules must stay informational, recommended, or
  policy-pending rather than becoming invented blockers.
- Company workspaces use `/{company}/...`. The company selector must show company entities, not industries or LOBs. Each company is assigned a documented NOB; piggery, dairy, rearing, laying, hatching, slaughter, crops, seeds, etc. belong inside the company as LOBs.
- Seed/demo NOB options must follow the docs: Poultry, Livestock, Agriculture, Aquaculture, Insect Farming, and Feed & Processing. New NOBs/LOBs should remain configuration-driven.
- Keep company-scoped navigation and UI reusable across industries. Prefer domain configuration and typed metadata over duplicating pages per company/LOB.
- Preserve the existing visual language unless the user asks for a redesign: navy navigation, white/light-gray content surfaces, restrained red/blue accents, compact typography, and card-based layouts.
- The frontend demo information architecture should cover: dashboard/overview, batches, daily operations, QC, QR traceability, resources and KPI schedules, financial/variance reports, and settings/onboarding/master data.
- Settings should reflect the documented setup domains: company profile and addresses/contacts, language and currency, timezone and fiscal rules, enabled modules/NOB/LOB configuration, users/roles, notifications, GL/item mappings, and master data. The current mock settings resource supports profile links, localization, fiscal configuration, modules, notifications, business-structure links, and setup status; do not invent additional persisted preferences.
- Treat incomplete pages as demo placeholders to be progressively backed by realistic local fixtures from the RAK docs, with visible `Demo data` labelling where users could otherwise mistake values for live records.

## Mobile App Conventions

- `apps/mobile` is a Flutter application. Keep mobile work in Flutter/Dart and align its terminology, flows, and fixtures with the web demo and the RAK docs.
- Do not assume that a web feature must be implemented in Flutter in the same task unless the user explicitly asks for both surfaces.

## Working Safely

- The user may have active route migrations or other uncommitted frontend changes. Inspect `git status` and preserve unrelated work.
- Run web and mobile validation through their Nx targets with `pnpm nx ...` as required by the workspace guidance above.
- For frontend demo work, verify the rendered UI at desktop and relevant mobile viewport sizes, not only types or source code.
