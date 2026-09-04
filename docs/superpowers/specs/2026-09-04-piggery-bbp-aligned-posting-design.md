# Piggery: BBP-aligned master data, daily posting, and correction

**Status:** design, awaiting review.
**Supersedes:** [2026-09-02 first-class farm records design](2026-09-02-piggery-first-class-records-design.md),
whose data model survives and whose editing model does not. See §2.

---

## 1. Why this document exists

The 2026-09-02 design was written against the running system alone. The client's signed-off
Business Process Blueprint — *Triple-C_NAVFarm BBP1_V0.1_Final*, Triple C (Colcom Group),
Zimbabwe — specifies a different correction model, different stage durations, and master data
the codebase does not have. Where the BBP and the code disagree, the BBP wins: it is what the
customer reviewed.

This document records what changes, what survives, and what was measured rather than assumed.

### Three corrections to the record

**`farm_record` is schema-only.** Commit `4aaf6b9`, titled *"implement first-class farm records
design with editable transactions"*, added the `farm_record` and `farm_record_animal` tables,
migration `0049`, a nullable `record_id` on `batch_transaction`, and one schema guard test. It
added no service, no controller, no module and no UI. `grep -rln farmRecord` outside the schema
returns the schema file and its own spec. `record_id` appears in zero files under
`apps/api/src/modules`. The feature was not built.

**Recorded farm data is not editable.** Across `apps/api/src/modules/production`, the only
`@Put` endpoints are scheduler, qc-parameter, parameter and stage — all configuration. No
`@Patch` or `@Put` exists on any batch transaction.

**`navfarm-piggery-status.md` is stale.** It describes the records layer as designed but not
built, which was true on 2 September and is now wrong in a different direction: the tables
exist and nothing writes to them.

---

## 2. What survives from the 2026-09-02 design, and what does not

**Survives — the whole difficult part.** BBP §5 step 7 says *"Reversal creates equal and
opposite entries."* Against posted inventory and GL, that is precisely the machinery the
earlier design specified, and its three documented traps are unchanged:

- **§4.3 FIFO unwind.** A contra entry via `writePositiveEntry` doubles the stock. The correct
  reversal reads `inventory_application` rows, restores each `applied_qty` to its inbound
  layer's `remaining_quantity`, deletes the application rows, and writes a contra ledger row
  with `remaining_quantity = 0` — all in one `db.transaction`, with layer reads `.for('update')`.
- **§4.4 KPI alerts must be withdrawn.** `notification_alert_log` gains `voided_at` and
  `voided_reason`; a reversal voids the alerts its transactions raised.
- **§4.5 Bio-asset state cannot be reversed by arithmetic.** The `Math.max(0, nca − amount)`
  clamp is lossy. After reversal, recompute `nca_book_value` and `current_quantity` from
  `bio_asset_ledger`, which is append-only and authoritative.

Also surviving: `farm_record` / `farm_record_animal` as the grouping layer, the re-keyed
clinical detail tables, and the backfill of existing transactions.

**Does not survive — the editing model.** §4.1 of the earlier design specified a permission
matrix: supervisors edit same-day, admins edit any time on an open batch, narrative-only after
close. The BBP replaces this with a draft state. Before POST DAY nothing is posted, so a draft
is freely editable and no permission window is needed. After POST DAY the day is locked and
correction is an approval workflow, not a permission check. The matrix is deleted.

---

## 3. Sources and their authority

| Source | Authority | Notes |
|---|---|---|
| **BBP-1 v0.1 Final** (client, signed-off) | **Highest** | 18 sections. §1 masters, §5 daily entry, §6 gilt, §7 feed/silo, §11 inventory, §17 events/approvals read for this design. |
| Running codebase | Factual for *what is*, not for *what should be* | Every claim in §1 above was measured against it. |
| 2026-09-02 records design | Superseded except as noted in §2 | Its measurements of FIFO/bio-asset behaviour remain valid. |
| ChatGPT page-spec pack | **No authority** | Speculative. Its 126-route map describes procurement and sales subsystems that do not exist and are not in scope. Used only as a cross-check. |
| `rak docs/` spreadsheets and PDFs | **No authority** | Confirmed by the user on 2026-09-04 as half-finished working documents. Retained for reference only. Never cite them as a requirement, and never seed master data from them — the 47 reason codes and 32 KPI parameters must come from the BBP or from Triple C directly. |

**Authority order:** BBP-1 → the user's direct instruction → the running codebase → nothing else.

---

## 4. Decisions taken

1. **Scope is LVS_PIGGERY under NOB Livestock.** The other fifteen LOBs stay taxonomy-only.
2. **D365 Business Central integration is out of scope.** BBP §1.1, §5, §7.2 and §11 assume it.
   Consequences are recorded in §11 of this document.
3. **Pig Vision / Pig Expert integration is out of scope**, on the same basis.
4. **NOB and LOB move from the operational area to the Company**, per BBP §1.1.
5. **The operational-area layer is retained and mapped 1:1 to a farm.** The BBP has no name for
   this layer but requires the concept — §5's *"LOCATION TABS, one tab per batch location,
   farm → house level"* is a farm operator scoped to one farm. Deleting the layer would mean
   rebuilding farm-level scoping to satisfy §5. Chain becomes:
   `Company → Farm (= operational area) → House → Pen | Silo`.
6. **BBP stage durations are authoritative.** See §6.
7. **Silo stays a warehouse; the SILO location row is generated and locked to it.** See §7.
8. **Dairy is removed.** `production/milk`, `seed-greenfield-dairy.ts`, and the dairy branches
   in `layout.tsx`, `dashboard`, `batches/entry`, `livestock`, `settings/area`,
   `operational-areas`.
9. **Nothing is cut.** All seven entry blocks are built. The delivery date moves instead.
10. **Phases are independent.** Every phase ends with a usable application. See §8.

---

## 5. Master data: where it belongs

### Measured position today

All 37 `*_master` tables were parsed. Every tenant-side master carries **`tenant_id` +
`company_id`**. **No master is scoped to an operational area.** `role_master` alone deviates,
carrying `company_id` without `tenant_id`.

A tenant-wide convention exists but is applied inconsistently: services query
`or(eq(company_id, X), isNull(company_id))`, so `company_id IS NULL` means shared. It is
implemented in ten services — item, item-type, item-category, item-attribute, uom, breed,
location, stage, parameter, qc-parameter — and absent from twelve, including medicine, disease,
feed-formula, supplier, customer, resource, farm, shed and warehouse. That split encodes no
business rule: `location` can be shared while `shed` cannot, though they are the same physical
hierarchy; `breed` can be shared while `disease` cannot, though a disease is a fact about the
world.

**A scope-enforcement gap.** `roles.guard.ts` validates the `x-active-company-id` **header**
against `user_company_assignments`. Master services filter on the `companyId` **query
parameter**, which nothing validates. A Company-A user sending a valid header plus
`?companyId=<B>` reads Company B's masters; both are in the same tenant database, so the tenant
filter passes. When the console omits `companyId`, every company's masters are returned merged.
The guard's own comment acknowledges the wider issue: *"Client-supplied headers are otherwise
trusted at face value by every downstream handler."*

### The rule this design adopts

Scope by **who owns the meaning**, not by which column exists.

| Tier | Contents |
|---|---|
| **Platform** (shared across tenants) | NOB, LOB, country, currency, language, timezone, costing methods, plans. *Already correct.* |
| **Tenant** (all companies agree) | **Reason codes**, UOM + conversions, species, breed, breed lifecycle standards, stage master, animal categories, item types/categories/attributes, disease, medicine, KPI parameters. |
| **Company** (ledger-bound) | GL accounts, GL mapping, cost centres, number series, fiscal and currency config, suppliers, customers. |
| **Farm / operational area** | **Not master data.** Farm → House → Pen/Silo is operational structure, assigned rather than scoped. |

BBP §1.3 rules explicitly for one master: *"The Reason Master is a SINGLE shared master across
all 10 Triple C farms... Extensible by System Admin only."* That is tenant scope, admin-owned.

**For Triple C specifically this distinction is invisible.** BBP §1.1 names exactly one company
— *Triple C Farms (Pvt) Ltd* — and equates Company Code with "unique tenant ID". One tenant, one
company, ten farms. The scoping rule matters for NAVFarm as a multi-tenant product, not for this
customer. The risk runs the other way: building only to the BBP would bake in a single-company
assumption that the second customer breaks.

### Enforcement change

`companyId` must be derived from the validated `x-active-company-id` header, not accepted from
the query string. A guard test asserts that no master service reads a company scope the guard
did not validate.

---

## 6. Stage master reseed

BBP §1.7 specifies eight breeding stages. The code seeds eleven. This is not a contradiction to
reconcile downward: the BBP's eight are the sow/gilt breeding cycle, while §4 separately
describes *"21 Permanent Sow Batches (never close)"* and *"WG Closeable Batches"* — the
weaner/grower path the code's `CB_GROWER` and `SLAUGHTER` stages serve. Both sets are kept; the
breeding stages are corrected to the BBP.

| Code today | BBP §1.7 | Change |
|---|---|---|
| `QUARANTINE` 30 d | Wk1–4 (~28 d) | −2 d |
| `GILT_GROWER` 77 d | `GILT_REARING` Wk4–34 (~210 d) | **+133 d** |
| `FLUSH_SERVICE` 10 d | `FLUSH` 3–5 d **+** `INSEMINATION` 2 d | **split into two stages** |
| `DRY_SOW_GESTATION` 110 d | `DRY_PERIOD` 4–7 d **+** `GESTATION` 116 d | **split into two stages** |
| `FARROWING` 3 d | 2–4 d | within range |
| `LACTATION` 28 d | 28 d | none |
| `WEANING`, `BOAR_AI`, `CB_GROWER`, `SLAUGHTER`, `DISPOSED` | not in §1.7 | retained for the WG path |

**The gilt duration is corroborated.** BBP §6 tracks selection at Week 4 through first service
at Weeks 31–33 — about 29 weeks, or ~203 days. Two independent sections agree on ~210 and
disagree with 77.

**Gestation is 116 days.** `navfarm-piggery-status.md` uses 114 and `stage_master` uses 110.
116 is authoritative; the demo farm's genealogy and the breeding calendar move with it.

Downstream: `breed_lifecycle_stages` period ranges and feed rates, scheduler lines, KPI
thresholds, breeding calendar, demo genealogy.

---

## 7. Farm hierarchy and the silo

BBP §1.2 specifies four levels — **Farm → House → Pen → Silo** — and makes Farm Code the D365BC
Cost Centre Dimension.

The code already implements this shape: `farm_master` = Farm, `shed_master` = House, and
`location_master` = Pen *and* Silo, distinguished by `location_type`, with `location_level` and
`parent_location_id` for the tree. `location_master` carries 40 columns including pen fields
(`max_capacity`, `current_count`, `is_quarantine_zone`, `last_cleaned_date`,
`downtime_days_required`) and silo fields (`silo_capacity_kg`, `silo_reorder_days`,
`storage_type`).

**The real duplication is `warehouse_master` versus a `location_type = 'SILO'` row**, and it is
not cosmetic. Stock is keyed on `warehouse_id` — `notNull` on the inventory ledger, goods
receipt, goods issue, stock transfer and stock adjustment. Animals are keyed on `location_id`.
A silo holds feed, which is stock, so it must be a warehouse to hold anything and a location to
sit under a House.

**Superseded on 2026-09-05.** This section originally proposed keeping `warehouse_master` and a
`SILO` location as a generated, locked pair — deferring the unified model as "the better model
and the wrong time". The user approved the unified model instead, and it was implemented:

- **`location_master` is canonical** for Farm, Shed/House, Pen, Cage, Store, Quarantine and Silo.
- **`location_type_master`** (migration `0055`) makes the hierarchy data rather than code:
  `type_code`, a per-company `code_prefix`, and `allowed_parent_types` as JSON. This is the same
  move `stage_master` already makes for the lifecycle — a new level is a row, not a release.
- **`farm_master`, `shed_master` and `warehouse_master` are retained as a compatibility bridge**
  for operational APIs that still key on them. They are deliberately no longer creation choices
  in the console.

This satisfies BBP §1.2's four levels without hardcoding them, and generalises past the BBP:
Cage, Store and Quarantine are expressible without a schema change.

Silo-type locations gain the fields BBP §7 requires: BFT alert level (KG), Sunday reference
stock, and feed item.

### 7.1 External ERP reference, on every master

**Decided 2026-09-05.** Business Central is not connected and is not in scope, but the *capability*
is required, so it is built now and left available across **all** masters rather than retrofitted
per master later.

The problem it solves is concrete. BBP §1.2 states that **Farm Code IS the D365BC Cost Centre
Dimension** — Triple C's farms are `MUL`, `PRT`, `GRS`, `RCH` — validated against
`GET /dimensionValues`, and *"if not found: setup blocked"*. The console now generates immutable
per-company codes (`FARM-001`, `SUP-001`, `CUS-001`, `RES-001`), which would match no dimension
value in BC. Generated codes and external identity are therefore two different things and get two
different fields:

- **The master's own code** stays generated and immutable — stable, collision-free, and never
  reused.
- **An external ERP reference** carries the counterpart's identifier in the other system. For a
  farm-type location that is the BC cost-centre dimension value (`GRS`); for an item it is the BC
  item number; and so on.

Nothing reads the reference until an integration exists. It is a column, an optional field on the
master form, and nothing more — but it means connecting BC later is a mapping exercise rather than
a migration of every primary key the business already prints on paper.

---

## 8. Phasing

Every phase ends with a usable application. No phase leaves a subsystem half-built, so stopping
at any boundary is a legitimate delivery. Verification is inside each phase, not deferred to a
final one.

### Phase A — Master data · 6–8 d · no dependencies

- **Reason Code Master** — 47 codes: MORTALITY (21), CULL (10), RETURN (3), SELECTION (4),
  DISPOSAL (6), TRANSFER (3). Filtered by category *and* stage on data entry. Tenant-scoped,
  System-Admin-maintained.
- **Stage master reseed** per §6, and `breed_lifecycle_stages` realigned to the new stage set.
- **Animal Category master (10)** — GGP/GP/P × Imported/Local × M/F. Imported drives
  amortisation, local drives fair value (BBP §1.7).
- **KPI Parameter Master** — 32 parameters, including the parity distribution targets §6.2
  needs (P0 22%, P2 19%, P3 17%).
- **NOB/LOB moved to Company**; operational area mapped 1:1 to farm.
- **Silo/warehouse pairing** per §7, with BFT alert level and Sunday reference stock.
- **Company scope enforcement** per §5.
- **Dairy removal.**

*Stop here and you have:* today's application, working as it does now, on master data that
matches the client's blueprint. Reason codes usable immediately in existing mortality entry.

### Phase E — Demo farm · 4–5 d · needs A

Four generations over roughly two years. Written at transaction level initially and re-pointed
at the records service during Phase B.

**Shape:** one tenant, two companies, each with one piggery farm (= operational area). This
follows the demo requirement as stated, not the BBP, which names a single company — see the
open question in §10.5. Two companies is the more demanding shape: it exercises the company
scope boundary that a single-company seed would leave untested, and collapsing to one company
later is deletion rather than rework.

Reconciliation properties become tests, not prose: parity equals litter count; every born animal
traces to a farrowing; every farrowing to a mating **116 days** earlier; no animal lacks sire,
dam or DOB outside the founder generation. Herd structure follows §6.2's parity targets.

*Stop here and you have:* the above, showing data that looks like a real farm. This is the
earliest point the system demonstrates well.

### Phase B — Draft / Post / Lock · 8–10 d · needs A

Applied to the **existing** entry screen, so the discipline lands before the new console does.

- **`daily_posting`** — the unit POST DAY operates on: `(batch_id, location_id, posting_date)`,
  `status` (DRAFT / POSTED / REVERSED), the six head-count columns, `posted_at/by`, reversal
  link. Nothing today represents "a day on a location tab".
- **`farm_record` service** — grouping, `farm_record_animal`, clinical detail re-keyed,
  backfill of existing transactions. No schema change: the table already carries `status`,
  `version`, `supersedes_id`, `superseded_by_id`.
- **Record types extended** — add `CULL` (BBP §5 Block 4B is explicitly separate from
  mortality, per MOM 24 Aug), `STAGE_EVENT`, `TRANSFER`.
- **Three POST DAY gates**, all hard blocks:
  1. **Head-count balance**, per location tab:
     `Opening + Born + IN − Closing − Deaths − OUT = 0`. BBP §5 calls it *"ABSOLUTE and cannot
     be bypassed"*. Failing tabs render red with the exact expected-versus-actual difference.
  2. **Mandatory ONCE events complete** — vaccinations and scans due today.
  3. **Silo balance cannot go negative** (BBP §7.1) — POST DAY is blocked if the day's
     consumption would drive a silo below zero.
- **Silo system balance** — `Sunday Reference + Σ(receipts since Sunday) − Σ(POST DAY
  consumption since Sunday)`. Always labelled **SYSTEM BALANCE** in the UI, never "physical
  stock" (BBP §7.1 control point). BFT breach raises a first-priority alert carrying silo, item,
  balance and days of feed remaining.
- `POSTED_PENDING_ERP` is defined but unused, so adding D365BC later is a status, not a rewrite.

*Stop here and you have:* days that draft freely, must balance before posting, post atomically
across all blocks, then lock. A locked day cannot yet be corrected — inflexible, but safe.

### Phase C — Reversal · 5–6 d · needs B

Reversal Request → Farm Manager approval; Finance also approves if the period is closed
(BBP §5 step 7). Carried on the existing approvals module, which already has
`create / approve / reject / counts`. On approval, the §2 engine runs: FIFO unwind, alert
voiding, bio-asset recompute.

Refusals must name their blocker. A `BATCH_OUTPUT` reversal is refused when the output layer is
partly issued or when `qr_code_master.output_line_id` shows printed packs — *"3 packs printed
against this output"*, not a bare no.

*Stop here and you have:* a system that records, locks, and corrects. This is the first
genuinely production-usable state.

### Phase D — The seven entry blocks · 10–12 d · needs A, better after B

Single page: header strip, date navigator (7 days back, today default), location tabs, blocks,
right-hand summary panel with running balance and alerts, `SAVE DRAFT` and `POST DAY`.

**Each block ships independently.** The screen works with whatever blocks exist; a missing block
is an absent panel, not a broken page.

| Block | Content and rules |
|---|---|
| 1 Feed | Standard qty = head count × lifecycle feed rate; operator enters actual. Lot mandatory, FIFO enforced, deviation requires a reason. Bagged: Empty Bags × 50 KG reconciliation, flag variance > 2%. Bulk: silo balance check. Cumulative KG/pig for FCR. |
| 2 Medicine | FEFO enforced, expired lots shown red and unselectable, withdrawal-days banner, OTC flag, CRITICAL block if slaughter falls inside withdrawal. Dose pre-filled from vaccination protocol; lot recorded. |
| 3 Weight & BCS | Individual per tattoo for gilts (vs target, RAG); group for weaners/growers (average + ≥10% sample). BCS 1–5 at farrowing and weaning; backfat mm. **Head count entered here — feeds gate 1.** |
| 4A Mortality | Reason (MORTALITY only), tattoo mandatory for sow/gilt/boar, weight at death mandatory, age auto from DOB, week of life, notes mandatory when reason is OTHER/UNKNOWN/MULTIPLE, disposal destination. RATION PIG sub-type routes to Farm Butchery and is classified separately. |
| 4B Cull | Separate from mortality. Tattoo, **Out-of-Production Date** and **Cull Date** (may differ), reason (CULL only), weight, HSE, weaning data at last litter, service line flag. Cost = feed consumed between the two dates × daily rate. |
| 5 Stage event | Varies by stage. Gestation day-28 scan CONFIRMED/REPEAT/FAILED (mandatory ONCE). Farrowing per-sow: **`Total Born = BA + BD + GA` hard block**. Weaning counts and weights. Gilt Week 25/28 ONCE events. |
| 6 Transfer | IN / OUT / INTERNAL, source and destination batch and location, head count, average weight, lot. **Hard block on a slaughter transfer while any medicine withdrawal is incomplete.** |
| 7 Overhead | Electricity (KWH), water (litres), labour (hours × rate), disinfection, other. USD. Water per pig auto-calculated. Posted as GL journal with farm dimension. |

Gilt lifecycle (BBP §6) is carried by Blocks 3 and 5: checkpoint weeks 10/15/16/19/21/23/25/28,
Week 25 processing, Week 28 service decision (READY / NOT_YET / CULL). Two control points bind
the animal register: **teat count < 15 is a hard block at selection**, and **status stays GILT
until first farrow** — not first service — at which point parity becomes 1. Parity is
auto-incremented on each weaning POST and cannot be edited manually.

*Stop here and you have:* the complete daily entry screen as specified.

---

## 9. Estimates

| Phase | Estimate | Depends on |
|---|---|---|
| A — Master data | 6–8 d | — |
| E — Demo farm | 4–5 d | A |
| B — Draft / Post / Lock | 8–10 d | A |
| C — Reversal | 5–6 d | B |
| D — Seven blocks | 10–12 d | A (better after B) |
| **Total** | **33–41 d** | |

Roughly **7–8.5 weeks** for one developer familiar with this codebase, verification included.

**A + B + C is 19–24 days** and is the first production-usable state, which is close to the
original three-to-four-week window. D and E are enrichment beyond it.

Independence costs about two to three days: Phase B lands posting on the current screen and
Phase D then rebuilds that screen. That is the price of never being caught mid-subsystem.

**Where slippage would come from:** Phase C. It touches the FIFO ledger, the GL, bio-asset state
and KPI alerts, and its three traps are documented rather than solved. Phase D is large but
low-risk, because each block is independent.

---

## 10. Open questions

1. **No Reversal Request row exists in the BBP's approval matrix.** §17.2 lists seventeen
   actions and reversal is not among them, though §5 step 7 and §17's summary both promise a
   reversal workflow. This design builds §5's rule — Farm Manager, plus Finance when the period
   is closed — and flags it as unconfirmed.
2. **The BBP's own farm count disagrees with its own list.** §1.2 says "10 farms" and names
   eleven.
3. **§17.2's matrix is incomplete as extracted** — the "Service Requisition < $200" row has no
   submitter or approver.
4. **Period close is referenced but not defined.** §17's summary names a "Period close gate";
   no section read so far specifies what closes a period or who does it. Phase C needs this,
   because Finance approval on a reversal is conditional on it.
5. **How many companies does Triple C have?** BBP §1.1 names one — *Triple C Farms (Pvt) Ltd* —
   and equates Company Code with "unique tenant ID". The demo shape requested is two companies.
   Phase E builds two; if the answer is one, the second is deleted rather than rebuilt. Worth
   confirming before Phase E, since it also determines whether the company-scope enforcement in
   Phase A is exercised by anything real.

---

## 11. Out of scope, and what that costs

- **D365 Business Central.** BBP §1.1 blocks company setup until `GET /companies` succeeds;
  §1.2 blocks farm setup unless the farm code validates against `GET /dimensionValues`; §7.2
  routes requisitions to BC to create POs; §11 requires every NAVFarm inventory movement to have
  a BC counterpart, reconciled monthly by report R18. None of this is built and none is planned
  here. The schema keeps a `d365bc_entry_ref` column and the `POSTED_PENDING_ERP` status so the
  integration is additive later.
- **Pig Vision / Pig Expert.** Named in §1.1 and §5 step 6.
- **BBP §8 GRN & Procurement, §9 Logistics & Vehicle Management, §10 Transfer Order & DOA.**
  No procurement or sales module exists: across the API the entire vocabulary
  (`requisition|purchase_order|sales_order|delivery_note|invoice`) matches one DTO filename.
- **§11's five journal types.** Positive/negative adjustment and physical inventory journal,
  with their approval thresholds, are not built. `stock_adjustment` exists but does not
  distinguish the types or enforce the thresholds.
- **The other fifteen lines of business.**
- **The mobile app.** `apps/mobile` is a single `main.dart`.

---

## 12. Testing

Cross-boundary guard tests, following the pattern that caught the roles/permissions and sidebar
drift — each reads both sides and fails when they diverge:

- Reason codes referenced by any entry block exist in `reason_code_master`.
- Every seeded stage in `stage_master` has matching `breed_lifecycle_stages` coverage.
- No master service reads a company scope the guard did not validate.
- A SILO location and its warehouse are one-to-one.
- No LOB other than `LVS_PIGGERY` seeds stages, items, breeds or parameters.
- No writer emits a bio-asset entry type the roll-forward cannot classify (existing).

Behavioural tests for the three gates, and for reversal: reverse a consumption and assert the
stock balance returns exactly to its prior value; assert batch close still reconciles to ₹0.01
after an edit; assert a reversed transaction's KPI alerts are voided.
