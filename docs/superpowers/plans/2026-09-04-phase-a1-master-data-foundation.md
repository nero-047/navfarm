# Phase A1: Master Data Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring NAVFarm's master data layer into agreement with the client's signed-off blueprint — correct stage durations, a shared reason master, animal categories, NOB/LOB on the company — and fix the scoping defects found while designing it.

**Architecture:** Data-layer only. Seed constants live in `apps/api/src/core/database/`, are asserted by cross-boundary guard tests that read both sides and fail on drift, and are consumed by existing services. No console work (Phase A2) and no currency work (Phase A3). Every task ends with the application still running.

**Tech Stack:** NestJS, Drizzle ORM, MySQL, Jest 30 (via @swc/jest), Nx.

**Spec:** [docs/superpowers/specs/2026-09-04-piggery-bbp-aligned-posting-design.md](../specs/2026-09-04-piggery-bbp-aligned-posting-design.md)

## Global Constraints

- **Scope is `LVS_PIGGERY` only.** No other LOB gets stages, items, breeds or parameters seeded.
- **BBP durations are authoritative** where they conflict with the code. Gestation is **116 days**, not 110 or 114. Gilt rearing is **~210 days**, not 77.
- **Tenant-tier masters are shared by reference**, never cloned. `company_id IS NULL` means "visible to every company in this tenant".
- **D365 Business Central and Pig Vision integrations are out of scope.** Columns that exist to carry their references stay unused.
- **Test commands:** all tests `pnpm nx test api`; one file `pnpm nx test api -- <path-regex>`; typecheck `pnpm nx run-many -t typecheck -p api web`.
- **Web lint baseline is 88 errors.** Gate on "no new" — never fix `exhaustive-deps` as drive-by work.
- **Commit after every task.** Never batch tasks into one commit.

## Data dependency — read before starting Task 1

BBP §1.3 specifies **47 reason codes** by category count — MORTALITY 21, CULL 10, RETURN 3, SELECTION 4, DISPOSAL 6, TRANSFER 3 — but the document does not enumerate them. Only three are named anywhere in the BBP: `DOA` and `RATION_PIG` (mortality), and `CULLED_PROC` (cull, at Week 25 gilt processing).

**The actual 47 codes must come from Triple C.** Task 1 builds the structure, the category counts and the guard test; the code list itself is client data. Do not invent it. If the list has not arrived when Task 1 starts, seed the three named codes, leave the count assertion at the BBP's totals, and let the test fail until the list is entered — a failing test that names a missing client input is the correct state.

---

### Task 1: Reason code seed constants and their guard test

**Files:**
- Create: `apps/api/src/core/database/reason-code-seed.ts`
- Create: `apps/api/src/core/database/reason-code-seed.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `REASON_CATEGORIES` (readonly string tuple), `ReasonCategory` (union type), `ReasonCodeSeedRow` (`{ reason_code: string; reason_name: string; category: ReasonCategory; applicable_stages: string[] | null; is_system: boolean }`), `SYSTEM_REASON_CODE_SEED` (readonly `ReasonCodeSeedRow[]`), `BBP_REASON_CATEGORY_COUNTS` (`Record<ReasonCategory, number>`).

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/core/database/reason-code-seed.spec.ts
import {
  REASON_CATEGORIES,
  BBP_REASON_CATEGORY_COUNTS,
  SYSTEM_REASON_CODE_SEED,
} from './reason-code-seed';

/**
 * BBP §1.3: "The Reason Master is a SINGLE shared master across all 10 Triple C
 * farms. The same reason code carries the same meaning on every farm."
 *
 * The category totals below are the client's, not ours. This test is the
 * contract that says the seed still matches the blueprint.
 */
describe('reason code seed', () => {
  it('carries the six BBP categories and nothing else', () => {
    expect([...REASON_CATEGORIES]).toEqual([
      'MORTALITY', 'CULL', 'RETURN', 'SELECTION', 'DISPOSAL', 'TRANSFER',
    ]);
  });

  it('matches the BBP category counts, totalling 47', () => {
    expect(BBP_REASON_CATEGORY_COUNTS).toEqual({
      MORTALITY: 21, CULL: 10, RETURN: 3, SELECTION: 4, DISPOSAL: 6, TRANSFER: 3,
    });
    const total = Object.values(BBP_REASON_CATEGORY_COUNTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(47);
  });

  it('seeds exactly the number of codes each category declares', () => {
    for (const category of REASON_CATEGORIES) {
      const seeded = SYSTEM_REASON_CODE_SEED.filter((r) => r.category === category);
      expect({ category, count: seeded.length })
        .toEqual({ category, count: BBP_REASON_CATEGORY_COUNTS[category] });
    }
  });

  it('has no duplicate codes', () => {
    const codes = SYSTEM_REASON_CODE_SEED.map((r) => r.reason_code);
    expect(codes.length).toBe(new Set(codes).size);
  });

  it('seeds the three codes the BBP names explicitly', () => {
    const codes = SYSTEM_REASON_CODE_SEED.map((r) => r.reason_code);
    expect(codes).toEqual(expect.arrayContaining(['DOA', 'RATION_PIG', 'CULLED_PROC']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api -- reason-code-seed`
Expected: FAIL — `Cannot find module './reason-code-seed'`

- [ ] **Step 3: Write the seed constants**

```ts
// apps/api/src/core/database/reason-code-seed.ts

/**
 * BBP §1.3 — Reason Master, shared across every farm, extensible by System
 * Admin only. The category counts are the client's; see the data dependency
 * note in the Phase A1 plan before adding codes.
 */
export const REASON_CATEGORIES = [
  'MORTALITY', 'CULL', 'RETURN', 'SELECTION', 'DISPOSAL', 'TRANSFER',
] as const;

export type ReasonCategory = (typeof REASON_CATEGORIES)[number];

export interface ReasonCodeSeedRow {
  reason_code: string;
  reason_name: string;
  category: ReasonCategory;
  /** Stage codes this reason may be selected in; null means every stage. */
  applicable_stages: string[] | null;
  is_system: boolean;
}

/** BBP §1.3 totals. The seed must match these exactly. */
export const BBP_REASON_CATEGORY_COUNTS: Record<ReasonCategory, number> = {
  MORTALITY: 21, CULL: 10, RETURN: 3, SELECTION: 4, DISPOSAL: 6, TRANSFER: 3,
};

export const SYSTEM_REASON_CODE_SEED: readonly ReasonCodeSeedRow[] = [
  { reason_code: 'DOA', reason_name: 'Dead on Arrival', category: 'MORTALITY', applicable_stages: null, is_system: true },
  { reason_code: 'RATION_PIG', reason_name: 'Ration Pig', category: 'MORTALITY', applicable_stages: null, is_system: true },
  { reason_code: 'CULLED_PROC', reason_name: 'Culled at Processing', category: 'CULL', applicable_stages: ['GILT_REARING'], is_system: true },
  // Remaining codes supplied by Triple C — see the plan's data dependency note.
];
```

- [ ] **Step 4: Run test to confirm the expected failure**

Run: `pnpm nx test api -- reason-code-seed`
Expected: the first, second, fourth and fifth tests PASS; the third FAILS with `{ category: 'MORTALITY', count: 2 }` versus `{ category: 'MORTALITY', count: 21 }`.

This is the correct state until the client list arrives. The failure names exactly what is missing. Do not weaken the assertion to make it green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/core/database/reason-code-seed.ts apps/api/src/core/database/reason-code-seed.spec.ts
git commit -m "feat(masters): reason code seed structure and BBP category contract

BBP §1.3 specifies 47 codes across six categories but does not enumerate
them. The structure, counts and guard test land now; the code list is a
client input. The count test fails until Triple C supply it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: `reason_code_master` table and migration

**Files:**
- Modify: `apps/api/src/core/database/schema.ts`
- Create: `apps/api/src/core/database/reason-code-schema.spec.ts`
- Generated: `apps/api/src/drizzle/tenant/00NN_*.sql` (via drizzle-kit)

**Interfaces:**
- Consumes: `ReasonCategory` from Task 1.
- Produces: `reasonCodeMaster` Drizzle table with columns `reason_id, tenant_id, reason_code, reason_name, category, applicable_stages, is_system, is_active, status, created_by, updated_by, created_at, updated_at, deleted_at`, and a unique index `uq_reason_code_tenant_code` on `(tenant_id, reason_code)`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/core/database/reason-code-schema.spec.ts
import { getTableConfig } from 'drizzle-orm/mysql-core';
import { reasonCodeMaster } from './schema';

/**
 * Reason codes are TENANT-scoped by design: BBP §1.3 requires one shared
 * master across every farm. A company_id column would let two companies
 * hold different meanings for the same code, which is the thing the
 * blueprint forbids. This test is what stops one being added later.
 */
describe('reason_code_master schema', () => {
  const config = getTableConfig(reasonCodeMaster);
  const columnNames = config.columns.map((c) => c.name);

  it('is tenant scoped', () => {
    expect(columnNames).toContain('tenant_id');
  });

  it('has no company_id — the master is shared, not per-company', () => {
    expect(columnNames).not.toContain('company_id');
  });

  it('carries category and stage applicability', () => {
    expect(columnNames).toEqual(expect.arrayContaining([
      'reason_code', 'reason_name', 'category', 'applicable_stages', 'is_system',
    ]));
  });

  it('makes the reason code unique within a tenant', () => {
    const uniques = config.uniqueConstraints.map((u) => u.name);
    expect(uniques).toContain('uq_reason_code_tenant_code');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api -- reason-code-schema`
Expected: FAIL — `reasonCodeMaster` is not exported from `./schema`.

- [ ] **Step 3: Add the table to the schema**

Add to `apps/api/src/core/database/schema.ts`, next to the other master tables:

```ts
export const reasonCodeMaster = mysqlTable('reason_code_master', {
  reason_id: varchar('reason_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  // Tenant scoped and deliberately not company scoped — BBP §1.3 requires a
  // single shared master so a code means the same thing on every farm.
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  reason_code: varchar('reason_code', { length: 50 }).notNull(),
  reason_name: varchar('reason_name', { length: 200 }).notNull(),
  // MORTALITY | CULL | RETURN | SELECTION | DISPOSAL | TRANSFER
  category: varchar('category', { length: 20 }).notNull(),
  // Stage codes this reason may be selected in. NULL means every stage.
  applicable_stages: json('applicable_stages').$type<string[] | null>(),
  // System codes are seeded and may not be deleted by a tenant admin.
  is_system: boolean('is_system').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  uqReasonCodeTenantCode: unique('uq_reason_code_tenant_code').on(table.tenant_id, table.reason_code),
}));
```

If `json`, `boolean` or `unique` are not already imported at the top of `schema.ts`, add them to the existing `drizzle-orm/mysql-core` import.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test api -- reason-code-schema`
Expected: PASS, 4 tests.

- [ ] **Step 5: Generate and inspect the migration**

Run: `pnpm nx run api:db-generate-tenant`
Then read the newest file in `apps/api/src/drizzle/tenant/`. It must contain exactly one `CREATE TABLE reason_code_master` and one unique index. If it contains drops or alters of unrelated tables, the schema has drifted — stop and report rather than applying it.

- [ ] **Step 6: Run the full API suite**

Run: `pnpm nx test api`
Expected: all pass except the known `reason-code-seed` count failure from Task 1.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/core/database/schema.ts apps/api/src/core/database/reason-code-schema.spec.ts apps/api/src/drizzle/tenant/
git commit -m "feat(masters): add reason_code_master, tenant scoped

Guard test asserts the absence of company_id: BBP §1.3 requires one
shared master so a reason code means the same thing on every farm.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Stage master reseed to BBP durations

**Files:**
- Modify: `apps/api/src/core/database/system-master-data-seed.ts:301-311`
- Create: `apps/api/src/core/database/stage-durations.spec.ts`

**Interfaces:**
- Consumes: the existing `SYSTEM_STAGE_SEED` array shape — `{ stage_code, stage_name, stage_category, stage_sequence, typical_duration_days?, min_days_before_move, transition_trigger, auto_move_on_day?, next_stage_code?, alt_next_stage_code?, alt_trigger_condition?, data_entry_form, show_on_animal_card, stage_description }`.
- Produces: two new stage codes, `DRY_PERIOD` and `INSEMINATION`; renamed `GILT_GROWER` → `GILT_REARING`; renamed `DRY_SOW_GESTATION` → `GESTATION`; `FLUSH_SERVICE` → `FLUSH`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/core/database/stage-durations.spec.ts
import { SYSTEM_STAGE_SEED } from './system-master-data-seed';

/**
 * BBP §1.7 specifies eight breeding stages with durations. Where the code
 * disagreed, the BBP won — it is what the customer signed.
 *
 * Gestation is the one that matters most: 116 days drives the breeding
 * calendar and the demo farm's genealogy. The codebase previously used 110
 * and navfarm-piggery-status.md used 114. Neither was right.
 *
 * Gilt rearing at ~210 days is corroborated by BBP §6, which tracks
 * selection at Week 4 through first service at Weeks 31-33.
 */
describe('BBP stage durations', () => {
  const byCode = new Map(SYSTEM_STAGE_SEED.map((s) => [s.stage_code, s]));

  const expected: Array<[string, number]> = [
    ['QUARANTINE', 28],
    ['GILT_REARING', 210],
    ['DRY_PERIOD', 7],
    ['FLUSH', 5],
    ['INSEMINATION', 2],
    ['GESTATION', 116],
    ['FARROWING', 3],
    ['LACTATION', 28],
  ];

  it.each(expected)('%s has the BBP duration of %i days', (code, days) => {
    expect({ code, days: byCode.get(code)?.typical_duration_days }).toEqual({ code, days });
  });

  it('no longer carries the pre-BBP stage codes', () => {
    for (const gone of ['GILT_GROWER', 'FLUSH_SERVICE', 'DRY_SOW_GESTATION']) {
      expect({ gone, present: byCode.has(gone) }).toEqual({ gone, present: false });
    }
  });

  it('keeps the weaner-grower path, which the BBP handles as WG batches', () => {
    for (const kept of ['WEANING', 'BOAR_AI', 'CB_GROWER', 'SLAUGHTER', 'DISPOSED']) {
      expect({ kept, present: byCode.has(kept) }).toEqual({ kept, present: true });
    }
  });

  it('has a contiguous sequence with no duplicates', () => {
    const seq = SYSTEM_STAGE_SEED.map((s) => s.stage_sequence).sort((a, b) => a - b);
    expect(seq).toEqual(Array.from({ length: seq.length }, (_, i) => i + 1));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api -- stage-durations`
Expected: FAIL on `GILT_REARING` (undefined — still `GILT_GROWER`), `DRY_PERIOD`, `INSEMINATION`, `GESTATION`, and on the pre-BBP-codes assertion.

- [ ] **Step 3: Rewrite the breeding stages in the seed**

Replace the first eight entries of `SYSTEM_STAGE_SEED` in `system-master-data-seed.ts`. Renumber `stage_sequence` for the whole array afterwards so it stays contiguous — the WG stages shift from 7–11 to 9–13.

```ts
{ stage_code: 'QUARANTINE', stage_name: 'Quarantine', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 1, typical_duration_days: 28, min_days_before_move: 14, transition_trigger: 'AUTO_BY_DAY', auto_move_on_day: 28, next_stage_code: 'GILT_REARING', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'Weeks 1-4. Isolation and health monitoring before entering production.' },
{ stage_code: 'GILT_REARING', stage_name: 'Gilt Rearing', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 2, typical_duration_days: 210, min_days_before_move: 168, transition_trigger: 'MANUAL', next_stage_code: 'FLUSH', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'Weeks 4-34. Selection at Week 4, processing at Week 25, service decision at Week 28.' },
{ stage_code: 'DRY_PERIOD', stage_name: 'Dry Period', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 3, typical_duration_days: 7, min_days_before_move: 4, transition_trigger: 'MANUAL', next_stage_code: 'FLUSH', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'Weaning to service interval, 4-7 days.' },
{ stage_code: 'FLUSH', stage_name: 'Flush', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 4, typical_duration_days: 5, min_days_before_move: 3, transition_trigger: 'MANUAL', next_stage_code: 'INSEMINATION', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'Flush feeding to stimulate ovulation, 3-5 days.' },
{ stage_code: 'INSEMINATION', stage_name: 'Insemination', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 5, typical_duration_days: 2, min_days_before_move: 1, transition_trigger: 'EVENT_BASED', next_stage_code: 'GESTATION', alt_next_stage_code: 'DRY_PERIOD', alt_trigger_condition: 'CONCEPTION_FAILED', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'Mating or AI event. Conception confirmed at the Day 28 scan.' },
{ stage_code: 'GESTATION', stage_name: 'Gestation', stage_category: 'PRODUCTIVE', stage_sequence: 6, typical_duration_days: 116, min_days_before_move: 100, transition_trigger: 'EVENT_BASED', next_stage_code: 'FARROWING', alt_next_stage_code: 'FLUSH', alt_trigger_condition: 'PREGNANCY_FAILED', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'Confirmed pregnancy to term, 116 days per BBP §1.7.' },
{ stage_code: 'FARROWING', stage_name: 'Farrowing', stage_category: 'OUTPUT', stage_sequence: 7, typical_duration_days: 3, min_days_before_move: 1, transition_trigger: 'EVENT_BASED', next_stage_code: 'LACTATION', data_entry_form: 'FARROWING', show_on_animal_card: true, stage_description: 'Birth of the litter. Total Born must equal BA + BD + GA.' },
{ stage_code: 'LACTATION', stage_name: 'Lactation', stage_category: 'PRODUCTIVE', stage_sequence: 8, typical_duration_days: 28, min_days_before_move: 21, transition_trigger: 'AUTO_BY_DAY', auto_move_on_day: 28, next_stage_code: 'WEANING', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'Nursing period following farrowing.' },
```

Then update `WEANING`'s `next_stage_code` from `FLUSH_SERVICE` to `DRY_PERIOD`, and `BOAR_AI`'s sequence and neighbours to keep the array contiguous.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test api -- stage-durations`
Expected: PASS, all cases.

- [ ] **Step 5: Find every remaining reference to the old codes**

Run: `grep -rn "GILT_GROWER\|FLUSH_SERVICE\|DRY_SOW_GESTATION" apps/api/src apps/web/src --include="*.ts" --include="*.tsx" | grep -v drizzle`

Every hit must be updated. Expect hits in `provision-greenfield-tenant.ts`, `seed-piggery-complete-data.ts`, `seed-dev-tenant.ts`, `seed-demo-gaps.ts`, `animal.service.ts`, and the batch and scheduler specs. Migrations under `apps/api/src/drizzle/` are history — do not edit them.

- [ ] **Step 6: Run the full suite and typecheck**

Run: `pnpm nx test api` then `pnpm nx run-many -t typecheck -p api web`
Expected: all pass except the known `reason-code-seed` count failure.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(masters): reseed piggery stages to BBP durations

Gestation 110 -> 116d, gilt rearing 77 -> 210d, and the flush/service and
dry/gestation stages split into the four the BBP specifies. Corroborated
by BBP §6, which runs gilt selection at Week 4 to first service at Weeks
31-33.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Breed lifecycle realignment and its coverage guard

**Files:**
- Modify: `apps/api/src/core/database/system-master-data-seed.ts:383-391`
- Create: `apps/api/src/core/database/stage-lifecycle-coverage.spec.ts`

**Interfaces:**
- Consumes: `SYSTEM_STAGE_SEED` (Task 3), and the existing `SYSTEM_BREED_LIFECYCLE_SEED` rows keyed by `stage_code`.
- Produces: lifecycle rows for `GILT_REARING`, `DRY_PERIOD`, `FLUSH`, `INSEMINATION`, `GESTATION`, replacing those for the three removed stage codes.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/core/database/stage-lifecycle-coverage.spec.ts
import { SYSTEM_STAGE_SEED, SYSTEM_BREED_LIFECYCLE_SEED } from './system-master-data-seed';

/**
 * Two components that must agree: stage_master defines the lifecycle, and
 * breed_lifecycle_stages carries the feed rate and KPI thresholds for each
 * stage. A stage with no lifecycle row produces a batch whose scheduler has
 * nothing to schedule; a lifecycle row for a stage that no longer exists is
 * dead data that silently never applies.
 *
 * This is the cross-boundary pattern that caught the roles/permissions and
 * sidebar drift: read both sides, fail on divergence.
 */
describe('stage and breed-lifecycle coverage', () => {
  const stageCodes = new Set(SYSTEM_STAGE_SEED.map((s) => s.stage_code));
  const lifecycleCodes = new Set(SYSTEM_BREED_LIFECYCLE_SEED.map((l) => l.stage_code));

  it('has no lifecycle row for a stage that does not exist', () => {
    const orphans = [...lifecycleCodes].filter((c) => !stageCodes.has(c));
    expect({ orphans }).toEqual({ orphans: [] });
  });

  it('covers every productive and pre-productive stage', () => {
    const needsLifecycle = SYSTEM_STAGE_SEED
      .filter((s) => s.stage_category === 'PRE_PRODUCTIVE' || s.stage_category === 'PRODUCTIVE')
      .map((s) => s.stage_code);
    const uncovered = needsLifecycle.filter((c) => !lifecycleCodes.has(c));
    expect({ uncovered }).toEqual({ uncovered: [] });
  });

  it('keeps every lifecycle period within its stage duration', () => {
    const durations = new Map(SYSTEM_STAGE_SEED.map((s) => [s.stage_code, s.typical_duration_days]));
    const overruns = SYSTEM_BREED_LIFECYCLE_SEED
      .filter((l) => l.calc_unit === 'DAY')
      .filter((l) => {
        const d = durations.get(l.stage_code);
        return d != null && l.period_to > d;
      })
      .map((l) => ({ stage: l.stage_code, periodTo: l.period_to, duration: durations.get(l.stage_code) }));
    expect({ overruns }).toEqual({ overruns: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api -- stage-lifecycle-coverage`
Expected: FAIL — `orphans` contains `GILT_GROWER`, `FLUSH_SERVICE`, `DRY_SOW_GESTATION`; `uncovered` contains the five new codes.

- [ ] **Step 3: Rewrite the lifecycle rows**

Replace the affected entries in `SYSTEM_BREED_LIFECYCLE_SEED`. Feed rates and KPI bands carry over from the stages they replace; periods change to match the new durations.

```ts
{ breed_code, stage_code: 'GILT_REARING',  calc_unit: 'DAY' as const, period_from: 1, period_to: 210, feed_item_code: 'LVS-PIG-FEED', feed_qty_per_head_per_day_kg: 2.2, feed_wastage_pct: 5.00, std_body_weight_kg: 125.0, std_adg_gpd: 800, std_fcr: 2.75, std_mortality_rate_pct: 0.5, kpi_lower_limit: 700, kpi_upper_limit: 950, alert_severity: 'WARNING' as const, notes: 'Weeks 4-34. Checkpoint weights at weeks 10/15/16/19/21/23/25/28. Service weight target 157-187 kg.' },
{ breed_code, stage_code: 'DRY_PERIOD',    calc_unit: 'DAY' as const, period_from: 1, period_to: 7,   feed_item_code: 'LVS-PIG-FEED', feed_qty_per_head_per_day_kg: 2.5, feed_wastage_pct: 3.00, std_body_weight_kg: 160.0, std_mortality_rate_pct: 0.1, alert_severity: 'INFO' as const, notes: 'Weaning to service interval. Target <= 5 days.' },
{ breed_code, stage_code: 'FLUSH',         calc_unit: 'DAY' as const, period_from: 1, period_to: 5,   feed_item_code: 'LVS-PIG-FEED', feed_qty_per_head_per_day_kg: 3.0, feed_wastage_pct: 5.00, std_body_weight_kg: 128.0, std_mortality_rate_pct: 0.1, alert_severity: 'INFO' as const, notes: 'Increase feed 2-3 kg/day to stimulate ovulation.' },
{ breed_code, stage_code: 'INSEMINATION',  calc_unit: 'DAY' as const, period_from: 1, period_to: 2,   feed_item_code: 'LVS-PIG-FEED', feed_qty_per_head_per_day_kg: 2.5, feed_wastage_pct: 3.00, std_body_weight_kg: 128.0, std_mortality_rate_pct: 0.1, alert_severity: 'INFO' as const, notes: 'Record AI or mating date. Conception confirmed at the Day 28 scan.' },
{ breed_code, stage_code: 'GESTATION',     calc_unit: 'DAY' as const, period_from: 1, period_to: 116, feed_item_code: 'LVS-PIG-FEED', feed_qty_per_head_per_day_kg: 2.5, feed_wastage_pct: 3.00, std_body_weight_kg: 165.0, std_adg_gpd: 300, std_mortality_rate_pct: 0.3, kpi_lower_limit: 200, kpi_upper_limit: 450, alert_severity: 'WARNING' as const, notes: 'Maintain BCS 3.0-3.5. Increase to 3.0 kg/day from Day 90. Move to farrowing crate Day 112.' },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test api -- stage-lifecycle-coverage`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/core/database/
git commit -m "feat(masters): realign breed lifecycle to the BBP stage set

Adds a coverage guard test: no orphan lifecycle rows, no uncovered
productive stage, no lifecycle period longer than its stage.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Animal category master

**Files:**
- Modify: `apps/api/src/core/database/schema.ts`
- Create: `apps/api/src/core/database/animal-category-seed.ts`
- Create: `apps/api/src/core/database/animal-category-seed.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `animalCategoryMaster` table (`category_id, tenant_id, category_code, category_name, genetic_tier, origin, sex, costing_treatment, is_active, ...`), and `SYSTEM_ANIMAL_CATEGORY_SEED` — ten rows.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/core/database/animal-category-seed.spec.ts
import { SYSTEM_ANIMAL_CATEGORY_SEED } from './animal-category-seed';

/**
 * BBP §1.7: ten animal categories. Origin drives the accounting treatment —
 * imported animals amortise, local animals are held at fair value. Getting
 * this wrong misstates the IAS 41 position, so it is asserted rather than
 * assumed.
 */
describe('animal category seed', () => {
  it('seeds exactly ten categories', () => {
    expect(SYSTEM_ANIMAL_CATEGORY_SEED).toHaveLength(10);
  });

  it('gives every imported category the amortisation treatment', () => {
    const wrong = SYSTEM_ANIMAL_CATEGORY_SEED
      .filter((c) => c.origin === 'IMPORTED' && c.costing_treatment !== 'AMORTIZATION')
      .map((c) => c.category_code);
    expect({ wrong }).toEqual({ wrong: [] });
  });

  it('gives every local category the fair value treatment', () => {
    const wrong = SYSTEM_ANIMAL_CATEGORY_SEED
      .filter((c) => c.origin === 'LOCAL' && c.costing_treatment !== 'FAIR_VALUE')
      .map((c) => c.category_code);
    expect({ wrong }).toEqual({ wrong: [] });
  });

  it('covers the BBP code list exactly', () => {
    expect(SYSTEM_ANIMAL_CATEGORY_SEED.map((c) => c.category_code).sort()).toEqual([
      'GGP-Imp-F', 'GGP-Imp-M', 'GP-Imp-F', 'GP-Imp-M', 'GP-Loc-F', 'GP-Loc-M',
      'P-Imp-F', 'P-Imp-M', 'P-Loc-F', 'P-Loc-M',
    ].sort());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api -- animal-category-seed`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the seed**

```ts
// apps/api/src/core/database/animal-category-seed.ts

/** BBP §1.7 — ten animal categories. Origin drives the FA treatment. */
export type GeneticTier = 'GGP' | 'GP' | 'P';
export type AnimalOrigin = 'IMPORTED' | 'LOCAL';
export type AnimalSex = 'F' | 'M';
export type CostingTreatment = 'AMORTIZATION' | 'FAIR_VALUE';

export interface AnimalCategorySeedRow {
  category_code: string;
  category_name: string;
  genetic_tier: GeneticTier;
  origin: AnimalOrigin;
  sex: AnimalSex;
  costing_treatment: CostingTreatment;
}

const row = (
  genetic_tier: GeneticTier, origin: AnimalOrigin, sex: AnimalSex,
): AnimalCategorySeedRow => {
  const code = `${genetic_tier}-${origin === 'IMPORTED' ? 'Imp' : 'Loc'}-${sex}`;
  return {
    category_code: code,
    category_name: `${genetic_tier} ${origin === 'IMPORTED' ? 'Imported' : 'Local'} ${sex === 'F' ? 'Female' : 'Male'}`,
    genetic_tier, origin, sex,
    // Imported stock amortises; local stock is carried at fair value.
    costing_treatment: origin === 'IMPORTED' ? 'AMORTIZATION' : 'FAIR_VALUE',
  };
};

export const SYSTEM_ANIMAL_CATEGORY_SEED: readonly AnimalCategorySeedRow[] = [
  row('GGP', 'IMPORTED', 'F'), row('GGP', 'IMPORTED', 'M'),
  row('GP', 'IMPORTED', 'F'),  row('GP', 'IMPORTED', 'M'),
  row('P', 'IMPORTED', 'F'),   row('P', 'IMPORTED', 'M'),
  row('GP', 'LOCAL', 'F'),     row('GP', 'LOCAL', 'M'),
  row('P', 'LOCAL', 'F'),      row('P', 'LOCAL', 'M'),
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test api -- animal-category-seed`
Expected: PASS, 4 tests.

- [ ] **Step 5: Add the table, generate the migration**

Add `animalCategoryMaster` to `schema.ts` mirroring `reasonCodeMaster`'s tenant-scoped shape, with `category_code`, `category_name`, `genetic_tier`, `origin`, `sex`, `costing_treatment`, and a unique index `uq_animal_category_tenant_code` on `(tenant_id, category_code)`.

Run: `pnpm nx run api:db-generate-tenant` and inspect the newest migration as in Task 2 Step 5.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/core/database/ apps/api/src/drizzle/tenant/
git commit -m "feat(masters): add animal category master, 10 BBP categories

Imported categories amortise, local categories hold at fair value, per
BBP §1.7. Asserted rather than assumed - the treatment feeds IAS 41.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Share tenant masters by reference; stop cloning

**Files:**
- Modify: `apps/api/src/modules/core/operational-area/operational-area.service.ts:186-340`
- Modify: `apps/api/src/modules/core/operational-area/operational-area.controller.ts` (remove the preseed route)
- Modify: `apps/api/src/core/database/schema.ts` (unique constraint on `item_master`)
- Create: `apps/api/src/modules/core/operational-area/master-data-sharing.spec.ts`

**Interfaces:**
- Consumes: `itemMaster`, `breedMaster`, `farmMaster`, `shedMaster` from `schema.ts`.
- Produces: removal of `preseedCompanyMasterDataFromTenant` and `preseedOperationalAreaMasterData`; a new unique constraint `uq_item_master_tenant_company_code` on `(tenant_id, company_id, item_code)`.

**Why:** `preseed` clones tenant rows (`company_id IS NULL`) into company scope keyed by `item_code`. `item.service.ts` `findAll` then matches `or(company_id = X, company_id IS NULL)` with no dedup, and `item_master` has **no unique constraint at all**. The template and its clone both return — the same item appears twice in the list and twice in every picker. Deleting the clone fixes the duplication and gives BBP §1.3 the shared semantics it requires.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/modules/core/operational-area/master-data-sharing.spec.ts
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tenant masters are shared by reference, not copied. The clone that used to
 * run at company and area provisioning produced a duplicate of every
 * tenant-wide row, which then appeared twice in every list because the
 * resolution query returns both the template (company_id IS NULL) and its
 * clone.
 *
 * This test reads the service source directly. It is deliberately blunt: the
 * cheapest way to stop a clone being reintroduced is to assert it is absent.
 */
describe('tenant master data is shared, not cloned', () => {
  const source = readFileSync(
    join(__dirname, 'operational-area.service.ts'), 'utf-8',
  );

  it('has no preseed clone methods', () => {
    expect(source).not.toContain('preseedCompanyMasterDataFromTenant');
    expect(source).not.toContain('preseedOperationalAreaMasterData');
  });

  it('does not insert into the masters that used to be cloned', () => {
    for (const table of ['itemMaster', 'breedMaster', 'farmMaster', 'shedMaster']) {
      expect({ table, inserts: source.includes(`insert(schema.${table})`) })
        .toEqual({ table, inserts: false });
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api -- master-data-sharing`
Expected: FAIL — both methods present, inserts present.

- [ ] **Step 3: Delete the clone logic**

Remove `preseedCompanyMasterDataFromTenant` and `preseedOperationalAreaMasterData` from the service, every call site, and the `@Post('preseed-company/:companyId')` route from the controller. Keep the `preseed_source` column on `operational_area_master` — it is existing data and dropping a column is a separate, riskier change.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test api -- master-data-sharing`
Expected: PASS, 2 tests.

- [ ] **Step 5: Add the missing unique constraint**

In `schema.ts`, add to `itemMaster`:

```ts
}, (table) => ({
  uqItemMasterTenantCompanyCode: unique('uq_item_master_tenant_company_code')
    .on(table.tenant_id, table.company_id, table.item_code),
}));
```

Run: `pnpm nx run api:db-generate-tenant`

**Read the generated migration before applying it.** If existing data already contains duplicates the constraint will fail to apply. In that case the migration needs a preceding `DELETE` that keeps the row with the lower `created_at` per `(tenant_id, company_id, item_code)` — write it, and say so in the commit message.

- [ ] **Step 6: Remove the preseed button from the console**

In `apps/web/src/components/console/master-data/master-data-page-shell.tsx`, delete `handlePreseedCompany`, `preseedLoading`, `preseedMsg`, and the button that calls them. Remove the now-unused `mdPreseedSuccess` and `mdPreseedFailed` translation keys from all eight languages in `apps/web/src/utils/translations.ts`.

- [ ] **Step 7: Run everything**

Run: `pnpm nx test api` then `pnpm nx run-many -t typecheck -p api web`
Expected: pass, except the known `reason-code-seed` count failure.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "fix(masters): share tenant masters by reference instead of cloning

preseed cloned tenant rows (company_id IS NULL) into company scope keyed
by item_code, while findAll matches or(company_id = X, company_id IS NULL)
with no dedup and item_master had no unique constraint at all. Both rows
returned: every tenant-wide item appeared twice in the list and twice in
every picker.

Deleting the clone fixes the duplication and gives BBP §1.3 the shared
semantics it requires - one reason code meaning the same thing on every
farm is not expressible with per-company copies.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Company scope derived from the validated header

**Files:**
- Modify: `apps/api/src/common/guards/roles.guard.ts`
- Modify: every master service `findAll` that reads `query.companyId`
- Create: `apps/api/src/common/guards/company-scope.spec.ts`

**Interfaces:**
- Consumes: `request.headers['x-active-company-id']`, already validated by `enforceScope`.
- Produces: `request.activeCompanyId` — set by the guard after validation; services read it instead of `query.companyId`.

**Why:** `roles.guard.ts` validates the `x-active-company-id` **header** against `user_company_assignments`. Master services filter on the `companyId` **query parameter**, which nothing validates. A Company-A user sending a valid header plus `?companyId=<B>` reads Company B's masters — both are in the same tenant database, so the tenant filter passes.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/common/guards/company-scope.spec.ts
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * The guard validates the x-active-company-id header against the user's
 * assignments. Services must read the value the guard validated, not a query
 * parameter the client can set freely.
 *
 * Cross-boundary guard: reads both sides and fails when they diverge.
 */
describe('company scope is never read from the query string', () => {
  const modulesRoot = join(__dirname, '..', '..', 'modules');

  const serviceFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return serviceFiles(full);
      return full.endsWith('.service.ts') ? [full] : [];
    });

  it('has no service reading query.companyId', () => {
    const offenders = serviceFiles(modulesRoot)
      .filter((f) => readFileSync(f, 'utf-8').includes('query.companyId'))
      .map((f) => f.replace(modulesRoot, 'modules'));
    expect({ offenders }).toEqual({ offenders: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api -- company-scope`
Expected: FAIL — `offenders` lists the master services (item, breed, uom, stage, supplier and the rest).

- [ ] **Step 3: Have the guard publish the validated value**

At the end of `enforceScope` in `roles.guard.ts`, after the assignment check passes:

```ts
// Downstream handlers must use this, not a client-supplied query parameter.
// The header has been checked against user_company_assignments above.
request.activeCompanyId = activeCompanyId ?? user.companyId ?? null;
```

- [ ] **Step 4: Change every service to take the scope as an argument**

For each offending service, replace the `query.companyId` read with a `companyId` parameter passed by the controller from `req.activeCompanyId`. For example in `item.service.ts`:

```ts
async findAll(query: QueryItemDto, tenantId: string, companyId: string | null) {
  const conditions: any[] = [eq(schema.itemMaster.tenant_id, tenantId)];

  if (companyId) {
    conditions.push(
      or(
        eq(schema.itemMaster.company_id, companyId),
        isNull(schema.itemMaster.company_id), // tenant-wide rows, shared by reference
      ),
    );
  }
  // ... remaining filters unchanged
}
```

and in `item.controller.ts`:

```ts
async findAll(@Query() query: QueryItemDto, @Req() req: any) {
  return this.itemService.findAll(query, req.user.tenantId, req.activeCompanyId);
}
```

Keep `companyId` on the query DTOs — the console still sends it and `forbidNonWhitelisted` would 400 the request if it were removed. It is simply no longer read.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm nx test api -- company-scope`
Expected: PASS.

- [ ] **Step 6: Run everything**

Run: `pnpm nx test api` then `pnpm nx run-many -t typecheck -p api web`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix(security): derive company scope from the validated header

The guard checked x-active-company-id against user_company_assignments
while services filtered on an unvalidated companyId query parameter. A
Company-A user could read Company B's masters by passing ?companyId=B
with their own valid header, since both live in the same tenant database.

Services now read req.activeCompanyId, set by the guard after validation.
A guard test fails the build if any service reads query.companyId again.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Remove dairy

**Files:**
- Delete: `apps/api/src/modules/production/milk/`
- Delete: `apps/api/src/scripts/seed-greenfield-dairy.ts`
- Modify: `apps/api/src/modules/production/production.module.ts`
- Modify: `apps/web/src/app/(app)/layout.tsx`, `dashboard/page.tsx`, `batches/entry/page.tsx`, `livestock/page.tsx`, `settings/area/page.tsx`, `operational-areas/page.tsx`
- Modify: `apps/api/src/modules/production/list-dto-company-scope.spec.ts` (drop the `QueryMilkDto` case)
- Create: `apps/api/src/core/database/piggery-only-scope.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. This task only removes.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/core/database/piggery-only-scope.spec.ts
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Piggery is the only line of business in scope. Dairy support was added
 * ahead of that decision and is removed rather than left dormant: dead
 * branches in the dashboard and data entry are read by every developer who
 * touches those files, and cost more than they save.
 */
describe('piggery-only scope', () => {
  const apiSrc = join(__dirname, '..', '..');

  it('has no milk module', () => {
    expect(existsSync(join(apiSrc, 'modules', 'production', 'milk'))).toBe(false);
  });

  it('has no dairy seed script', () => {
    expect(existsSync(join(apiSrc, 'scripts', 'seed-greenfield-dairy.ts'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api -- piggery-only-scope`
Expected: FAIL — both paths exist.

- [ ] **Step 3: Delete the API side**

```bash
rm -rf apps/api/src/modules/production/milk apps/api/src/scripts/seed-greenfield-dairy.ts
```

Remove `MilkModule` from `production.module.ts`, and the `QueryMilkDto` import and case from `list-dto-company-scope.spec.ts`.

- [ ] **Step 4: Remove the web branches**

Run: `grep -rn "milk\|dairy\|DAIRY" apps/web/src --include="*.tsx" --include="*.ts" | grep -v translations.ts`

Delete each conditional branch. Where a `farm_type` or LOB switch has a `DAIRY` arm, remove the arm and leave the piggery path as the unconditional one. Leave the `DAIRY` value in `farm_type`'s option list in `configs.ts` — it is a stored enum value, and removing it would invalidate existing rows.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm nx test api -- piggery-only-scope`
Expected: PASS, 2 tests.

- [ ] **Step 6: Verify the web lint baseline has not grown**

Run: `pnpm nx lint web 2>&1 | tail -5`
Expected: **88 errors or fewer.** More than 88 means the deletion broke something — fix it rather than accepting a new baseline.

- [ ] **Step 7: Run everything**

Run: `pnpm nx test api` then `pnpm nx run-many -t typecheck -p api web`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: remove dairy support, piggery is the only LOB in scope

Removes production/milk, the dairy seed, and the dairy branches in the
layout, dashboard, data entry, livestock, area settings and operational
areas pages. The DAIRY farm_type option stays - it is a stored enum value.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Deferred to a follow-up plan

These are Phase A1 scope in the spec but depend on decisions or data not yet available. Each needs its own plan once unblocked.

- **NOB/LOB moved to Company** (spec §4.4). Needs a backfill rule for tenants whose operational areas disagree on LOB, and the "cannot change after the first batch" control point from BBP §1.1.
- **Operational area mapped 1:1 to farm** (spec §4.5). Needs a decision on what happens to tenants that already have two areas on one farm.
- **Silo/warehouse pairing** (spec §7). Needs the BFT alert level and Sunday reference stock fields, which are only meaningful once Phase B's silo balance exists.
- **KPI Parameter Master, 32 parameters** (spec §8 Phase A). The BBP names the count and the parity targets from §6.2, but not the full parameter list — same data dependency as the reason codes.

## Self-review notes

- **Spec coverage:** §4.8 dairy → Task 8. §5 scope model → Tasks 2, 6, 7. §6 stage reseed → Tasks 3, 4. §8 Phase A reason codes → Tasks 1, 2; animal categories → Task 5. Four Phase A items are listed above as deferred with the reason for each.
- **Placeholders:** none. The incomplete reason-code list is a stated client data dependency with a failing test that names it, not a "TODO".
- **Type consistency:** `ReasonCategory` (Task 1) is used by `reasonCodeMaster.category` (Task 2). `SYSTEM_STAGE_SEED` stage codes (Task 3) are consumed by `stage-lifecycle-coverage.spec.ts` (Task 4). `request.activeCompanyId` (Task 7 Step 3) is read in Task 7 Step 4.
