# Master data: derive context, scope by workspace, locate breeds

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Stop asking the user for facts the system already knows, make the master list follow the workspace the user is standing in, and give Breed a location so its code carries where the breed is kept.

**Spec:** [2026-09-04-piggery-bbp-aligned-posting-design.md](../specs/2026-09-04-piggery-bbp-aligned-posting-design.md)
**Prior work:** code series and composite codes are implemented — C1 `188782d`, C2 `fbf1146`, C3 `ee86909`. `generateCompositeCode` already exists and is what D3 reuses.

## Global Constraints

- Dev servers run on 2877 and 3002. Do not start or stop them. **NEVER run `pkill`** — it previously matched the tooling's own process and killed the session.
- API tests are **339/339**: `pnpm nx test api`. Report the count; it must not regress.
- Typecheck: `pnpm nx run-many -t typecheck -p api web`. Lint web ≤88 (currently 83).
- Read every generated migration before applying. Drizzle writes ``ADD `col` ``, not `ADD COLUMN`.
- A full database backup exists; its path is in `LAST_BACKUP_PATH` in the session scratchpad.
- Commit trailer: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Measured starting position

**Seven primary masters ask for NOB and LOB**: `stage`, `number-series`, `animal`, `item`, `breed`, `medicine`, `resource`.

**The data is already piggery-only** — 33 items and 11 stages, every one `LVS_PIGGERY`. What surfaces other lines of business is the *picker*: `lob_master` holds 16 taxonomy rows and the NOB dropdown offers all 6 natures of business. The user is seeing Poultry and Aqua in a dropdown, not in their data.

**NOB/LOB currently live on `operational_area_master`**, not on the company. BBP §1.1 puts them on the Company; spec §4.4 records that move as planned and **not yet executed**. D1 must therefore derive from the operational area for now, and be written so the source can change when §4.4 lands.

**No master table has an `operational_area_id`.** All 37 are scoped `tenant_id + company_id`. D2 therefore introduces no new scoping dimension: operational scope simply inherits its area's company.

---

## D1 — Remove NOB/LOB from the forms, derive them

- [ ] **Step 1: Drop the fields from the seven configs.** Remove the `nob_id` and `lob_id` field entries from `stage`, `number-series`, `animal`, `item`, `breed`, `medicine`, `resource` in `apps/web/src/modules/master-data/configs.ts`. Do **not** drop the columns — the data stays, only the question goes.

- [ ] **Step 2: Set them server-side on create.** Each affected service must populate `nob_id`/`lob_id` from context rather than from the DTO. Resolution order:
  1. the active operational area's `nob_id`/`lob_id`, when an area is in context
  2. else, the distinct NOB/LOB across the company's active operational areas — if there is exactly one
  3. else leave null, and do not fail the create

  Rule 3 matters: a tenant with two areas on different LOBs must not be blocked from creating an item. Put this resolution in ONE place — a shared helper — not copied into seven services.

- [ ] **Step 3: Keep accepting them on the DTO.** Do not remove `nob_id`/`lob_id` from the Create DTOs. `main.ts` runs `forbidNonWhitelisted`, so anything still sending them would 400, and a caller-supplied value should still win over the derived one. This is the same trap `list-dto-company-scope.spec.ts` was written for.

- [ ] **Step 4: Test.** Creating an item with no `nob_id` in the payload, in a company with one piggery area, stores `LVS_PIGGERY`. Creating one where the company has two areas on different LOBs stores null and still succeeds.

---

## D2 — Master list follows the workspace scope

- [ ] **Step 1: Remove the Master Scope selector** from `apps/web/src/components/console/master-data/master-data-page-shell.tsx` — the `TENANT_ADMIN` company `<select>` and its `selectedCompanyId` state.

- [ ] **Step 2: Take the company from the workspace.** Use the active company already held by the shell (`getActiveCompanyId()`, the same value sent as `x-active-company-id`). Behaviour per scope:
  - **Tenant** — tenant-wide masters (`company_id IS NULL`)
  - **Company** — that company's masters, plus tenant-wide ones, which is what the services already return via `or(company_id = X, company_id IS NULL)`
  - **Operational** — the masters of that area's company. No new scoping; the area inherits its company.

- [ ] **Step 3: Keep the remount key.** `MasterDataTable` is keyed on `${config.key}-${selectedCompanyId}` because it holds its own fetch and form state. Whatever replaces `selectedCompanyId` must still change when the workspace company changes, or switching company will show the previous company's rows.

- [ ] **Step 4: Do not silently drop the tenant admin's ability to maintain another company's masters.** If removing the selector takes that away, say so in the commit message — it is a real capability change, not a cosmetic one.

**Note, do not fix here:** the same header still renders the **Preseed** button, which clones tenant rows into company scope while the list returns both, so items appear twice. It is company-admin only. Removing it is A1 Task 6 and is deliberately out of scope for this plan.

---

## D3 — Breed gets a location, and a composite code

- [ ] **Step 1: Schema.** Add `location_id` varchar(36), **nullable**, to `breed_master`, with an FK to `location_master`. Nullable because existing breeds have none and must not be broken. Generate the migration and read it before applying.

- [ ] **Step 2: Config.** Add a Location field to the `breed` config — `type: "select-entity"`, `entityEndpoint: "/location"`, `entityValueKey: "location_id"`, in the Identification section.

- [ ] **Step 3: Code generation.** A breed's code becomes `<location_code>/<prefix>-<seq>`, where the prefix comes from the breed's type via the C1 resolution already built, and the sequence counts **per location** — the same per-parent rule Location uses and that was verified live (`FARM-002/SHED-001`, not `SHED-003`).

  Reuse `generateCompositeCode` from C2. Do not write a second implementation.

  When no location is given, or no series is configured for the breed type, the code stays **manual** — consistent with C1's rule that nothing auto-numbers until configured.

- [ ] **Step 4: Check the column width.** `breed_code` must hold a composite. `location_code` was widened to varchar(255) for this reason; widen `breed_code` to match if it is narrower.

- [ ] **Step 5: Test.** A breed created against location `FARM-001` with breed type `SOW` and a configured series gets `FARM-001/SOW-001`; a second gets `FARM-001/SOW-002`; one against `FARM-002` gets `FARM-002/SOW-001`. A breed with no location keeps manual entry.

## Out of scope

- Moving NOB/LOB from the operational area to the Company (spec §4.4).
- Adding `operational_area_id` to masters.
- Removing the Preseed button.
- Location fields on any master other than Breed — the user confirmed Breed only.
