# NAVFarm — decisions record

**Rishi is the source of truth for this application.** This file is the record
of what he has decided: what he asked for, what was decided, and why. The BBP,
the TDD tracker, the master templates and the MOMs are *reference* — evidence of
what the client has said — and every one of them is incomplete, unsigned, or
contradicts another.

**Read this before planning. Add to it when a decision is made.** A decision
that only exists in a chat log gets re-asked, or quietly reversed, by whoever
works next.

Each entry: what was asked, what was decided, and the reasoning — because the
reasoning is what tells a later reader whether a new situation is covered.

---

## Standing rules

These apply to all work and are not up for re-litigation.

| Rule | Why |
|---|---|
| **Piggery only.** NOB Livestock → LOB Piggery. Sixteen LOBs exist as taxonomy; nothing else is in scope. | Other domains come after piggery is complete. Keep shared scaffolding generic so adding one later stays additive. |
| **Do not assume anything that is not clear. Ask.** | Rishi has said this repeatedly. He is explicit that he relies on the agent for piggery domain knowledge, so a confident guess is worse than a question. |
| **Never invent client data.** No placeholder companies, no example identifiers, no "typical" values presented as the client's. | Indian demo placeholders (`greenvalleyfarms.in`, `GSTIN12345`, `+91…`, `Asia/Kolkata`) shipped on a Zimbabwe piggery's screens. |
| **Review anything Arun's tooling landed.** | "he was creating a lot of difficulties… we would review anything that he adds to our branch". Also: "arun used gemini free antigravity so we have to work properly so that people do not compare us with cheap things". |
| **The eight non-English translations are deferred to the end.** English only for now; new keys fall back to English per key. | 2026-09-06. Content will be settled in English first, then translated once. |
| **Leave the dev servers running.** Close them only when memory is actually red — check `top -l 1 -n 0 \| grep PhysMem` and `sysctl vm.swapusage`. | 2026-09-07. Rishi browses the app in Brave while work happens; stopping the server pulls the page out from under him. The 8 GB machine still swaps hard, so check rather than guess. |
| **Never run `pkill`.** Kill a PID confirmed with `lsof -ti :PORT`. | A `pkill` killed an entire working session. |

---

## Master data

### Every master carries a code, from a number series
*Asked 2026-09-06 ("add code for them too"), extended 2026-09-07.*

Each master has one series. When every master has one, the "add number series"
button is hidden — there is nothing left to create. Auto-generated codes are not
editable in the form.

Still open, and Rishi's to decide: manual entry currently ignores the series
format entirely (`manualCode` checks width and uniqueness only), and ANIMAL and
LOCATION are excluded from the series picker although the Animal template says
the animal code comes from a series. Rishi deferred this: *"we would work on the
number series later"*.

### The series describes the data, or the data follows the series — per master
*Decided 2026-09-09.*

The series and the master data had never agreed. Every series read
`current_seq = 0` and `last_generated_code = NULL`: not one code in the database
had come out of the mechanism that claims to issue them. Running the real
`formatSeriesCode` over the real rows showed why that had gone unnoticed — the
definitions described codes nothing carried. SPECIES said `SPC-001` over twelve
rows coded CHICKEN, PIG, GOAT; STAGE said `STG-001` over fifteen coded
GESTATION, FARROWING, QUARANTINE.

Rishi's call is per master, not one blanket rewrite:

- **SPECIES and STAGE became "named" series** — the code is the name, sequence 0
  — which reproduces the codes already in the database exactly. Stage codes are
  matched as string literals in twelve files, `location.service.ts` and
  `animal.service.ts` among them; `STG-004` would have broken all of it. Only
  `BEE` moved, to `HONEY_BEE`, being the one species code of twelve that was not
  already its own name.
- **GL_ACCOUNT and COST_CENTER are `is_active = 0`** — defined, so the master is
  not reported as lacking a series, but never generating. A GL account's number
  *is* the chart of accounts (1000s assets, 4000s revenue, 5000s expenses) and
  BBP-1 §1.6 puts that catalog in D365BC. `GL-001` discards the only information
  the number carries. `resolveSeriesFor` filters on `is_active`, so both fall to
  their existing `createManual` paths.
- **Location codes were regenerated** from the LOCATION series — `FARM-001`,
  `FARM-001/SHED-001`, `FARM-001/SHED-001/PEN-003`. Theirs was the one case
  where the hand-written code (`PEN-AI-B2`) carried nothing the series does not,
  and the series' "/" between levels and "-" before the number exists precisely
  to express that path.
- **UOM and LOCATION_TYPE were left alone.** KG, ML and SHED are the standard
  symbols; no rule derives them from "Kilogram", "Millilitre" or "Shed/House".
  `SYSTEM_NO_SERIES_SEED` already documents this as what `allow_manual` is for.

`current_seq = 0` is **correct** and was not "fixed". The masters that hold
codes — location, animal, item, breed lifecycle — all use segmented series,
which count within a stem via `nextSequenceInStem` and never consult
`current_seq`; every flat series' master is either empty or holds NULL codes.
There is no counter here that is behind.

`SYSTEM_NO_SERIES_SEED` now seeds this shape for new tenants;
`db-align-master-codes-to-series` brings an existing one into line.

### Code columns widened, and item categories conformed
*Decided 2026-09-10, unblocking the above.*

Conforming ITEM_CATEGORY yields `BIOLOGICAL_ASSETS-BREEDING_STOCK`, which the
ITEM series composes into a **57-character** item code against `item_code
varchar(50)` — `assertCodeFits` rejects it and item creation stops working for
the biological-asset categories. So the column moved instead.

Migration **0082** widens six columns to `varchar(255)`, the width five master
code columns (breed, cost centre, GL account, item category, location) have
carried all along:

| Column | Was | Why |
|---|---|---|
| `item_master.item_code` | 50 | The actual overflow — 57 chars. |
| `inventory_ledger.item_code` | 50 | Denormalised snapshot; has to move with the master or a long code truncates at posting. |
| `uom_master.uom_code` | 20 | Series now derives from `uom_name`, which is prose. |
| `item_type_master.type_code` | 30 | Same — derives from `type_name`. |
| `location_type_master.type_code` | 30 | Same. |
| `item_attribute_master.attribute_code` | 50 | Same — derives from `attribute_name`. |

Every one of these already sits inside a composite unique key; at
utf8mb4 a `(tenant_id, company_id, code)` key is 1092 bytes against InnoDB's
3072-byte limit, which the five columns already at 255 had proven.

The eight item categories are now conformed (`CAT-RAW-GRAINS` →
`RAW_GRAINS_CEREALS`). Nothing referenced a category by code —
`item_master.sub_category` is the only column that could and it is NULL on every
row; everything else joins on `category_id`.

**ITEM itself is still not conformed.** Existing item codes stay
`BIO-SWINE-BOAR`; only newly created items take a series code, now that one
fits. Regenerating the 27 existing ones cascades into batch, inventory and
goods-receipt fixtures and is its own piece of work.

**A bug this caught, worth remembering.** The first version of the category seed
passed the seed's own `{key, name}` shape to a series configured on
`category_name`. `formatSeriesStem` found no matching field, returned an empty
stem, and `formatSeriesCode` fell through to the bare sequence — every category
got the code `"1"`, and the second insert died on
`uq_item_category_master_scope_code`. Tests did not catch it; running the seed
did. `seed-series-code.ts` now throws when a named series composes an empty
stem, rather than inventing a code or quietly falling back to a hand-written one.

Noticed while doing this and **not** fixed: all 29 `gl_mapping_master` rows have
`mapping_code` NULL, although a GL_MAPPING series exists and
`gl-mapping.service` calls `resolveOptionalCode`. The seed inserts them without
codes.

### Every code column is varchar(255), and the seeds generate every code
*Decided 2026-09-10.*

**Why not TEXT.** The obvious answer to "make any series combination fit" is to
make the column TEXT. It breaks two things, both demonstrated rather than
assumed:

1. MySQL refuses a unique key on TEXT outright — *"BLOB/TEXT column used in key
   specification without a key length"* — and every master code column sits in
   a composite unique key. The workaround, a prefix length, makes uniqueness
   prefix-only: with `code(20)`,
   `LIVESTOCK-BIOLOGICAL_ASSETS-BREEDING_STOCK-ITM-0001` and
   `LIVESTOCK-BIOLOGICAL_ASSETS-GROWER_FINISHER-ITM-0001` collide as duplicates.
   Codes exist to be identities; that is the one guarantee they cannot lose.
2. `assertCodeFits` reads the declared varchar length off the Drizzle column to
   reject an over-long code at generation time (Option C, decided 2026-09-08).
   TEXT has no length, `codeColumnLength()` returns undefined, and the guard
   silently disables — so an absurd code gets written instead of refused.

"Any length" is unreachable anyway: InnoDB's key limit is 3072 bytes, so at
utf8mb4 a `(tenant_id, company_id, code)` key tops out near varchar(696);
varchar(700) is rejected. **255 is the answer** — 1092 bytes in that key, and
already proven by the five columns that carried it from the start.

Migration **0083** takes the remaining 18 columns to 255: every column
`MASTER_CODE_COLUMNS` names, plus the by-value mirrors that must move with them
(`no_series_master.last_generated_code`, `batch_header.current_stage_code`,
`batch_stage_log.from/to_stage_code`, `farm_record.stage_code`,
`scheduler_parameter_line.stage_code`).

**The seeds now generate every code through the series.** `lib/seed-series-code.ts`
composes with the same formatter the API uses and persists `current_seq` /
`last_generated_code`, so the app continues where the seed stopped — verified by
creating a supplier through the API after seeding four and getting `SUP-005`.
After a full `db-seed-demo --fresh`, 11 rows out of ~300 do not match their
series, and all 11 are the deliberately-manual ones: UOM (KG, ML — standard
symbols), two ITEM_TYPEs, one LOCATION_TYPE. GL_ACCOUNT and COST_CENTER stay
inactive.

Three bugs this surfaced, none of which the tests caught:

- **`inArray` was never imported** in `seed-demo-full-coverage.ts` and
  `seed-demo-gaps.ts`. Stage 4 of `db-seed-demo` had been dying at runtime; the
  typecheck had been reporting it as part of an accepted baseline.
- **The series were seeded after the masters that need them.** Starter items and
  breed-lifecycle rows came out `LVS-PIGLET` and `LANDRACE-WEANING` — their
  fallbacks — because no series existed yet. The series block now runs first.
- **`animal_register.dob` was never populated**, so the ANIMAL series' `dob:YEAR`
  segment resolved to nothing and would have composed `PIG-0001`, while the seed
  hand-wrote `PIG-2026-0001`. The seed sets a dob now, so the series produces
  that code itself. This does not settle the open question of `PIG-` vs `ANM-`.

**Still hand-written:** nothing in the master data. Note `item_master.sub_category`
is NULL throughout, so item codes are `<type>-<category>-ITM-<seq>`; the
three-segment form only appears once a sub-category is set.

**Unrelated, and flagged not fixed:** `seed-demo-gaps.ts` still carries Indian
placeholder data on a Zimbabwe piggery — Pune/Maharashtra addresses, `+91`
phone numbers, `27AABCU…` GSTINs. Same class as the bug AGENTS.md §3 already
records. Not corrected here because inventing replacement client data is exactly
what that rule forbids; Triple C has to supply real values.

### Tenant is the draft, the company is what is used
*Decided 2026-09-10.*

Every master carries `company_id`, `nob_id` and `lob_id`. No `area_id` — one LOB
is one operational area for now, and a wider scope is later work.

- **Tenant scope** holds the draft. **Company scope** holds the copy that is
  actually used, and **operational scope shows the same rows** as company scope.
- **NOB/LOB are selectable at tenant and company scope** (added to all 23 master
  configs, with `supportsNobLobFilter`), and **hidden and auto-filled at
  operational scope** from the active area. A mismatched value is rejected.

`copy-master-templates.ts` already implemented the draft→copy mechanism, and
`no_series_master` was already one of its 22 template tables. **Nothing ever
called it** except a one-time migration script, which is the whole reason a
number series resolved to nothing at company scope: the series is a master, the
company had no copy of it, and `resolveSeriesFor` correctly found none. It now
runs as stage 3 of `db-seed-demo`, before any company data is written.

Migrations 0084/0085 add the columns, plus `company_id` on
`breed_lifecycle_stages` — the one master that had none — with its unique key
rebuilt to the `(tenant_id, coalesce(company_id,''), code)` form the other 22
use. drizzle-kit escapes the `coalesce` expression into backticks and emits
invalid SQL, so 0085 is hand-written to match 0067–0069.

Four things this broke, each found by driving the app rather than by tests:

- **The auto-fill broke every create.** `enforceMasterRequest` writes
  `body.nob_id` before the ValidationPipe runs, and `forbidNonWhitelisted`
  rejected it because the DTOs did not declare the field. 12 DTOs updated.
- **The auto-fill was then silently dropped.** The guard fills `body`, but each
  service builds its own insert object; 11 services never copied it, so the first
  "successful" create stored NULL NOB/LOB. `reason.service` was fine — it
  spreads `...dto`.
- **Template copies were planned twice.** Giving `breed_lifecycle_stages` a
  `company_id` made it a first-class template while it was still in
  `loadCompanyTemplateCopies`'s explicit child list — which existed *because* it
  had none. Every row was planned twice and the second insert died on the scope
  key. Removed from the child list.
- **Item attributes were invisible at company scope.** They are seeded at stage 6,
  after adoption at stage 3, so a tenant-only row never got a copy. They are
  written per company now.

`seriesCodeFor` prefers the company's series over the draft
(`ORDER BY company_id IS NULL`), mirroring `generateNext` — without it a code
could be composed from the draft while the app read the company's row.

**Field completeness.** After a full reseed, 9 of 23 masters have every column
populated. The rest leave optional columns NULL — GPS coordinates, warranty and
licence expiry, bank details, disposal and amortisation fields on live animals,
KPI thresholds. Those are deliberately empty: filling them means inventing Triple
C's data, which §3 forbids. Two are genuine gaps and neither is ours to close:
`reason_master` is **empty** (47 reason codes were promised, none exist), and
`item_master.sub_category` is NULL throughout, so item codes are
`<type>-<category>-ITM-<seq>` and the three-segment form never appears.

### Medicine is not a master — it is an item
*Decided 2026-09-06.*

Removed and folded into Item. No separate tab, module or master: an item has a
type, and medicine is one of those types. BBP-1 §1.5 only ever calls medicine an
item, and no document asks for a Medicine master; the table was added by Arun in
July.

### Items, GL Accounts and Cost Centers stay locally editable, with a notice
*Decided 2026-09-06.*

BBP-1 §1.5 and §1.6 say these are created in D365BC only. No BC connector
exists, so locking the screens would block all work. They remain editable and
each screen states both halves: where the records are meant to come from, and
that they are local records today. Each master supplies its own citation via
`bcNote` — one hardcoded sentence would be wrong on every other screen.

### Array and JSON fields are edited as rows, not as JSON
*Asked 2026-09-06: "ask for the input fields and a button to add it and then option to delete it and a add more button".*

No user types raw JSON. Row editor with Add / Remove / Add more.

### The item form cascades: type → category → sub-category
*Asked 2026-09-06.*

Category appears only when an item type is chosen **and** that type has
categories. Sub-category appears only when a category is chosen.

### UOM conversion is looked up, and captured once if missing
*Asked 2026-09-06.*

Primary UOM is what the item is bought in, secondary is what it is used in.
The item form does not re-ask for a conversion factor that UOM Conversion
already holds — it shows it. If none exists, it is captured there and written to
UOM Conversion.

Extended 2026-09-08: neither UOM picker offers the unit the other already holds,
and the capture now runs on edit as well as create. It used to run on create
only, so an item edited to add a secondary unit wrote the factor to its own row
and nowhere else, and the next item over the same pair was asked again with
nothing to stop a different answer.

### Item tracking is one three-way choice, over the two columns that already exist
*Asked 2026-09-08: "one switch for tracking then one for lot/serial and then an
input and in backend two booleans for lot and serial".*

TDD row 11 wants LOT, SERIAL or neither. The table has `is_lot_tracked` and
`is_serial_tracked` as independent flags, which can both be ticked — a state the
requirement has no name for. **The columns stay as they are; the form is what
changes.** A tracking switch, then a segmented Lot/Serial choice, then the
number series — the three in one card, in the order they are decided.

Segmented rather than a two-position switch, because a switch cannot label its
own "off": between "Tracking: on" and the series picker, an unlabelled toggle
cannot say whether off means Lot or Serial.

Turning tracking off also clears `tracking_series_id`, in the API rather than
the form. A number left standing on an untracked item reads as configuration
still in force.

Amended 2026-09-08: the number was briefly made **typed, not picked**, because
the picker offered BREED and CUSTOMER — series with nothing to do with lot
numbers.

Reversed the same day. The complaint was right and the fix was not: the picker
was unfiltered and no lot or serial series existed, which is a missing filter
and two missing rows, not a reason to store a number here. An item has many lots
— FEED_STARTER takes one in March and another in April — so no single lot number
is a property of the item, and the numbers already have homes per transaction on
`goods_receipt_line.lot_no`, `inventory_ledger.lot_no`, `bio_asset_ledger.lot_no`
and `qr_code_master.lot_no`. TDD row 12 names the field "No. **Series**", and the
BC field already in the item's `bcFields` is "Lot Nos.", which in BC is a series.

Row 12's trailing "(manual)" is `no_series_master.allow_manual` — whether a
number may be typed rather than generated is a property of the series, and it is
set on both new rows.

So: the picker is back, filtered. `db-seed-item-tracking-series` adds ITEM_LOT
and ITEM_SERIAL in every scope that already carries an ITEM series, with
`document_type` LOT / SERIAL so the segmented Tracked By control passes its own
value straight through as `?documentType=`. The foreign key is restored. The
card grouping, the segmented control and the clear-on-untrack all stay.

The GRN being BC-owned does not change this: the item names the series, the
receipt records the number, and `goods-receipt-panel` already captures `lot_no`
per line — locally until BC connects, like every other BC-owned record.

### The two GL accounts are read in the record, not typed in the form
*Asked 2026-09-08: "Inventory GL Account (BC) + COGS GL Account (BC) should be
shown in the detail with a text/chip saying from BC".*

Both are listed in the item's `bcFields`, which puts them in the record view's
Business Central panel under a From BC chip and takes them out of the create and
edit form. Narrower than the 2026-09-06 rule above, which keeps BC-owned masters
editable: that rule is about whole catalogs — an item still has to be creatable
here. These two fields are BC's answer, and until the connector exists they read
as a dash rather than as a local guess.

### Stock-control fields hang off the inventory flag; the withdrawal period does not
*Asked 2026-09-08.*

Min, max and reorder levels, lead time, shelf life and both storage
temperatures appear only when Inventoriable is on — a non-inventoried item has
no balance for them to describe.

Withdrawal Period is the exception: it shows when Inventoriable is on **or** the
item type is MEDICINE/VACCINE. It is a food-safety block that animal disposal
reads before allowing a slaughter, so a medicine that happens not to be
inventoried still has to carry one. Capped at two digits (99), per TDD row 21 —
in the form and in the DTO, so the form refuses what the API would reject.

---

## Animal Register

### The Active column is dropped for animals
*Decided 2026-09-07, after being asked whether the switch should work.*

An animal is not deactivated, it is **disposed**. Breed has `@Delete(':id')` and
`@Patch(':id/restore')`, which is what its switch calls; Animal has neither, only
`@Patch(':id/dispose')` — and `dispose()` blocks until every administered
medicine's withdrawal period has elapsed, computes gain/loss against book value,
and records the disposal date, type and value. A plain toggle would skip all of
it.

**Consequence to watch:** `dispose()` maps SOLD/SLAUGHTERED/DIED onto the status,
but TRANSFERRED maps to nothing — a transferred-out animal keeps its old status
and only `is_active` flips. With the column gone, that animal reads as ACTIVE.
The client's template lists ten statuses and TRANSFERRED is not among them, so
representing it is a question for Triple C.

### Status renders as a chip; Active is a switch elsewhere
*Asked 2026-09-07: "status and active are different thing right? so switches for the active and the statuses in chips".*

They are different facts — status is the master's own state, Active is whether
the record is live at all. Colour on the status chip says whether the record is
still in play, not a colour per value: a ten-value column painted ten ways is a
chart, not a table.

### Disposal statuses cannot be set through the plain edit path
*Enforced 2026-09-07 after the hole was demonstrated.*

`PUT /animal/:id` with `{status:'SLAUGHTERED'}` returned **200** and left the
animal SLAUGHTERED with `is_active` still 1, no disposal record, and the
withdrawal-period check never run. It now returns 400. CULLED is refused too,
but with a different message: `DISPOSAL_TYPES` is SOLD/SLAUGHTERED/DIED/
TRANSFERRED, so Dispose cannot set CULLED either — the cull flow (out-of-
production date, cull date, reason, weight, write-off) is not built.

### Clicking an animal opens a detail panel; four tabs
*Asked 2026-09-07, refined the same day.*

The list narrows and a panel opens beside it. Tabs: Animal data, Breeding
details, Traceability, and Location traceability and History are to be added —
Rishi chose to keep the genealogy timeline as well rather than replace it.

*Attribution corrected 2026-09-08.* This entry used to credit the two new tabs
to "TDD row 6". It should not: Excel row 6 (S.No. 5) asks only for a clickable
list page, an animal card and an RHS overview pane. The tracker never mentions
a History tab or a Location traceability tab, and neither do the master
templates, BBP-1 or the MOMs — searched, not assumed. The tabs and their
columns are **Rishi's**, recorded below.

Traceability is a **timeline of cards, newest first, each expanding in place**
— not a dialog, and opening one closes the other. Steps with no table are named
as unmodelled rather than drawn as empty cards, because an empty card implies
the record is merely missing.

The panel header shows the **animal code only**. Type, gender and status live in
the Animal data tab; the code stays in the header because it is the one fact
that must hold on every tab.

### TDD row numbers in this repo mean Excel row numbers
*Established 2026-09-08, after a misattribution traced back to it.*

The tracker has a `S.No.` column that runs one behind the spreadsheet's own row
numbers, because row 1 is the header. When Rishi says "row 12" he means Excel
row 12, which is S.No. 11. Quote it as "Excel row N (S.No. N-1)" so the next
reader can find it either way. Getting this wrong is what credited the History
and Location traceability tabs to a row about a list page.

### Age at Entry Weeks is computed whenever DOB is known
*Asked 2026-09-08, from TDD tracker Excel row 12 (S.No. 11).*

The two documents specify different triggers. The tracker says "auto computed
as per DOB of BORN ON FARM animals and MANUAL ENTRY if animals are IMPORTED" —
keying off entry type. The Animal Register Master Template's column G says
"Computed from dob and entry_date. Manual entry if imported and DOB unknown" —
keying off whether a date of birth exists.

**Rishi chose the template's rule.** An imported animal that arrives with a
birth date should not have its age typed in when the dates already say it.

Consequences, all enforced in `resolveAgeAtEntryWeeks()`:

- A value supplied alongside a DOB is **discarded, not merged**. A row holding
  both a DOB and a contradicting age has no reading that is true.
- A DOB after the entry date is a 400, not a zero. The animal cannot have
  arrived before it was born, and silently flooring it hides bad data.
- Hand-typed ages are capped at 520 weeks. That is a **typo guard, not a client
  figure** — ten years is past any pig's productive life, so a larger number is
  a birth year typed into a weeks box. Computed ages are never capped: if the
  dates say the animal is older, the dates are the record.
- Animals with no DOB and no typed age stay NULL. The backfill leaves them and
  reports them rather than inventing a "typical" age.

The template's own example row contradicts itself here (DOB 2024-10-01, entry
2025-01-15 is ~15 weeks, but the example value is 3, and entry_type is
PURCHASED_IMPORTED with a DOB filled in anyway). Flagged, not followed.

### The History and Location traceability tabs are ours
*Decided 2026-09-08, replacing a false citation to the TDD tracker.*

No client document specifies them. Rishi specified them:

- **HISTORY** — columns LAST DATE / BATCH / CURRENT DATE / ENTRY NO. / STAGE.
  One row per **transition event**: LAST DATE is the previous move's date,
  CURRENT DATE is this move's, STAGE and BATCH are what was moved *into*, and
  ENTRY NO. is the source document's number.
- **LOCATION TRACEABILITY** — PURCHASE / OUTPUT / TRANSFER / MORTALITY / CULLS
  with a Location column.

Both read one append-only `animal_movement_log` rather than two tables, so the
two tabs cannot disagree about the same move. CULLS has no source — the cull
flow is not built and `dispose()` refuses CULLED — so it is **named as
unmodelled**, matching how Traceability already treats the Kill Sheet and DOA.
An empty card implies the record is merely missing.

Present the tabs as ours when talking to the client. They are a reasonable
reading of what a farm needs; they are not something Triple C has asked for in
writing.

### Parity counts completed pregnancies, post weaning
*TDD row 27, implemented 2026-09-07.*

A sow whose current litter is still on her has not reached that parity yet, so
her count is one behind the litter number. Rolled up onto the animal from the
farrowing records — BBP: "Parity incremented on weaning POST".

---

## Stages

### The stage master follows the TDD's names and the BBP's durations
*Decided 2026-09-08: "didn't we made the stages to be dynamic so just update them".*

TDD row 24 governs the vocabulary; §1.7 governs every duration and range. Ranges
stay ranges — no invented midpoint is presented as a client-approved figure.

- Renamed: `GILT_REARING→GILT_GROWER`, `DRY_PERIOD→DRY_SOW`,
  `SLAUGHTER→SLAUGHTERED`, `DISPOSED→DEAD`.
- Activated: `WEANING`, `BOAR_AI` (both already existed, switched off).
- Added: `PRODUCTIVE_SOW`, `CULLED`, `SOLD`.
- `BBP_STAGE_RENAMES` was inverted — it used to normalise GILT_GROWER *to*
  GILT_REARING, which would have undone this on the next alignment run.

### LACTATION and WEANING both stay
*Decided 2026-09-08.*

Lactation is a ~28-day period the BBP gives feed standards and a duration to;
weaning is the event that ends it. An event does not replace a period.
INSEMINATION is likewise kept although the TDD omits it — the blueprint
specifies it and the flush → gestation path runs through it.

### FLUSH_SERVICE and CB_GROWER stay inactive
*Decided 2026-09-08.*

Named in neither document. A disabled stage costs nothing; deleting one cannot
be undone if something ever referenced it.

---

## Company settings

### Settings is not a copy of the setup wizard
*Asked 2026-09-07: "the settings should not be the copy of the setup".*

The sections live in the console's own sub-sidebar, each is a route, and there
is no modal, no step wording and no Edit gate — the fields are simply there,
with `canEditCompany` gating them. Team Management was removed: settings is not
where people are managed, `/users` is.

The page H1 is the **section name**, matching the highlighted sub-sidebar item.
"Company settings" is the main-sidebar item, one level up.

### No "Back to All Companies" button
*Asked 2026-09-07: "when we are in a company scope and already have a switch to change the scope".*

The sidebar scope switcher already offers tenant scope ("Consolidated metrics &
all companies"), every company, and every operational area — on every screen. A
second, weaker way out of the scope is a control the user has to read before
ignoring.

---

## Finance

### Currency follows the company config; entries are in base currency
*Asked 2026-09-06.*

Residual value is a **rate that computes an amount**, not a stored figure, so
`breed_master.residual_value_pct` stays a rate. Exchange rates are a dated table
so a past period can be restated with the rate that applied at the time, and the
entry UI is company-scoped and lives in Finance.

---

## Deployment

### Windows test deployment keeps API and MySQL private behind the web origin
*Decided 2026-09-10.*

The initial Windows RDP test URL is `http://103.234.185.14:3002`. Next.js binds
explicitly to `0.0.0.0:3002`; browser requests remain same-origin under
`/api/v1` and Next proxies them to the API on `127.0.0.1:2877`. MySQL remains
local on 3306/33060. Only web port 3002 needs a NAVFarm inbound firewall rule.

Production startup does not share the generic `PORT` variable between apps.
The API production target runs the built Node entry directly, without Nx's
debug-by-default Node executor, and the web target passes its hostname and port
on the `next start` command line. Redis is not used and is not introduced for
deployment.

---

## Master data lookup controls

### Entity-backed selections use a searchable code/name lookup
*Decided 2026-09-10: "all for the selective fields we need a custom lookup popup with a search bar at top with a table below it with the name and code in 2 columns".*

Every `select-entity` field in the config-driven master-data forms opens the
same lookup dialog: search at the top, followed by Code and Name columns. This
also applies to entity selections inside editable JSON rows and to multi-value
entity fields. Fixed application choices such as status, Lot/Serial and other
enumerations remain compact selects or segmented controls because they are not
rows from a master and therefore do not have a code/name catalog to search.

### Location parent selection follows the immediate hierarchy level
*Decided 2026-09-10: "when level 1 then no parent location and when level n then only locations with level n-1".*

`parent_location_id` is the one canonical hierarchy link and `location_level`
continues to be derived by the API, never typed by the user. A root Location
Type (Farm/level 1) has an empty `allowed_parent_types` list, so its form does
not show Parent Location. A non-root type requires a parent and its searchable
lookup contains only locations whose type is configured as the immediately
preceding level: Shed offers Farms; Pen offers Sheds. Allowed Parent Types is
itself a searchable multi-select over Location Types, not a comma-separated
free-text field.

---

## Open — Triple C's to answer, not ours

| Question | Where it bites |
|---|---|
| Animal code prefix: `PIG-YYYY-SEQ` (TDD row 7 + Animal Register template) or `ANM-YYYY-NNNNN` (BBP §2.1)? | The number series, and every animal code already issued. |
| Does "weaning" mean the sow's event or the piglets' phase? | On the BBP's chain (Sow → Piglet Lot → Weaner Batch) the weaner phase belongs to a batch, not a sow. |
| Residual value: a percentage (our column) or a per-kg rate (Bio Asset BBP, 20 Aug MOM)? | Amortisation and disposal gain/loss. |
| Reporting currency: ZWL (§1.1 flowchart) or USD (§1.1 field spec)? | Every report. |
| ZWL or ZiG? | The currency master. |
| The 47 reason codes — 3 exist. Mortality alone is specified as 21. | Mortality, cull, return, scan-fail and selection entry screens. |
| Kill Sheet and DOA have **no tables**. The BBP gives the kill sheet a process (attached to the TO, carcass weights per line, invoice = Delivered Qty × Avg Carcass Weight × Price/KG) but no field specification. | Revenue, and the end of the traceability chain. |
| Location code format — the template says only "Unique code per tenant". | Our hierarchical scheme was an invention, and as of 2026-09-09 every seeded location carries it (`FARM-001/SHED-001/PEN-003`). If Triple C wants something else, the LOCATION series and `db-align-master-codes-to-series` are where it changes. |
| Is the cull flow in scope? Out-of-production date, cull date, reason, weight, write-off, and the 14-day INFO alert are all specified and none are built. | CULLED cannot be set anywhere today. |

---

## Demo data may be synthetic when it is clearly demo-only
*Decided 2026-09-10.*

The values written by the demo-only seed are not Triple C's production data.
Synthetic values are allowed there so that testers can exercise complete forms
and workflows before the client supplies its real records. They must remain
clearly identified as demo data, must not be copied into a production tenant,
and must not be described as client-provided facts or requirements. When Triple
C supplies real data, it replaces the synthetic dataset.

This does not weaken the standing rule against inventing client data: product
defaults, production seeds, migrations, and claims about Triple C still require
client evidence or Rishi's decision.
