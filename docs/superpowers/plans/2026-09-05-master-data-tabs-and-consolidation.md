# Master Data: sidebar consolidation and per-sheet tabs

## Continuation status — 5 September 2026

The user confirmed the reduced sidebar during this continuation. T1 and T2 are
implemented: twelve primary masters, Item Attributes under Items, Lifecycle
Stages under Breeds, and UOM Conversions under Units of Measure. Each sheet uses
its existing route, list and Add/Edit dialog. The page heading describes the
selected sheet; its parent remains highlighted in the sidebar. Refresh and Back
preserve the sheet because tab selection is encoded in the route.

The source workbooks were checked directly. Animal Register's Breeding Record
sheet says it is for a later stage; the Stage workbook's second sheet is Example.
Neither becomes a new master surface. Triple-C reporting remains deferred.

One necessary correction to the plan: Feed Formulas cannot use the old compact
lookup creator, which silently omitted required entity selectors and ingredients.
The inline creator now includes those fields and converts numbers and JSON before
submission. Lookup cards also link to their full management pages in a new tab,
so moving Diseases/Feed Formulas does not remove access to their lists and edits.
Customers remains intentionally reachable through `/master-data/customer`.

Verification: desktop (1440px) and mobile (390px) browser tests cover all three
tab groups, page headers, refresh, dialogs, the twelve-entry sidebar and the
Customers route. An intercepted formula submission test checks its required
payload, including numeric quantity and parsed ingredients; it does not write
test records to the live database. Live Item Attributes listing and dialog were
also inspected using the existing authenticated session. Web/web-e2e typechecks
pass; web lint remains at the existing 83 errors elsewhere.

The older A1 data-foundation programme remains separate unfinished work. Its
reason-code list needs client input. Its instructions to deliberately leave a
test failing, delete duplicate records, and remove Dairy must be reassessed
against current requirements before execution. The live Preseed cloning issue
described at the end of this plan is still outstanding.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Make the Master Data sidebar list the seven client template masters plus the masters the BBP mandates, and give each master one tab per sheet in its template — each tab a full surface with its own list and Add dialog.

**Architecture:** No new UI primitive. `apps/web/src/components/ui/tabs.tsx` already provides an underline-style `Tabs` ( `items`, `value`, `onChange` ) built on the project's own tokens; nothing uses it yet. The master registry gains a `tabOf` / `tabLabel` pair mirroring the existing `lookupFor` pattern, and `master-data-page-shell.tsx` renders `Tabs` above `MasterDataTable`, swapping the config per tab.

**Tech Stack:** Next.js App Router, React, TypeScript, existing `Tabs`/`MasterDataTable` components.

**Spec:** [2026-09-04-piggery-bbp-aligned-posting-design.md](../specs/2026-09-04-piggery-bbp-aligned-posting-design.md)
**Field truth:** `Master Templates/*.xlsx` (committed `f7e89ff`).

## Global Constraints

- **No fixed deadline.** The user sets the demo time and will show it when it is finished. Prefer correct over fast; do not ship something unverified to hit a clock.
- Lint baseline **88** (currently 83) — gate on "no new", never touch `react-hooks/exhaustive-deps`.
- Typecheck clean: `pnpm nx run-many -t typecheck -p api web`. API tests: `pnpm nx test api` (247/247).
- Dev servers already run on **2877** and **3002**. Do not start or stop them. **Never run `pkill`** — an earlier `pkill -f "nx serve api"` matched the tooling's own process and took down the session's shell.
- Only one agent edits `configs.ts` at a time.
- Commit trailer: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Measured starting position

The seven client templates and their sheets, read from the workbooks:

| Template | Sheets | Becomes |
|---|---|---|
| Item Master | Item Master, **Item Attribute** | 2 tabs |
| Breed Master | Breed Master, **Breed lifecycle stages** | 2 tabs |
| Unit Of Measure | Unit Of Measure, **UOM Conversion** | 2 tabs |
| Animal Register | Animal Register, *Breeding Record* | **1 tab** — sheet 2 is annotated *"Just req data for the understanding, later stage"*, i.e. explicitly deferred by the client |
| Stage Master | STAGE MASTER, *Example* | **1 tab** — sheet 2 is sample data, not an entity. Its rows are the source of the `GILT_GROWER 77` figures that contradict BBP §1.7; the sheet is literally named "Example" |
| Location Master | single sheet | 1 tab |
| Resource | single sheet | 1 tab |

**Ten tabs across seven masters.**

---

## T1 — Consolidate the sidebar · config only

**Target: twelve primary masters.**

Seven with client templates: `item`, `breed`, `uom`, `animal`, `location`, `resource`, `stage`.

Five mandated by BBP §1 "Master Data Setup", which names them under different words:

| Config | BBP §1 calls it |
|---|---|
| `supplier` | **Vendor** |
| `gl-account` | **COA from D365BC** |
| `cost-center` | **Dimensions/Cost Centres** |
| `number-series` | **No Series** |
| `medicine` | not in §1, but required by **§5 Block 2** (FEFO, expired lots blocked, withdrawal-day banner feeding the slaughter check) |

- [ ] **Step 1: Set the primary list to exactly those twelve.**

Remove `isPrimary` from: `customer`, `disease`, `feed-formula` — no BBP basis in current scope (customer matters only for sales, which is out of scope). Also remove it from `uom-conversion` and `breed-lifecycle-stage`, which become tabs in T2.

Add `isPrimary: true` to `cost-center`. It keeps its existing `lookupFor: ["gl-account"]` — a config may be both; the sidebar filter reads `isPrimary` and the dialog cards read `lookupFor`, independently.

- [ ] **Step 2: Keep the three dropped masters reachable.**

`customer`, `disease` and `feed-formula` must not become orphans — that regression was fixed once already. Give each a `lookupFor` home so it appears as an inline card in a parent's dialog:
- `disease` → `lookupFor: ["medicine"]` (a medicine treats a disease)
- `feed-formula` → `lookupFor: ["item"]` (a formula is built from items)
- `customer` → `lookupFor: ["supplier"]` is wrong — they are unrelated. Leave `customer` with neither flag, and instead record in the commit message that it is intentionally routable-by-URL only until sales enters scope. **Do not silently orphan it — say so.**

- [ ] **Step 3: Verify the resulting split.**

```bash
python3 - <<'PY'
import re
s=open('apps/web/src/modules/master-data/configs.ts').read()
b=re.findall(r'\{\s*\n?\s*key:\s*"([\w-]+)",(.*?)\n\};', s, re.S)
p=[k for k,x in b if 'isPrimary: true' in x[:600]]
l=[k for k,x in b if 'lookupFor' in x[:600]]
t=[k for k,x in b if 'tabOf' in x[:600]]
n=[k for k,x in b if 'isPrimary: true' not in x[:600] and 'lookupFor' not in x[:600] and 'tabOf' not in x[:600]]
print("PRIMARY",len(p),sorted(p)); print("LOOKUP",len(l),sorted(l))
print("TAB",len(t),sorted(t)); print("NO HOME",len(n),sorted(n))
PY
```
Expect PRIMARY 12. `NO HOME` should contain only `customer`, `farm`, `warehouse`, `shed` — the last three are the deliberate compatibility bridge from the unified Location work.

- [ ] **Step 4: Lint, typecheck, commit.**

---

## T2 — One tab per sheet

- [ ] **Step 1: Extend the config type**

In `apps/web/src/modules/master-data/types.ts`, on `MasterDataConfig`:

```ts
  /**
   * Key of the primary master this config appears under as a tab. Mirrors the
   * client's Excel templates, where a master's workbook carries one sheet per
   * surface — Item Master + Item Attribute, Breed + Breed Lifecycle Stages.
   * A tab is a full surface: its own list, its own Add dialog.
   */
  tabOf?: string;
  /** Label for this config's tab. Falls back to `label`. */
  tabLabel?: string;
```

- [ ] **Step 2: Mark the three tab children in `configs.ts`**

| Config | Add |
|---|---|
| `item-attribute` | `tabOf: "item"`, `tabLabel: "Item Attributes"` |
| `breed-lifecycle-stage` | `tabOf: "breed"`, `tabLabel: "Lifecycle Stages"` |
| `uom-conversion` | `tabOf: "uom"`, `tabLabel: "UOM Conversions"` |

Remove `lookupFor` from `item-attribute` and `uom-conversion` — a config that is a tab does not also need to be an inline card in the same parent's dialog; that would present the same entity twice on one screen. `breed-lifecycle-stage` likewise drops its `lookupFor: ["breed"]`.

- [ ] **Step 3: Render the tabs**

In `apps/web/src/components/console/master-data/master-data-page-shell.tsx`, the final line currently reads:

```tsx
<MasterDataTable key={`${activeConfig.key}-${selectedCompanyId}`} config={activeConfig} />
```

Replace with a tabbed surface:

```tsx
const tabConfigs = useMemo(
  () => MASTER_DATA_CONFIGS.filter((c) => c.tabOf === activeConfig.key),
  [activeConfig.key],
);
const [activeTab, setActiveTab] = useState(activeConfig.key);

// Switching master must reset the tab, or Item's "Attributes" tab stays
// selected when the user navigates to Breed.
useEffect(() => { setActiveTab(activeConfig.key); }, [activeConfig.key]);

const tabItems = useMemo(
  () => [
    { value: activeConfig.key, label: tLabel(activeConfig.tabLabel || activeConfig.label) },
    ...tabConfigs.map((c) => ({ value: c.key, label: tLabel(c.tabLabel || c.label) })),
  ],
  [activeConfig, tabConfigs, tLabel],
);

const shownConfig = activeTab === activeConfig.key
  ? activeConfig
  : (tabConfigs.find((c) => c.key === activeTab) ?? activeConfig);
```

then render `Tabs` (only when `tabConfigs.length > 0`) above the table, and key the table on the **shown** config:

```tsx
{tabConfigs.length > 0 && (
  <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} />
)}
<MasterDataTable key={`${shownConfig.key}-${selectedCompanyId}`} config={shownConfig} />
```

`Tabs` comes from `@/components/ui/tabs`. A master with no tab children renders exactly as it does today — no tab bar at all.

**The `key` prop matters.** `MasterDataTable` holds its own fetch and form state; without a changing key, switching tabs would show the previous tab's rows. That is also why the existing key includes `selectedCompanyId`.

- [ ] **Step 4: The page header should follow the tab**

`PageHeader` currently shows `activeConfig`'s label and description. When a tab is active, the header should describe what is on screen. Either move the header inside the tab switch or leave the master's name and let the tab bar carry the distinction — pick one, and say which in the commit message. Do not leave the header describing Items while the Attributes list is shown.

- [ ] **Step 5: Verify in the browser**

The web dev server runs on 3002. Check on `/master-data/item`, `/master-data/breed`, `/master-data/uom`:
- the tab bar appears with the right two labels
- switching tabs swaps the list, and the rows belong to the tab's entity
- Add on each tab opens that entity's dialog and saves
- a single-sheet master (`location`, `resource`, `stage`, `animal`) shows **no** tab bar
- navigating master→master resets to the first tab

If you cannot sign in, say exactly what you verified and what you could not. Do not claim visual confirmation you did not obtain.

- [ ] **Step 6: Lint, typecheck, commit.**

---

## Out of scope

- The **Breeding Record** sheet — the client annotated it "later stage".
- The Stage template's **Example** sheet — sample data, not an entity.
- Tabs for masters whose template has one sheet.
- i18n for the new tab labels: English until the pattern is signed off, then into `translations.ts` across all eight languages.

## Known live issue, not addressed here

`master-data-page-shell.tsx` still renders the **Preseed** button (`handlePreseedCompany`), which calls the clone-down endpoint. That clone duplicates every tenant-wide row into company scope while the list query returns both, so items appear twice. It is company-admin only. Removing it is A1 Task 6 in the parity plan and has not been executed.
