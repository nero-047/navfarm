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
| Location code format — the template says only "Unique code per tenant". | Our hierarchical scheme was an invention. |
| Is the cull flow in scope? Out-of-production date, cull date, reason, weight, write-off, and the 14-day INFO alert are all specified and none are built. | CULLED cannot be set anywhere today. |
