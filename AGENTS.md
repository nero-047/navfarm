<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

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

- NAVFarm has moved past the frontend-demo stage. There is one maintainer, Rishi, covering all three surfaces: the NestJS backend (`apps/api`), the Next.js web app (`apps/web`), and the Flutter app (`apps/mobile`, when explicitly requested). There is no second maintainer and no separate backend owner. Concretely: `apps/api` is in scope for implementation work the same way `apps/web` and `apps/mobile` are — do not withhold, defer, or gate backend changes on the assumption that someone else will build or review them, and do not treat requests touching `apps/api` as out-of-scope by default.
- Authentication and core operational persistence are real, not mocked: login calls `POST /auth/login` against the API, and batch, animal, and milk-production data read/write through real endpoints (e.g. `GET/POST /batch`, `POST /batch/:id/transaction`, `POST /milk-production`, `POST /animal`). Do not describe this as demo/mock behavior in new work or docs.
- A few flows remain intentionally local-only and should stay that way until someone explicitly wires them up: batch-animal transfer, remove, and CSV import (`batch-animal-assignment-panel.tsx`) mutate local state only and discard on refresh; the piggery/dairy lifecycle stage catalogs (`DEFAULT_PIGGERY_STAGES`, `DEFAULT_DAIRY_STAGES`) are hardcoded reference arrays, and clicking a stage in either lifecycle stepper does not itself trigger a stage-transition API call. Treat these as known gaps, not demo conventions to preserve — call them out if you touch nearby code, but don't silently "fix" them into full API wiring unless asked.
- **Piggery is currently the only fully built-out NOB/LOB domain.** Dairy has some real daily-operations wiring already (see above) but is not the current focus. Other supported domains from the docs (poultry, agriculture, aquaculture, beekeeping/insect farming, feed/processing) are intentionally not built out yet — they will be added later. Don't proactively build out a non-piggery domain's operational screens unless the user asks for that domain specifically; keep domain-agnostic scaffolding (NOB/LOB config, navigation, master data) generic so adding a new domain later stays additive.
- Where a feature genuinely has no backend support yet (a new domain, a not-yet-built module), it's fine to prototype with local mock data/fixtures/component state — just keep the mock boundary obvious and easy to swap for a real API, and never present it as production behavior.

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
- Authentication is real (`POST /auth/login`); the session token/user is cached in browser storage the way any SPA does, not as a mock. Treat any remaining `navfarm_auth_user`/`navfarm_custom_companies`-style local-only state you find as a leftover to reconcile, not the intended pattern going forward.
- Company workspaces use `/{company}/...`. The company selector must show company entities, not industries or LOBs. Each company is assigned a documented NOB; piggery, dairy, rearing, laying, hatching, slaughter, crops, seeds, etc. belong inside the company as LOBs.
- Seed/demo NOB options must follow the docs: Poultry, Livestock, Agriculture, Aquaculture, Insect Farming, and Feed & Processing. New NOBs/LOBs should remain configuration-driven. Piggery (under Livestock) is the only domain currently built out end-to-end; the rest are seeded as config/catalog options but intentionally not built out until requested (see Current Product Phase and Scope above).
- Keep company-scoped navigation and UI reusable across industries. Prefer domain configuration and typed metadata over duplicating pages per company/LOB.
- Preserve the existing visual language unless the user asks for a redesign: navy navigation, white/light-gray content surfaces, restrained red/blue accents, compact typography, and card-based layouts.
- The frontend demo information architecture should cover: dashboard/overview, batches, daily operations, QC, QR traceability, resources and KPI schedules, financial/variance reports, and settings/onboarding/master data.
- Settings should reflect the documented setup domains: company profile and addresses/contacts, language and currency, timezone and fiscal rules, enabled modules/NOB/LOB configuration, users/roles, notifications, GL/item mappings, and master data.
- Treat incomplete pages as demo placeholders to be progressively backed by realistic local fixtures from the RAK docs, with visible `Demo data` labelling where users could otherwise mistake values for live records.

## Mobile App Conventions

- `apps/mobile` is a Flutter application. Keep mobile work in Flutter/Dart and align its terminology, flows, and fixtures with the web demo and the RAK docs.
- Do not assume that a web feature must be implemented in Flutter in the same task unless the user explicitly asks for both surfaces.

## Working Safely

- The user may have active route migrations or other uncommitted frontend changes. Inspect `git status` and preserve unrelated work.
- Run web and mobile validation through their Nx targets with `pnpm nx ...` as required by the workspace guidance above.
- For frontend demo work, verify the rendered UI at desktop and relevant mobile viewport sizes, not only types or source code.
