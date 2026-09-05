# Master code series: prefix, sequence, and composite child codes

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Every master generates its code as `<prefix>-<sequence>`, where the prefix is configurable and derives from the record's type; and where a master has a parent, the child's code is `<parent code>/<prefix>-<sequence>` — the pattern Location already uses.

**Architecture:** No new mechanism. `no_series_master` already carries `prefix`, `separator`, `seq_length`, `current_seq`, `reset_frequency` and `allow_manual` per tenant/company/NOB/LOB, and `NumberSeriesService` exposes `ensureCompanySeries` / `generateNext` / `lockSeries`. Item, Supplier, Customer, Resource and Location already draw from it. This extends the same service to the remaining masters and adds type-aware series resolution.

**Tech Stack:** NestJS, Drizzle ORM, MySQL, Jest 30.

**Spec:** [2026-09-04-piggery-bbp-aligned-posting-design.md](../specs/2026-09-04-piggery-bbp-aligned-posting-design.md) — §7.1 records the external ERP reference decision.

## Global Constraints

- **Dev servers run on 2877 and 3002. Do not start or stop them. NEVER run `pkill`** — an earlier `pkill -f "nx serve api"` matched the tooling's own process and killed the session.
- API tests are **295/295**: `pnpm nx test api`. Report the count; it must not regress.
- Typecheck: `pnpm nx run-many -t typecheck -p api web`. Lint web ≤88 (currently 83).
- Read every generated migration before applying. Drizzle writes ``ADD `col` `` and `MODIFY`, not `ADD COLUMN`.
- **A full database backup was taken before this work** — `navfarm_master`, `tenant_devco`, `tenant_system` — and its path is in the session scratchpad at `LAST_BACKUP_PATH`. Restore from there if the renumber goes wrong.
- Commit trailer: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Measured starting position

**Auto-generating today:** item, supplier, customer, resource, location (per type).
**Manual today:** breed, medicine, disease, feed-formula, gl-account, cost-center, uom, item-category, item-type, stage.

**Only `location_type_master` has a `code_prefix` column.** `item_type_master`, `item_category_master` and `species_master` are type tables without one. Eight masters carry their type as an inline enum with no type table at all: `item.item_type`, `resource.resource_type`, `animal.animal_type`, `uom.uom_type`, `stage.stage_category`, `gl_account.account_type`, `breed.breed_type`, `supplier.vendor_type`.

**Masters with a self-referencing parent** — composite codes apply to all four:

| Master | Parent column | Code column |
|---|---|---|
| `location_master` | `parent_location_id` | `location_code` — **already implemented and verified** |
| `item_category_master` | `parent_category_id` | `category_code` |
| `gl_account_master` | `parent_account_id` | `account_code` |
| `cost_center_master` | `parent_cost_center_id` | `cost_center_code` |

**Codes stored by value in other tables** — these are why the renumber must cascade:

| Code | Referenced by |
|---|---|
| `uom_code` | `item.uom_primary`, `item.uom_secondary`, `location.capacity_uom`, `location.area_unit`, `shed.capacity_uom`, `batch.uom` |
| `stage_code` | `batch_header.current_stage_code`, `batch_stage_log.from_stage_code`, `batch_stage_log.to_stage_code`, `stage_master.next_stage_code`, `stage_master.alt_next_stage_code` |

---

## C1 — Type-aware series resolution · no data change

- [ ] **Step 1: `item_type_master` gains `code_prefix`**

Mirror `location_type_master`: `code_prefix` varchar(20), not null, defaulted from `type_code` for existing rows. Generate the migration and read it before applying.

- [ ] **Step 2: Resolution order in `NumberSeriesService`**

Add `resolveSeriesFor(masterKey, typeValue, tenantId, companyId, executor)` returning a series code:

1. a series for **master + type** — `ITEM_RAW_MATERIAL`, `ANIMAL_SOW`, `RESOURCE_MANPOWER`
2. else a series for the **master alone** — `ITEM`, `ANIMAL`
3. else `null`, meaning **the user types the code**

Rule 3 is what makes this "available everywhere, generated where configured". A master with no series row keeps manual entry, so `KG` and `GESTATION` stay meaningful until someone deliberately configures a series.

Where a type table exists with a `code_prefix` (`location_type_master`, and now `item_type_master`), that prefix wins over the series' own `prefix` — it is the more specific configuration.

- [ ] **Step 3: Tests first**

```ts
it('prefers the master+type series over the master series', async () => {
  await seedSeries('ITEM', { prefix: 'ITM' });
  await seedSeries('ITEM_RAW_MATERIAL', { prefix: 'RAW' });
  expect(await svc.resolveSeriesFor('ITEM', 'RAW_MATERIAL', t, c)).toBe('ITEM_RAW_MATERIAL');
});

it('falls back to the master series when no type series exists', async () => {
  await seedSeries('ITEM', { prefix: 'ITM' });
  expect(await svc.resolveSeriesFor('ITEM', 'CONSUMABLE', t, c)).toBe('ITEM');
});

it('returns null when nothing is configured, so the code stays manual', async () => {
  expect(await svc.resolveSeriesFor('UOM', 'WEIGHT', t, c)).toBeNull();
});
```

---

## C2 — Composite codes for the three remaining hierarchical masters

`location.service.ts` already implements this correctly and is **verified live**:
`FARM-001` → `FARM-001/SHED-001` → `FARM-001/SHED-001/PEN-001`, with the sequence counted **per parent** (`FARM-002/SHED-001`, not `SHED-003`).

- [ ] **Step 1: Extract the generator**

Lift the logic out of `location.service.ts` into something reusable — `generateCompositeCode({ parentCode, prefix, siblingScope, executor })` — without changing Location's behaviour. Location's existing tests must still pass unchanged; they are the specification.

Keep the properties that were verified: sequence is `MAX(parsed suffix) + 1` over siblings, **not** a count (deleting a sibling must not cause a collision); soft-deleted siblings still count, because the unique index is not partial; non-conforming sibling codes are skipped rather than crashing; generation happens inside the insert transaction under the series row lock.

- [ ] **Step 2: Apply to `item_category`, `gl_account`, `cost_center`**

A child's code is `<parent code>/<prefix>-<seq>`; a root's code is `<prefix>-<seq>`. Each needs the same duplicate-key retry and the 255-character guard `location.service.ts` already has.

- [ ] **Step 3: Check the column widths.** `location_code` was widened to varchar(255) for this. Do the same for `category_code`, `account_code` and `cost_center_code` if they are narrower — a composite code is far longer than a flat one.

---

## C3 — Wire the remaining masters

For each of breed, medicine, disease, feed-formula, gl-account, cost-center, uom, item-category, item-type, stage, animal:

- [ ] On create, call `resolveSeriesFor(master, typeValue, ...)`. If it returns a series, generate the code and make the field read-only in the console; if `null`, leave manual entry exactly as it is today.
- [ ] Never overwrite a code the user supplied when `allow_manual` is set on the series.

---

## C4 — Renumber existing records · **DESTRUCTIVE**

The user chose to renumber everything and discard old codes, with full cascade updates, having been shown the consequences.

- [ ] **Step 1: Confirm the backup exists** before running anything. Path is in `LAST_BACKUP_PATH` in the session scratchpad.

- [ ] **Step 2: Write it as a script with a dry-run first.** The script must print, per master, every code it would change and every referencing row it would rewrite — and change nothing — until passed an explicit apply flag. Review that output before applying.

- [ ] **Step 3: One transaction per tenant database.** Renumber the master, then rewrite every referencing column **in the same transaction**:

| When renumbering | Also rewrite |
|---|---|
| `uom_master.uom_code` | `item.uom_primary`, `item.uom_secondary`, `location.capacity_uom`, `location.area_unit`, `shed.capacity_uom`, `batch.uom` |
| `stage_master.stage_code` | `batch_header.current_stage_code`, `batch_stage_log.from_stage_code`, `batch_stage_log.to_stage_code`, `stage_master.next_stage_code`, `stage_master.alt_next_stage_code` |
| `location_master.location_code` | every descendant's `location_code` — the parent code is embedded in the child's |

- [ ] **Step 4: Re-derive the reference map rather than trusting this table.** Before writing the script, grep the schema for every column that stores a code by value. This list was assembled by hand and a missed column means silent corruption rather than an error.

- [ ] **Step 5: Verify after applying.** Assert zero orphans: every `item.uom_primary` resolves to a live `uom_master.uom_code`; every `batch_header.current_stage_code` resolves to a live `stage_master.stage_code`; every child `location_code` starts with its parent's current code.

## Known consequences, accepted

- Codes on physical ear tags, printed batch sheets and the spreadsheets in `Report Format & Tracker/` will no longer match the system.
- BBP §1.2 makes Farm Code the D365BC Cost Centre Dimension (`GRS`, `PRT`, `MUL`). After renumbering, those values exist nowhere, so the mapping must be rebuilt when BC is connected. §7.1's external ERP reference field is where they would go — it is **not** being populated, because the user chose to discard old codes.
