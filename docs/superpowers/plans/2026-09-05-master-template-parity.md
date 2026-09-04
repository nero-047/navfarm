# Master Template Parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Bring every master's console form up to the client's Master Template field specification, and add the columns the templates require that the database does not yet have.

**Architecture:** Three phases ordered by risk. P1 is config-only — the columns and DTO fields already exist, they simply are not on screen. P2 adds the genuinely new columns in one migration. P3 changes the location code generator to produce hierarchical composites. Every phase leaves the app working.

**Tech Stack:** NestJS, Drizzle ORM, MySQL, Next.js, Jest 30, Nx.

**Spec:** [2026-09-04-piggery-bbp-aligned-posting-design.md](../specs/2026-09-04-piggery-bbp-aligned-posting-design.md)
**Source of field truth:** `Master Templates/*.xlsx` (committed at `f7e89ff`). The `Triple-C_Report Field_Template_V0.1.xlsx` in that folder is **future report scope** and is not a master-data source.

## Global Constraints

- **Demo 2026-09-05 20:00.** Every phase must leave the console working.
- **Authority order:** BBP-1 → the user's direct instruction → the running codebase. `rak docs/` is not a source.
- **Only one agent edits `apps/web/src/modules/master-data/configs.ts` at a time.** Every phase touches it.
- Web lint baseline **88** — gate on "no new", never touch `react-hooks/exhaustive-deps`.
- Typecheck clean: `pnpm nx run-many -t typecheck -p api web`. API tests: `pnpm nx test api`.
- Migrations: `pnpm nx run api:db-generate-tenant`, then **read the generated SQL before applying**.
- Commit trailer: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Measured starting position

Verified against `schema.ts`, the DTOs and `configs.ts` — not assumed. Fuzzy name matching was used deliberately, because two earlier passes in this project produced false "missing" results from exact-name greps.

**Already on screen — no work:** all ten Item fields (`sub_category`, `tracking_series_id`, min/max stock, reorder level, lead time, shelf life, storage temp min/max, image URL).

**In the schema AND accepted by the DTO, but not on screen — P1, config-only:**

| Master | Fields | Config type |
|---|---|---|
| breed | `vaccination_schedule` | json |
| animal | `current_bio_asset_value`, `total_amortised`, `residual_value` | number |
| animal | `expected_cull_date`, `disposal_date` | date |
| animal | `disposal_type` | text |
| stage | `required_kpi_to_pass` | json |

**Exists under a different name — expose the existing column, do NOT add a new one:**

| Template calls it | Actual column |
|---|---|
| Withdrawal Period Days | `item_master.withdrawal_days` |
| QR Code Enabled | `item_master.is_qr_enabled` (+ `qr_trigger_event`) |
| Item Tracking | `item_master.is_lot_tracked`, `is_serial_tracked` |
| Stage Age Labels | `breed_master.age_labels` |
| Book Value NBV | `animal_register.book_value` |
| Monthly Amortisation | `animal_register.amortisation_monthly` |

**Genuinely absent — P2, needs a migration:**

| Table | Columns |
|---|---|
| `item_master` | `inventory_gl_account`, `cogs_gl_account`, `is_blocked` |
| `breed_master` | `is_blocked` |
| `resource_master` | `gl_cost_account`, `department`, `cost_element`, `license_expiry` |
| `animal_register` | `no_of_teats`, `tsi`, `grading`, `serial_number` |

---

## P1 — Expose what already exists · config only · ~0.5 h

Eight fields. No migration, no DTO change, no API change.

- [ ] **Step 1: Add the fields to `configs.ts`**

`breed` — section "Reproduction":
```ts
{ key: "vaccination_schedule", label: "Vaccination Schedule", type: "json", section: "Reproduction", helpText: "Protocol as JSON. Drives the mandatory ONCE vaccination events on daily entry." },
```

`stage` — section "Data Entry":
```ts
{ key: "required_kpi_to_pass", label: "Required KPI to Pass", type: "json", section: "Data Entry", helpText: 'KPI checks validated before a stage transition, e.g. [{"metric":"BODY_WEIGHT","min_value":100}]. A failure warns; a farmer may override with approval.' },
```

`animal` — new section "Bio-Asset", placed after "Acquisition":
```ts
{ key: "current_bio_asset_value", label: "Current Bio-Asset Value", type: "number", step: "0.01", section: "Bio-Asset" },
{ key: "total_amortised",        label: "Total Amortised",        type: "number", step: "0.01", section: "Bio-Asset" },
{ key: "residual_value",         label: "Residual Value",         type: "number", step: "0.01", section: "Bio-Asset" },
{ key: "expected_cull_date",     label: "Expected Cull Date",     type: "date",   section: "Bio-Asset" },
{ key: "disposal_date",          label: "Disposal Date",          type: "date",   section: "Bio-Asset" },
{ key: "disposal_type",          label: "Disposal Type",          type: "text",   section: "Bio-Asset" },
```

Also expose the six differently-named columns listed above on their masters, using the **actual column name** as the `key` and the **template's wording** as the label — e.g. `{ key: "withdrawal_days", label: "Withdrawal Period Days", ... }`. Never invent a second column for a name that already exists.

- [ ] **Step 2: Verify**

`pnpm nx run-many -t typecheck -p web` → 0 errors. `pnpm nx lint web 2>&1 | tail -5` → ≤88.
Open each touched master's dialog and confirm the new fields render in the right card and save.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/master-data/configs.ts
git commit -m "feat(masters): expose template fields that already exist in the schema

Eight fields plus six that exist under a different column name. No
migration and no DTO change - these were storable and accepted all along,
just absent from the console.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## P2 — Add the genuinely missing columns · ~3 h

Twelve columns across four tables, one migration.

- [ ] **Step 1: Add columns to `schema.ts`**

`item_master`: `inventory_gl_account` varchar(36), `cogs_gl_account` varchar(36), `is_blocked` boolean default false.
`breed_master`: `is_blocked` boolean default false.
`resource_master`: `gl_cost_account` varchar(36), `department` varchar(100), `cost_element` varchar(50), `license_expiry` date.
`animal_register`: `no_of_teats` int, `tsi` decimal(10,2), `grading` varchar(20), `serial_number` varchar(50).

Every column is nullable or defaulted — existing rows must not need a backfill.

- [ ] **Step 2: Generate and READ the migration**

`pnpm nx run api:db-generate-tenant`, then read the newest file in `apps/api/src/drizzle/tenant/`. It must contain only `ALTER TABLE ... ADD COLUMN` for the twelve columns above. Any `DROP` means the schema has drifted — stop and report rather than applying it.

- [ ] **Step 3: Add the fields to the DTOs**

Each new column needs an `@IsOptional()` entry on its Create and Update DTO, with the right validator (`@IsInt`, `@IsNumber`, `@IsBoolean`, `@IsDateString`, `@IsString`). None are required — the templates mark none of them mandatory.

- [ ] **Step 4: `no_of_teats` earns its guard test**

BBP §6 makes teat count **< 15 a hard block** on gilt selection: *"Cannot be selected regardless of TSI score."* The column alone does not enforce that. Write a failing test asserting the rule, then implement it in the animal service.

```ts
it('refuses gilt selection when teat count is below 15', async () => {
  await expect(service.selectGilt({ animal_id: 'a1', no_of_teats: 14 }))
    .rejects.toThrow(/teat/i);
});
```

If no gilt-selection entry point exists yet, put the guard where the animal is created or updated with `no_of_teats`, and say so in the commit message.

- [ ] **Step 5: Expose the twelve in `configs.ts`**, matching each template's label and section.

- [ ] **Step 6: Verify and commit**

`pnpm nx test api` (report the count), typecheck both, lint web ≤88. Commit schema+migration+DTO together, then the config exposure.

---

## P3 — Hierarchical location codes · ~2 h

**The rule, from the user (2026-09-05):** a code carries its ancestry. A farm is `FARM-001`. A shed inside it is `FARM-001/SHED-001` — so the code alone identifies "the first shed of farm 1". The pattern continues down the tree.

This replaces Codex's flat per-company counters (`SHED-001`) for locations only. Supplier, customer and resource series are unchanged.

The user's mapping of the Location template's columns: **SUB-LOC = `parent_location_id`, SUB-SUB-LOC = `location_id`.**

- [ ] **Step 1: Write the failing test**

```ts
describe('hierarchical location codes', () => {
  it('generates a root code from the type prefix', async () => {
    // no parent -> PREFIX-NNN
    expect(await gen({ typePrefix: 'FARM', parent: null })).toBe('FARM-001');
  });

  it('prefixes a child code with its parent code', async () => {
    expect(await gen({ typePrefix: 'SHED', parent: { location_code: 'FARM-001' } }))
      .toBe('FARM-001/SHED-001');
  });

  it('counts siblings within the parent, not globally', async () => {
    // second shed under FARM-002 is SHED-001 there, not SHED-003
    expect(await gen({ typePrefix: 'SHED', parent: { location_code: 'FARM-002' } }))
      .toBe('FARM-002/SHED-001');
  });

  it('nests to a third level', async () => {
    expect(await gen({ typePrefix: 'PEN', parent: { location_code: 'FARM-001/SHED-001' } }))
      .toBe('FARM-001/SHED-001/PEN-001');
  });
});
```

The sibling-counter case is the one that matters: the counter is **per parent**, not per company. Two farms each get their own `SHED-001`.

- [ ] **Step 2: Implement in `location.service.ts`**, inside the existing series row lock so concurrent creates cannot collide.

- [ ] **Step 3: Check the length ceiling.** `location_master.location_code` is `varchar` — confirm its length accommodates four nested segments (`FARM-001/SHED-001/PEN-001/SLO-001` is 33 characters). Widen it in P2's migration if it does not.

- [ ] **Step 4: Existing rows are not renamed.** Codes already issued stay as they are; the hierarchy applies to new creates. Say so in the commit message.

---

## Out of scope

- Backfilling hierarchical codes onto existing locations.
- `age_at_entry_weeks` — derivable from `dob` and `entry_date`; a computed display, not a column.
- `residual_value_amount` on breed — the schema has `residual_value_pct`. Percentage and amount are different things and the client should say which they want before either is changed.
- Everything in the Triple-C report template.
