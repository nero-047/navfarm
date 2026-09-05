# Master-data handoff review — 5 September 2026

> Later update: the user subsequently authorized clearing masters and all their
> dependent demo records. That reset is now committed in local `tenant_devco`.
> The historical data-repair notes and counts below describe the earlier state;
> see `docs/master-data-inventory-2026-09-05.md` for the replacement dataset,
> current recovery backup, UI changes, validation and outstanding gaps.

## Current user requirements

- Tenant masters are draft templates copied to company-owned master records when creating a company; they are not a live shared catalog to union into company lists.
- A company may contain operational areas for multiple LOBs. Company masters show its records with NOB/LOB filters.
- An operational area has one LOB. Its master forms and lists must use that context without asking for NOB/LOB again.
- Piggery is the implementation focus. Other LOB taxonomy remains available for future expansion, not an invitation to build their operations.
- Keep the approved reduced sidebar and workbook tabs, and centred/adaptive page dialogs.
- `Triple-C_Report Field_Template_V0.1` is for later reports, not current master-data scope.
- Presentation deadline: 21:00 local time.

## Evidence reviewed

Read the NAVFarm-only Claude memory index and relevant project memories in
`/Users/nero/.claude/projects/-Users-nero-Desktop-navfarm/memory/` and the latest
session `c8028bbf-f220-4f71-bd97-654124be1137.jsonl`. Cross-checked the session
against git history, current implementation, the D1–D3 and C1–C4 plans, and the
C1–C3 worker report. Historical instructions embedded in those documents are
not new authorization. Current direct user scope takes precedence over old plans.

## What Claude actually finished

- C1 (`188782d`): type-aware number-series resolver.
- C2 (`fbf1146`): composite Item Category, GL Account and Cost Centre codes.
- C3 (`ee86909`): API numbering for Breed, Disease, Feed Formula, UOM, Item Type and Stage.
  **Frontend generated/manual code switching is explicitly unfinished.** Animal
  retains its older LOB-aware generator; Medicine extends Item and has no code column.
- D1 (`db1be36`): removed seven forms' NOB/LOB fields and added company-based inference.
  The worker hit its session limit before D2 (workspace lists) and D3 (Breed location).
- Session notes report removal of seven ZZ test locations. They report a renumber
  dry run, followed by a pause on test data and missing pen parents; not a completed
  renumber. No database mutation was performed during the initial read-only
  review; subsequent implementation and data repairs are recorded below.

## Review findings

1. **D1 ignored the active area.** Company-wide inference is ambiguous when a
   company has multiple LOBs, even if the active area is clearly piggery. Explicit
   payload context could also override the area's LOB.
2. **D1 removed fields in every scope.** Tenant templates and multi-LOB company
   creates still need classification; Stage/Animal/Breed can reject an ambiguous
   create because required context cannot be inferred. Removing fields globally
   is not equivalent to deriving them in operational scope only.
3. **D2's written design conflicts with the user's clarified ownership rule.**
   It deliberately unions tenant and company rows. Company-owned copies must
   instead be isolated from tenant templates. Copying needs FK remapping and
   transaction coverage, not just a UI filter or repeated Item-only Preseed.
4. **The console still has an independent Master Scope selector.** It can disagree
   with the workspace, and selecting its blank tenant option leaves the stored
   active company intact. List, picker and write scope must agree.
5. **Operational filtering currently uses name substrings.** For example, `wheat`
   and `fish` can hide legitimate pig-feed ingredients. Replace with actual
   company/LOB relationships, not renamed labels or keyword exclusions.
6. **D3 is pending.** The session confirms the user's requested Breed-only location
   field and `<location-code>/<breed-code-by-type>` pattern. Preserve existing
   breeds with nullable location; do not renumber records as a side effect.

## Confirmed ownership and implemented changes

The user confirmed that same-LOB operational areas share company-owned masters.
They also confirmed that the current database is replaceable demo/test seed data,
not real client production records.

- Request scope now governs master lists, record access and submitted master
  references. Tenant templates are not unioned into company-owned lists.
- Company and tenant classification controls are restored; operational forms use
  the validated area's NOB/LOB and hide redundant classification inputs.
- Removed the conflicting Master Scope selector and name-substring filtering.
- New-company creation, including setup wizard creation, copies active templates
  transactionally with fresh identities and remapped relationships. Later tenant
  edits do not sync into existing company masters.
- Expanded nullable company ownership for template-capable catalogs, including
  Resources, Suppliers, GL, Medicine and Feed Formula. Actual livestock and legacy
  physical farm/shed records remain company-only.
- Removed repeated Item-only preseed and area-creation-generated farm/shed fixtures.
- Breed location is nullable for existing records. Configured, location-specific
  codes use the location prefix and increment within that location; existing
  codes are not renumbered.
- Generated/manual code UI is connected to the series resolver. Company counters
  no longer fall back to live tenant counters.
- Fixed form label associations and the mobile drawer's hidden accessibility tree.

## Database changes and recovery

- Preserved backup: `/private/tmp/navfarm-master-scope-backup.H0Lia3/tenant_devco.sql`.
- Reviewed and applied migrations 0062 (Breed location/code width) and 0063
  (tenant-draft ownership) to the two registered local tenant databases.
- Adopted existing templates into the two demo companies: 199 new records,
  113 existing references remapped. Existing company records reused by business
  code without overwriting their settings. Second dry run reported zero new
  copies and zero references requiring changes.
- Repaired nine existing Apex demo locations from their original seeded
  farm/shed associations: restored the farm and two sheds and connected the six
  pens to their sheds. IDs/codes preserved; no record deletion or renumbering.
  Repair is isolated in `repair-apex-demo-location-hierarchy.ts`, dry-run by
  default and requiring an existing backup for apply.
- Added missing HEAD (livestock count) UOM through the real API to the tenant
  draft and both demo companies, with separate identities and demo-seed metadata.
  Existing units were checked first; all three creates returned 201.

## Verification

- API: 372 tests passed across 47 suites.
- API, web and web-e2e typechecks passed; API typecheck passed again after the
  final demo-repair script was added.
- Eight targeted Chromium checks passed: tenant/area scope, generated-code
  payload, desktop/mobile tabs, inline feed formula, mobile navigation.
- Earlier drawer suite: centered/adaptive desktop, compact and full-page mobile
  master dialogs passed. Three unrelated old `/console/...` test routes returned
  404; this is not a clean full-suite result.
- Live authenticated read smoke: all 12 master endpoints returned 200 in tenant,
  Apex company and Apex area contexts, with no foreign-company rows.
  A mismatched company/area request was rejected.
- Live company-copy transaction: 100 templates copied, including 4 breeds,
  3 items and 11 stages; stage links remapped. Transaction rolled back completely,
  leaving no test company.
- Development API runs at localhost:2877; web at localhost:3002.

## Remaining presentation caveats

- The full approved 47-code reason catalog is still not available; do not invent
  client values or claim the whole historical A1 plan is complete.
- Existing historical test rows remain inactive; no broad data cleanup was
  performed. The user's clarification allows realistic demo seeding, not a
  claim that these are real client records.
- Automated UI tests use intercepted API fixtures. They complement, but do not
  replace, live create/edit walkthroughs for every master.
- Shared company references with null LOB remain available in operational areas.
  Medicine/Feed Formula inherit Item conceptually but do not yet have direct
  classification columns; audit indirect LOB filtering before adding other domains.
- Operational roles with master-create permission but without number-series-view
  permission need a dedicated authorization check for code-settings lookup.
- Reports from Triple-C_Report Field_Template_V0.1 remain explicitly deferred.
