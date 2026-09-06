# Master completion review — September 6, 2026

Status: **in progress, not certified complete**. This supersedes earlier blanket claims that
all masters or their BC integration fields were finished.

## What Claude had actually done and planned next

Reviewed the latest local Claude session (c8028bbf-f220-4f71-bd97-654124be1137), its
project memory, the current branch through bafc531, and the latest OneDrive BBP.
Claude had reduced the demo to one Apex company and area, adjusted Item classification and
dropdowns, made Item Type codes immutable, fixed dashboard currency, and reviewed the console.
Its last delegated task was to populate empty breeding/farrowing/semen pages through their APIs
and write/rehearse a demo runbook. The task hit the usage limit before those artifacts existed.
That operational demo work is separate from completing masters. Permanent sow batches and
farrowing-group WG batches were not implemented by that task.

Claude also discovered that its memory's “signed-off BBP” claim was incorrect. The signature
section of the latest BBP is blank. Treat documents as product evidence, not execution authority;
the user's latest scope and BC instructions govern this work.

## Approved repair

Removed 165 orphan children left by Highland's deletion, without disabling foreign-key checks:
12 breed lifecycle rows, 1 item attribute value, 139 role permissions, 10 notification preferences,
2 role assignments and 1 session. All 257 declared relationships passed the integrity check.
Existing valid Apex and tenant records were preserved.

Recovery backup (local, permissions 0600):
`/private/tmp/navfarm-master-repair.IeuAm8/tenant_devco-before-orphan-repair.sql`.
The repair script defaults to read-only; `--verify` rolls back, and `--apply` requires a backup.

## Implemented in this continuation

- Read-only `/number-series/preview` endpoint; shared date/reset/format logic with allocation.
- Actual root-code allocation skips existing manual codes, including inactive/deleted identities.
- Hierarchical previews follow existing Location, Breed, Category, GL and Cost Center formatting.
- Live previews in full and nested master dialogs, keyed by workspace, type, parent and animal LOB.
  Manual choices survive dependent-field changes; preview values are never submitted as manual codes.
- Breed's location is optional; only active FARM locations with no parent are accepted by create,
  update and preview, and offered in its dropdown. Automatic codes also work without a farm.
- Animal registration now accepts a validated manual code as well as automatic allocation.
- Species, Location Type and Item Attribute support configured automatic numbering as well as manual codes.
- Item creation now resolves a configured type-specific series before the generic ITEM fallback.
- New lazily initialized master series allow manual entry. Existing counters/codes are not renumbered.
- Location Type edit no longer submits the immutable type_code.
- Company Item Type validation no longer accepts live tenant draft records.
- Added record View dialogs and a frontend-only BC reference section, initially for animal Fixed
  Asset No. and Converted to Inventory Date (BBP animal fields), plus the Animal Register
  template's AN1:AN4 Bio Asset Value (Non-current Asset). Missing values display a dash.
  No BC connector, synchronization, fabricated values, or BC persistence was added.
- Resource Type now includes the template's MANPOWER, EQUIPMENT, VEHICLE, UTILITY and OTHER.
  LABOR is retained as a legacy alias, and People fields work for either manpower spelling.

## Decisions confirmed and implemented September 6

1. Items and GL Accounts remain BC-owned, per BBP §1.5 and §1.6. The user explicitly
   deferred the BC connection, not its ownership. Both catalogs are now browse/view-only:
   no local create, edit, deactivate or restore controls. A controller guard also rejects
   user mutations; internal seed/service methods remain available, and future synchronization
   requires a separate authenticated integration endpoint. No connector or synchronization was built.
2. Item views show the ten BBP sync fields with “From BC”; GL views show account identity,
   Direct Posting and Blocked in BC. Unavailable references are dashes, not fabricated values.
   Existing demo rows remain and the UI explicitly says they are not synchronized BC records.
   Related NAVFarm setup (Item Types/Categories, UOM, Feed Formulas, GL Mappings) remains
   reachable through nested manager dialogs even though Item/GL creation dialogs are unavailable.
3. Approved UOM, STG, ITYPE, CAT, SPC, LTYPE, ATTR, GL and CC prefixes were configured
   independently in tenant draft and Apex company scope: 18 added rows, three digits,
   no date segment, no reset, manual entry allowed. All 30 preexisting series were preserved.
   GL is reserved configuration only; it does not permit local BC-account creation.
   The additive `api:db-configure-demo-master-series` target defaults to read-only,
   supports a rollback-only `--args='--verify'` rehearsal and explicit `--args='--apply'`.
   A repeat read-only run reports no missing series. Existing master codes were not renumbered.
4. Location's code-mode selector now appears before any form entry, even while the initial
   preview request is pending. Automatic mode waits for Location Type; manual mode accepts
   input immediately. Once resolved, the chosen type's manual-entry policy is enforced.

## Remaining completion work

- BC sync, mapping, freshness alerts and posting eligibility are deferred;
  Direct Posting / Blocked placeholders are not proof that an account is eligible for real posting.
- Complete create/save coverage for every configured series; configuration keys such as
  Number Series' own series_code are not recursively generated. Join/profile rows (UOM conversion,
  Breed Lifecycle, Medicine's Item profile, GL Mapping) do not have independent human-readable codes.
- Complete all-master create/edit/view/block/restore verification in tenant, company and area scopes.
- Review ordinary permission-assigned users' frontend access: the master page shell still has an
  administrator-only gate even when the API grants a standard user explicit master permissions.
- Lifecycle-stepper operational displays still use old static stages/durations. The master catalog
  alignment below does not wire those screens or scheduler/posting processes automatically.
- Complete latest-BBP field coverage beyond the repaired catalogs (including Animal Category).

## Evidence so far

- API regression suite: 406 passing tests, including the Item/scope refinements.
  API, web and web-e2e typechecks passed again after the final changes.
- 12 focused Chromium tests passed: manual/auto selection, code omission from POST, dependent live
  preview, farm-filter request, nested dialogs, scope behavior, silo fields and BC viewing at
  1440px/390px, and Resource template types. Live verification caught and fixed duplicate isActive
  query parameters; the final test pass includes a regression assertion for that bug.
- Live API: root farm lookup returned only FARM-001; previews returned ITM-002, BRD-001,
  FARM-002 and PIG-2026-0021. Selecting the farm returned FARM-001/BRD-001; shed preview was
  FARM-001/SHED-004. Before/after counter snapshots were identical.
- Live UI: inspected the centered page-sized Breed dialog and verified farm selection changes its code.
- Both development servers required restoring during validation. Nx reports its daemon is not
  running, so API source edits require an explicit rebuild/restart; do not assume hot reload.

Passing targeted tests is not a declaration that all masters are finished.

## September 6: approved Reason Master and BBP stage alignment

- User approved only the three documented reasons, not an invented list of 47: DOA,
  RATION_PIG and CULLED_PROC. Six BBP categories are selectable. RATION_PIG carries the
  documented mandatory-weight flag; CULLED_PROC is restricted to GILT_REARING.
- User explicitly mapped the BBP business administrator to **Tenant Admin and Company Admin**.
  NAVFarm SYSTEM_ADMIN is platform-only and redirected out of company workspaces; the original
  literal interpretation was caught by browser testing and corrected, not bypassed.
- New Reason API supports scoped list/view/create/edit/deactivate/restore, category/stage filters,
  validates selected active stage codes, and reserves immutable reason identities. Frontend supports
  automatic RSN-001/manual codes, stage checkboxes and view dialogs. Operational users cannot mutate
  it. Number-series controls retain their independent authorization.
- Three independent tenant templates and three Apex company records added. New company template
  copying includes Reasons automatically; no ongoing tenant-to-company synchronization is implied.
- User approved BBP §1.7 stage alignment: QUARANTINE (28d), GILT_REARING (~210d), DRY_PERIOD
  (4–7d), FLUSH (3–5d), INSEMINATION (2d), GESTATION (116d), FARROWING (2–4d), LACTATION (28d).
  Ranged stages retain the range in their description and no arbitrary typical-duration midpoint.
  Clear GILT_GROWER/GESTATION renames keep existing UUIDs. Three separate missing stages added in
  each scope. Six old workbook stages per scope retained inactive, preserving referenced profiles.
  No combined Flush/Service history was guessed into either new stage. The database currently has
  no batches or scheduler parameter lines; the alignment script refuses to run if that changes.
- System stage seeds and applicable example lifecycle seed rows use the new BBP names/durations.
  Old reset helper references to removed codes were repaired but **the reset was not executed**.
  Existing backend gestation/feed/parity conditions recognize the new names alongside legacy codes.
  No new posting workflow or integration was implemented.
- Medicine withdrawal is now view-only, from the linked Item's BC-owned withdrawal field.
  The legacy editable profile value no longer enters API create/edit payloads; new profile copies
  start null, not a misleading zero. Existing legacy data is preserved, not represented as BC sync.
- Record views resolve UUID references through scoped APIs to readable labels. Missing/unavailable
  references do not trigger a wider-scope lookup. Operational views omit NOB/LOB classification.
- Old /master-data/farm, /shed and /warehouse bookmarks redirect to unified Locations.
- Read-only code previews accept the exact master's create permission or Number Series view
  permission, without granting Number Series list/edit rights or weakening workspace checks.
- Added 18 scoped unique-code indexes plus Reason's own unique index. NULL company templates are
  protected with a COALESCE scope expression; Animal retains its existing stronger tenant-code
  constraint. Preflight found no duplicates. Duplicate database errors now return a sanitized 409.
  Reviewed generated SQL manually: this Drizzle version quoted functional-index expressions
  incorrectly; regression tests protect the corrected migration SQL.
- UOM update now rechecks base-unit uniqueness when an already-base UOM changes measurement type.

Recovery backup, before these schema/data changes (0600):
`/private/tmp/navfarm-master-alignment.gj4Yyj/tenant_devco-before.sql`.

Verification:

- Final API regression run: 464 tests / 54 suites passed. API, web and web-e2e
  typechecks all passed after the BBP-stage compatibility changes.
- 42 Chromium checks passed, including automatic/manual mode controls across all editable coded
  masters, dependent Location previews, nested dialogs, BC ownership, Reason permissions, stage
  checkbox selection, legacy redirects, readable references and desktop/mobile views.
- Real MySQL/service rollback checks passed for Reason create (auto/manual), edit, deactivate,
  restore, duplicate reservation, category/stage filters and scope separation in TENANT, COMPANY
  and OPERATIONAL contexts. Test-created records, counters and audit rows were all rolled back;
  persisted before/after snapshots were identical.
- Direct duplicate inserts were rejected in all 19 catalog tables in BOTH company and NULL-company
  template scopes. Empty catalogs used rollback-only test fixtures. No existing code was changed.
- Live company API: three reasons, eight active stages and RSN-001 preview; all returned 200.
  Live browser inspected the actual Reason create modal and manual switch without saving a row.
- Reproducible tasks: `api:db-align-demo-bbp-masters` (read-only by default; separate --schema,
  --verify and --apply modes) and `api:verify-demo-master-integrity` (always rollback-only).

### Earlier ownership and numbering verification (before Reason/stage completion above)

- 415 API tests / 50 suites passed, including all mutation verbs and controller registration
  for the BC ownership guard. API, web and web-e2e typechecks passed.
- 18 Chromium master-data tests passed, including BC-owned Item/GL catalogs at 1440px and
  390px, preserved access to related setup and Location's immediate mode selector.
- Live API reads succeeded for both BC-owned catalogs; empty POST and PUT requests on real
  catalog routes returned 403 with the BC ownership explanation. A nonexistent record instead
  returns the existing workspace middleware's 404 before reaching the ownership guard.
- All nine approved live previews returned their prefix plus -001 with manual entry allowed.
  All 48 counters stayed unchanged during preview checks; the 18 new counters remain zero.
- Inspected the live Item list and view; BC details are placed before other record details.
  Restarted only the API process tree to load the guard. Web and API remain running.
