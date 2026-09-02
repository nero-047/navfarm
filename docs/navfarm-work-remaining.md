# NAVFarm Piggery — Work Remaining

**Created 2 September 2026.** Everything still to be built to make piggery feature-complete,
with estimates. Tick items off as they land.

**Estimates are developer-days for one developer familiar with this codebase.** They assume no
parallel workstreams. They are projections, not commitments — see *Where the risk is* at the end.

**Decisions already taken:** design approved; resource maintenance UI is in; reopen-batch and
out-of-batch records are out of this phase.

**Design of record:** [first-class records design](superpowers/specs/2026-09-02-piggery-first-class-records-design.md)

---

## Phase 1 — Records: data model (2 days)

The schema the rest of the phase hangs off. Nothing user-visible lands here.

| # | Task | Est. | Notes |
|---|---|---|---|
| 1.1 | `farm_record` + `farm_record_animal` tables and migration | 0.5 d | FK names must be explicit and under 64 chars — Drizzle's derived names exceed MySQL's limit and already broke migration 0049 once |
| 1.2 | Re-key `batch_mortality_detail` / `batch_treatment_detail` from `transaction_id` to `record_id` | 0.5 d | Same columns, same cascade; a treatment for 12 animals then carries one diagnosis rather than 12 copies |
| 1.3 | `batch_transaction.record_id` + backfill the 307 existing rows into one-row records | 1 d | After this every transaction has a record, so the console needs no legacy branch and the remarks-parsing fallback can be deleted |

- [x] 1.1 Tables and migration — migration 0051, applied to both tenant DBs
- [ ] 1.2 Clinical detail re-keyed
- [ ] 1.3 `record_id` and backfill

## Phase 2 — Records: the write and reversal engine (5–6.5 days)

The riskiest work in the programme. Three traps are already documented and each would be a
silent data bug rather than a crash.

| # | Task | Est. | Notes |
|---|---|---|---|
| 2.1 | `InventoryLedgerService.reverseEntry(ledgerId)` | 1–1.5 d | Must unwind `inventory_application` rows and restore layer `remaining_quantity`. A contra `writePositiveEntry` **doubles the stock** — verified |
| 2.2 | `FarmRecordService.create` — record → transactions, batch or selected animals | 1–1.5 d | Relocates `addTransaction`'s existing per-type behaviour behind the record |
| 2.3 | `canEdit` returning `{ financial, narrative }` | 0.5 d | Not a boolean: admins keep narrative edits on a closed batch, never the numbers |
| 2.4 | Edit flow — supersede, reverse, repost, audit, all in one transaction | 1.5–2 d | Includes the narrative-only light path that skips ledger, journal, alerts entirely |
| 2.5 | Withdraw KPI alerts on reversal | 0.5 d | Needs `voided_at` / `voided_reason` on `notification_alert_log`; without this a corrected typo leaves its alarm ringing forever |
| 2.6 | Recompute bio-asset state from the ledger after reversal | 0.5–1 d | The `Math.max(0, …)` clamp is lossy — inverting it produces a wrong carrying value |

- [ ] 2.1 `reverseEntry`
- [ ] 2.2 Record create path
- [ ] 2.3 `canEdit` field classes
- [ ] 2.4 Edit flow
- [ ] 2.5 KPI alert withdrawal
- [ ] 2.6 Bio-asset recompute

## Phase 3 — Records: API (1 day)

| # | Task | Est. | Notes |
|---|---|---|---|
| 3.1 | Six endpoints, DTOs, permissions; keep `POST /batch/:id/transaction` delegating | 1 d | Every query param must be declared — the global `forbidNonWhitelisted` pipe 400s the whole request otherwise |

- [ ] 3.1 `/farm-record` endpoints

## Phase 4 — Records: console (4–5 days)

| # | Task | Est. | Notes |
|---|---|---|---|
| 4.1 | Data entry rebuilt on records — all six types, whole batch or selected animals | 2–2.5 d | `OVERHEAD` disables the animal selector rather than hiding it |
| 4.2 | Records editable in place, driven by `can-edit` | 1.5 d | Locked *inputs* disabled with the reason shown, never an absent button |
| 4.3 | Translation keys across all 8 locales | 0.5 d | |
| 4.4 | Guard test: every record type reachable, edit state reflected | 0.5 d | |

- [ ] 4.1 Data entry
- [ ] 4.2 Records editing
- [ ] 4.3 i18n
- [ ] 4.4 Guard test

## Phase 5 — The demo farm (3–4 days)

Today: 39 animals, **zero sires, zero dams, zero dates of birth**, sows carrying parity numbers
with no litters behind them.

| # | Task | Est. | Notes |
|---|---|---|---|
| 5.1 | Four generations, ~2 years, ~200 animals with real lineage | 2–2.5 d | F0 founders imported, F1–F3 born on farm with real `dam_animal_id` / `sire_animal_id` / `dob` |
| 5.2 | Make the numbers reconcile | 1–1.5 d | Parity equals litter count; every birth traces to a farrowing; every farrowing to a mating ~114 days earlier; gilts enter the herd at ~230 days |

- [ ] 5.1 Four generations
- [ ] 5.2 Reconciling numbers

Written through the records path so the seed exercises what users exercise.

## Phase 6 — Small gaps (3.5–4 days)

Independent of everything above; can be done at any point.

| # | Task | Est. | Notes |
|---|---|---|---|
| 6.1 | Delete `GET /role/assignments/{userId}` | 0.25 d | Redundant — the users page already receives each user's role |
| 6.2 | Wire `GET /scheduler/suggest-lines` into the scheduler creator | 1.25–1.5 d | Proposes lines from breed lifecycle standards instead of building every line by hand |
| 6.3 | Resource maintenance UI | 2 d | Five endpoints with no screen at all; nested under a resource so it does not fit the config-driven master-data pattern |

- [ ] 6.1 Delete redundant endpoint
- [ ] 6.2 `suggest-lines`
- [ ] 6.3 Maintenance UI

## Phase 7 — Verification and documentation (2–3 days)

| # | Task | Est. | Notes |
|---|---|---|---|
| 7.1 | End-to-end pass: create → edit → verify ledger, journals, alerts and bio-asset state all reconcile | 1–1.5 d | Including that `close()` still reconciles on a batch whose records were edited |
| 7.2 | Refresh the operations guide and status doc, regenerate PDFs | 1–1.5 d | |

- [ ] 7.1 End-to-end verification
- [ ] 7.2 Documentation

---

## Totals

| Phase | Estimate |
|---|---|
| 1 — Data model | 2 d |
| 2 — Write and reversal engine | 5–6.5 d |
| 3 — API | 1 d |
| 4 — Console | 4–5 d |
| 5 — Demo farm | 3–4 d |
| 6 — Small gaps | 3.5–4 d |
| 7 — Verification and docs | 2–3 d |
| **Total** | **20.5–25.5 d** |

At five working days a week that is **roughly four to five weeks**.

This refines the earlier 18–24 day figure upward slightly, because that one folded the
maintenance UI into a smaller "small gaps" allowance before I found it has no UI at all rather
than merely missing edit and delete.

## Out of scope this phase

Agreed as deferred, listed so they are not forgotten:

- **Reopen-batch** (~4–5 d). Until it exists, a wrong *number* on a closed batch stays wrong;
  admins can still correct the narrative.
- **Records for animals outside a batch** (~2–3 d). A death in the breeding herd with no batch
  has nowhere to go. The new multi-generation seed will have disposed and replacement stock,
  which is where this starts to bite — worth revisiting after Phase 5.
- The other fifteen lines of business, and the mobile app.

## Where the risk is

Phase 2 is the only part with real unknowns, and it is why the range is a range. It touches
costing, the inventory ledger, the general ledger, KPI alerts and bio-asset state at once. The
three traps in it are understood and written down — FIFO reversal that must unwind applications
rather than post a contra entry, alerts that must be withdrawn, and bio-asset state that must be
recomputed rather than inverted — but they are where slippage would come from.

Everything else is well-understood work on patterns that already exist in the codebase.
