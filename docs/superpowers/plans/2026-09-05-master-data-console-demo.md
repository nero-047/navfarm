# Master Data Console (Demo Slice) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Consolidate the master-data sub-sidebar to one entry per real-world entity, and turn the add/edit dialog into Business-Central-style collapsible cards where a lookup (category, item type, UOM) can be created inline and immediately selected above.

**Architecture:** No new subsystem. `configs.ts` is a declarative registry of 24 masters; `MasterDataTable.tsx` already renders a Dialog/Drawer form from it, including `select-entity` dropdowns that fetch from an endpoint. This plan adds a parent/child dimension to the registry, groups the dialog's fields into collapsible cards, and adds child-master cards that reuse the same field renderer against the child's own config and `apiBase`.

**Tech Stack:** Next.js App Router, React, TypeScript, shadcn-style primitives in `apps/web/src/components/ui/`.

**Spec:** [docs/superpowers/specs/2026-09-04-piggery-bbp-aligned-posting-design.md](../specs/2026-09-04-piggery-bbp-aligned-posting-design.md) §5 (master data scope). The console shape itself was specified conversationally; this plan is its record.

## Global Constraints

- **Demo is a live click-through.** Every task must leave the app working. A visibly broken master is worse than an unconverted one.
- **Item Master is the flagship.** It must work completely. Other masters keep today's flat form and must not regress.
- **Sub-kinds are rows, not cards.** Farm/shed/pen/silo are one Location list with a Type column. Cards are for *lookups* — separate entities the main record points at.
- **Inline lookup creation saves immediately** (Business Central semantics): the child POSTs on add and exists even if the parent dialog is cancelled.
- **Web lint baseline is 88 errors.** Gate on "no new". Never fix `exhaustive-deps` as drive-by work.
- **Do not touch** `farm_master` / `shed_master` / `warehouse_master` table structure. The unified Location list needs a union or a migration; that is not in this plan.
- **Commands:** dev server `pnpm nx dev web --port=3002`; lint `pnpm nx lint web`; typecheck `pnpm nx run-many -t typecheck -p web`.
- **Machine has 8 GB RAM.** Stop the dev server when not actively checking the page.

---

### Task 1: Give the registry a parent/child dimension and consolidate the sidebar

**Files:**
- Modify: `apps/web/src/modules/master-data/types.ts`
- Modify: `apps/web/src/modules/master-data/configs.ts`
- Modify: `apps/web/src/components/console/master-data/master-data-page-shell.tsx:63-80`

**Interfaces:**
- Consumes: existing `MasterDataConfig` (`key`, `label`, `group`, `apiBase`, `idKey`, `columns`, `fields`).
- Produces: two optional fields on `MasterDataConfig` — `isPrimary?: boolean` (appears in the sidebar) and `lookupFor?: string[]` (keys of the primary masters whose dialog shows this as a card). A master with neither remains reachable by URL but leaves the sidebar.

- [ ] **Step 1: Extend the config type**

In `types.ts`, add to `MasterDataConfig`:

```ts
  /**
   * Shown in the master-data sub-sidebar. A master that is only a lookup for
   * another master (item category, UOM) is not primary — it is reached
   * through the card in its parent's dialog, not through its own nav entry.
   */
  isPrimary?: boolean;
  /**
   * Keys of the primary masters whose dialog renders this master as an
   * inline card. Order here is the order the cards appear.
   */
  lookupFor?: string[];
```

- [ ] **Step 2: Mark the primaries and the lookups**

In `configs.ts`, add `isPrimary: true` to: `location`, `item`, `resource`, `breed`, `supplier`, `customer`, `gl-account`, `stage`, `animal`.

Add `lookupFor: ["item"]` to: `item-category`, `item-type`, `uom`.

Leave every other config untouched — they keep working, they simply leave the sidebar.

- [ ] **Step 3: Filter the sidebar to primaries**

In `master-data-page-shell.tsx`, the `contextNav` memo currently maps every config in every group. Change the inner filter:

```ts
      groups: MASTER_DATA_GROUPS.map((group) => ({
        label: tLabel(group),
        items: MASTER_DATA_CONFIGS
          .filter((c) => c.group === group && c.isPrimary)
          .map((c) => ({ key: c.key, label: tLabel(c.label) })),
      })).filter((g) => g.items.length > 0),
```

The trailing `.filter` matters: a group whose every member is a lookup must not render as an empty heading.

- [ ] **Step 4: Verify in the browser**

Start the dev server, open `http://localhost:3002/master-data/item`, and confirm:
- the sub-sidebar lists only the nine primaries, with no empty group headings
- `/master-data/item-category` still loads directly by URL
- the Item list still renders with its Code / Name / Type / UOM columns

- [ ] **Step 5: Lint and typecheck**

Run: `pnpm nx lint web 2>&1 | tail -5` — expect **88 or fewer** errors.
Run: `pnpm nx run-many -t typecheck -p web` — expect 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/master-data/ apps/web/src/components/console/master-data/
git commit -m "feat(masters): consolidate the sub-sidebar to primary masters

Lookup masters (item category, item type, UOM) leave the nav and are
reached through cards in their parent's dialog. They remain routable by
URL so nothing is lost.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Group the dialog's fields into collapsible cards

**Files:**
- Modify: `apps/web/src/modules/master-data/types.ts`
- Modify: `apps/web/src/modules/master-data/configs.ts` (item config only)
- Modify: `apps/web/src/modules/master-data/MasterDataTable.tsx` (the dialog body, around the `visibleFields` render)
- Create: `apps/web/src/modules/master-data/CollapsibleCard.tsx`

**Interfaces:**
- Consumes: `MasterDataField` from Task 1's `types.ts`.
- Produces: an optional `section?: string` on `MasterDataField`; `<CollapsibleCard title, defaultOpen, children>`; fields with no `section` fall into a default first card, so every unconverted master renders exactly as it does today.

- [ ] **Step 1: Build the card component**

```tsx
// apps/web/src/modules/master-data/CollapsibleCard.tsx
"use client";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleCard({
  title, subtitle, defaultOpen = false, children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-[var(--radius-md)] border"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="text-sm font-semibold">{title}</span>
          {subtitle ? (
            <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {subtitle}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      <div hidden={!open} className="border-t px-4 py-4" style={{ borderColor: "var(--border)" }}>
        {children}
      </div>
    </div>
  );
}
```

Use `hidden` rather than unmounting: a collapsed card must not lose typed input.

- [ ] **Step 2: Add `section` to the field type**

In `types.ts`, on `MasterDataField`:

```ts
  /** Card this field belongs to. Fields with no section land in the first card. */
  section?: string;
```

- [ ] **Step 3: Section the item fields**

In `configs.ts`, add `section` to the item config's fields:
- `"Identification"` — `item_code`, `item_name`, `item_type`, `category_id`
- `"Units & Valuation"` — `uom_primary`, `uom_secondary`, `valuation_method`
- `"Classification"` — `nob_id`, `lob_id`, `tracking_series_id`
- everything else — leave with no `section`, so it falls into Identification

- [ ] **Step 4: Render fields grouped by section**

In `MasterDataTable.tsx`, replace the flat `visibleFields.map(...)` in the dialog body with a grouped render. Preserve the existing per-field renderer exactly — only the wrapper changes:

```tsx
{(() => {
  const DEFAULT = "Identification";
  const order: string[] = [];
  const bySection = new Map<string, typeof visibleFields>();
  for (const f of visibleFields) {
    const s = f.section || DEFAULT;
    if (!bySection.has(s)) { bySection.set(s, []); order.push(s); }
    bySection.get(s)!.push(f);
  }
  // A master with no sections configured renders one card, which looks the
  // same as today's flat form once expanded.
  return order.map((s, i) => (
    <CollapsibleCard key={s} title={s} defaultOpen={i === 0}>
      <div className="grid gap-4 sm:grid-cols-2">
        {bySection.get(s)!.map((f) => renderField(f))}
      </div>
    </CollapsibleCard>
  ));
})()}
```

If the existing field rendering is inline rather than a `renderField(f)` helper, extract it into one first — as its own commit — before this step.

- [ ] **Step 5: Verify in the browser**

Open `/master-data/item`, click Add:
- three cards appear, Identification expanded
- typing in a field, collapsing its card, and reopening preserves the value
- Save still creates an item
- open `/master-data/medicine` and confirm an unsectioned master still renders and saves

- [ ] **Step 6: Lint, typecheck, commit**

```bash
pnpm nx lint web 2>&1 | tail -5
pnpm nx run-many -t typecheck -p web
git add apps/web/src/modules/master-data/
git commit -m "feat(masters): collapsible cards in the master data dialog

Fields group by an optional section. Masters with no sections render one
card and behave exactly as before. Collapsed cards keep their input.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Inline lookup cards — add a category, select it immediately

**Files:**
- Modify: `apps/web/src/modules/master-data/MasterDataTable.tsx`
- Create: `apps/web/src/modules/master-data/LookupCard.tsx`

**Interfaces:**
- Consumes: `CollapsibleCard` (Task 2); `lookupFor` (Task 1); `MASTER_DATA_CONFIGS`; the existing `api` client.
- Produces: `<LookupCard config, onCreated>` — renders the lookup master's own required fields, POSTs to `config.apiBase` on add, calls `onCreated()`; and a `entityReloadKey` counter in `MasterDataTable` that forces the `select-entity` effect to refetch.

**Why this is the demo's point:** the operator adding an item discovers the category they need does not exist. Today they abandon the dialog, navigate to Item Categories, create it, navigate back and start again. With the card they add it in place and select it in the field above.

- [ ] **Step 1: Build the lookup card**

```tsx
// apps/web/src/modules/master-data/LookupCard.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api-client";
import type { MasterDataConfig } from "./types";

// `Row` is a local alias in MasterDataTable.tsx and is not exported from
// types.ts, so it is redeclared here rather than imported.
type Row = Record<string, any>;

/**
 * A lookup master rendered inside its parent's dialog. Saves immediately, as
 * Business Central does: the category exists the moment it is added, even if
 * the item dialog is then cancelled.
 */
export function LookupCard({
  config, onCreated,
}: {
  config: MasterDataConfig;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<Row>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Only the required, directly-typed fields. A lookup's own nested entity
  // pickers are out of scope here - it stays a small, fast form.
  const fields = config.fields.filter(
    (f) => !f.hideInForm && f.required && (f.type === "text" || f.type === "textarea" || f.type === "number"),
  );

  const add = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post(config.apiBase, form);
      setForm({});
      onCreated();
    } catch (e: any) {
      setError(e?.message || "Could not add");
    } finally {
      setBusy(false);
    }
  };

  const complete = fields.every((f) => String(form[f.key] ?? "").trim() !== "");

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="grid gap-1">
            <span className="text-xs font-medium">{f.label}</span>
            <Input
              value={String(form[f.key] ?? "")}
              placeholder={f.placeholder}
              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      {error ? (
        <p className="text-xs" style={{ color: "var(--destructive)" }}>{error}</p>
      ) : null}
      <div>
        <Button type="button" size="sm" onClick={add} disabled={busy || !complete}>
          {busy ? "Adding…" : `Add ${config.label}`}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Make the entity dropdowns refetchable**

In `MasterDataTable.tsx`, add a counter and include it in the dependency array of the effect that loads `select-entity` options (currently `[modalOpen, form, config.key]`):

```tsx
const [entityReloadKey, setEntityReloadKey] = useState(0);
// ... existing effect:
}, [modalOpen, form, config.key, entityReloadKey]);
```

- [ ] **Step 3: Render the lookup cards after the field cards**

Below the sectioned cards from Task 2, inside the dialog:

```tsx
{MASTER_DATA_CONFIGS
  .filter((c) => c.lookupFor?.includes(config.key))
  .map((c) => (
    <CollapsibleCard
      key={c.key}
      title={c.label}
      subtitle="Add one without leaving this form"
    >
      <LookupCard config={c} onCreated={() => setEntityReloadKey((k) => k + 1)} />
    </CollapsibleCard>
  ))}
```

- [ ] **Step 4: Walk the demo path in the browser**

This is the exact path that gets demonstrated. Verify it end to end:

1. `/master-data/item` → **Add Item**
2. Identification card → note the Category dropdown's current options
3. Expand **Item Category** → enter a code and name → **Add Item Category**
4. Return to Identification → **the new category is in the dropdown** → select it
5. Complete the required fields → **Save**
6. The new item appears in the list with its Type column populated
7. Reopen the dialog and confirm the category persisted

- [ ] **Step 5: Check the console for errors**

With the dialog open and after adding a category, confirm no red errors in the browser console and no failed requests in the network panel. A 400 on the lookup POST means its required-field filter is too narrow — widen `fields` in `LookupCard` for that config rather than hardcoding.

- [ ] **Step 6: Lint, typecheck, commit**

```bash
pnpm nx lint web 2>&1 | tail -5
pnpm nx run-many -t typecheck -p web
git add apps/web/src/modules/master-data/
git commit -m "feat(masters): inline lookup cards in the master data dialog

Add a category, item type or UOM without leaving the item form; the new
row appears in the field above immediately. Saves on add, as Business
Central does.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Not in this plan

- Unified Location list across `farm_master` / `shed_master` / `warehouse_master` — needs a union or a migration, and is not a night-before change.
- The other eight primary masters' sections and lookup cards. The mechanism is generic; converting each is a `section` and `lookupFor` edit once the pattern is proven on Item.
- i18n for the new card titles. Section names are English until the pattern is signed off, then they move into `translations.ts` across all eight languages.
- Everything in Phase A1 (reason codes, stage reseed, animal categories). Data layer, no visible change, deliberately after the demo.

## Self-review notes

- **Coverage:** sidebar consolidation → Task 1. Collapsible cards → Task 2. Inline lookup creation with immediate selection → Task 3. All three of the user's stated requirements are covered.
- **Placeholders:** none. Every step names the file, the change and the verification.
- **Type consistency:** `isPrimary` / `lookupFor` (Task 1 `types.ts`) are read in Task 1 Step 3 and Task 3 Step 3. `section` (Task 2) is read in Task 2 Step 4. `CollapsibleCard`'s props match both call sites. `entityReloadKey` is defined in Task 3 Step 2 and used in Step 3.
- **Risk:** Task 2 Step 4 assumes a `renderField` helper. If the rendering is inline, the extraction is called out as its own commit first.

---

### Task 4: Extend the pattern across every master, and un-orphan the nav

**Added after Tasks 1–3.** Two reasons: the user confirmed the demo may show **any** master, not only Item; and Task 1's sidebar filter left **13 masters reachable only by typing a URL** — no nav entry and no lookup card. Both are demo-visible.

**Files:**
- Modify: `apps/web/src/modules/master-data/configs.ts` (only)

**Interfaces:**
- Consumes: `isPrimary`, `lookupFor` (Task 1), `section` (Task 2), `LookupCard` rendering (Task 3). No new mechanism — this task is configuration only.
- Produces: zero orphaned masters, and sectioned dialogs on every primary master.

**Verify the starting state first.** Run this and confirm it reports 13 orphans; if it reports a different set, stop and report rather than proceeding on a stale assumption:

```bash
python3 - <<'PY'
import re
s=open('apps/web/src/modules/master-data/configs.ts').read()
blocks=re.findall(r'\{\s*\n?\s*key:\s*"([\w-]+)",(.*?)\n\};', s, re.S)
prim=[k for k,b in blocks if 'isPrimary: true' in b[:600]]
look=[k for k,b in blocks if 'isPrimary: true' not in b[:600] and 'lookupFor' in b[:600]]
orph=[k for k,b in blocks if 'isPrimary: true' not in b[:600] and 'lookupFor' not in b[:600]]
print("PRIMARY",len(prim),prim); print("LOOKUP",len(look),look); print("ORPHANED",len(orph),orph)
PY
```

- [ ] **Step 1: Promote the four masters that are entities, not lookups**

Add `isPrimary: true` to: **`medicine`, `disease`, `feed-formula`, `number-series`**. A farm needs to add a medicine from the navigation; it is not a lookup of anything.

- [ ] **Step 2: Give every remaining orphan a lookup home**

Add these exactly:

| Config | Add |
|---|---|
| `farm`, `shed`, `warehouse` | `lookupFor: ["location"]` |
| `species`, `breed-lifecycle-stage` | `lookupFor: ["breed"]` |
| `item-attribute`, `uom-conversion` | `lookupFor: ["item"]` |
| `gl-mapping`, `cost-center` | `lookupFor: ["gl-account"]` |
| `uom` | change existing to `lookupFor: ["item", "location", "resource"]` |

Re-run the check from above. It must now report **ORPHANED 0**.

- [ ] **Step 3: Add sections to the remaining primary masters**

Set `section` on each field exactly as listed. Any field not named keeps no `section` and falls into the first card, which is correct.

**location** — Identification: `location_code`, `location_name`, `location_address`, `location_type`, `parent_location_id`. Hierarchy: `farm_id`, `shed_id`, `warehouse_id`, `location_level`. Capacity: `area_size`, `area_unit`, `max_capacity`, `capacity_uom`, `current_count`. Silo: `silo_capacity_kg`, `silo_reorder_days`, `storage_type`. Site & Biosecurity: `gps_latitude`, `gps_longitude`, `is_quarantine_zone`, `downtime_days_required`.

**breed** — Identification: `breed_code`, `breed_name`, `species_id`, `breed_type`, `nob_id`, `lob_id`, `description`. Growth & Performance: `avg_growth_rate_g_day`, `avg_fcr`, `avg_mortality_pct`, `avg_yield_per_unit`, `avg_lay_rate_pct`. Reproduction: `gestation_days`, `lactation_days`, `incubation_days`, `avg_litter_size`, `avg_litter_size_born`, `avg_litter_size_weaned`, `avg_weaning_weight_kg`, `farrowing_rate_pct`. Productive Life: `mature_age_months`, `productive_life_months`, `productive_life_cycles`, `residual_value_pct`, `boar_doses_per_week`, `boar_productive_life_months`.

**resource** — Identification: `resource_code`, `resource_name`, `resource_type`, `resource_sub_type`, `nob_id`, `lob_id`. People: `employee_id`, `designation`. Capacity & Cost: `capacity`, `capacity_uom`, `unit`, `cost_rate`. Asset: `asset_code`, `asset_make`, `asset_model`, `asset_serial_no`, `purchase_date`, `warranty_expiry_date`. Maintenance: `maintenance_frequency_days`, `maintenance_cost_per_service`, `maintenance_vendor`, `last_maintenance_date`, `next_maintenance_date`.

**supplier** — Identification: `supplier_code`, `supplier_name`, `vendor_type`, `is_approved`. Contact: `email`, `phone`, `address_line1`, `city`, `state`, `country`, `pincode`. Commercial: `tax_number`, `payment_terms`, `credit_limit`. Banking: `bank_account_no`, `bank_ifsc`, `bank_account_last4`. Compliance: `health_cert_url`, `breeding_farm_code`.

**customer** — Identification: `customer_code`, `customer_name`. Contact: `email`, `mobile`, `address_line1`, `city`, `state`, `country`, `pincode`. Commercial: `tax_number`, `credit_limit`.

**stage** — Identification: `stage_code`, `stage_name`, `stage_category`, `stage_sequence`, `nob_id`, `lob_id`, `stage_description`. Duration: `typical_duration_days`, `min_days_before_move`, `auto_move_on_day`. Transitions: `transition_trigger`, `next_stage_id`, `alt_next_stage_id`, `alt_trigger_condition`. Data Entry: `data_entry_form`, `scheduler_auto_create`, `show_on_animal_card`.

**gl-account** — Identification: `account_code`, `account_name`, `account_type`. Hierarchy: `parent_account_id`, `is_sub_account`, `is_reconciliation`.

**animal** — Identification: `animal_code`, `animal_type`, `breed_id`, `gender`, `dob`, `rfid_tag`, `ear_tag`, `nob_id`, `lob_id`. Lineage: `sire_animal_id`, `dam_animal_id`. Acquisition: `entry_type`, `entry_date`, `source_receipt_id`, `source_batch_id`, `item_id`, `acquisition_cost`, `landing_cost`, `total_opening_asset_value`. Current Position: `current_stage_id`, `current_batch_id`, `current_location_id`, `status`. Production: `parity_count`, `total_piglets_born_live`, `total_piglets_weaned`, `productive_life_start`, `notes`.

**Note on `location`:** `location_type` appears more than once in the fields array because later entries reference it inside `requiredWhen` conditions. Set `section` on the field *definition* only — do not add `section` to a `requiredWhen` clause.

- [ ] **Step 4: Card order**

Grouping is first-seen order, so a card's position follows its first field's position in the array. Where the order above does not match the array order and the result reads oddly, reorder the FIELDS in the array — do not add a sort. Identification must come first on every master.

- [ ] **Step 5: Lint, typecheck, verify**

```bash
pnpm nx lint web 2>&1 | tail -5      # 88 or fewer
pnpm nx run-many -t typecheck -p web  # 0 errors
```

Re-run the orphan check one final time — ORPHANED must be 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/master-data/configs.ts
git commit -m "feat(masters): extend cards and lookups across every master

Promotes medicine, disease, feed-formula and number-series to primary;
gives farm/shed/warehouse, species, breed-lifecycle-stage, item-attribute,
uom-conversion, gl-mapping and cost-center a lookup home. Zero masters are
now reachable only by URL. Adds sections to the eight remaining primaries.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
