# NAVFarm masters — what exists, and what says it should

Prepared 2026-09-06 for the 2026-09-07 12:30 internal review.
Scope: NOB Livestock → LOB Piggery, Triple C (Colcom Group), Zimbabwe.

**Read this first.** BBP-1 (`Triple-C_NAVFarm BBP1_V0.1_Final.docx`) is **not signed**.
§18's checklist is eighteen blank `☐ Approved ☐ Changes Required` boxes and both signature
blocks are empty. The document says: *"Development cannot start for any section until that
section is APPROVED below."* **M2 Business Blueprint Sign-off is dated 2026-09-08** — the day
after this meeting. Sections 2 and 3 below exist because of that date.

Every quotation here was read out of the BBP text itself, not from memory or a summary.

---

## 1. The masters, and the evidence for each

"Rows" is what the console shows in the operational workspace. The database holds roughly
double, because a tenant-level template copy and the Apex company copy both exist.

### Tier A — the BBP specifies these, with fields

| Master | Rows | Authority | Quote |
|---|---:|---|---|
| **Locations** | 12 | BBP §1.2 | "Farm Hierarchy - 4 Levels (Farm → House → Pen → Silo)". Also the one client template with real data in it. |
| **Animal Register** | 20 | BBP §2.1 | "Animal Register - Key Field Specification (40 Fields)" |
| **Breeds** | 4 | BBP §1.7 | "Breed/Line Master: L-LINE, Z-LINE, TN70, TEMPO. Each line has gestation days (116), lactation days (28), productive life (46 months …)" |
| **Stages** | 8 active | BBP §1.7 | "Stage Master (8): GILT_REARING (Wk4-34), DRY_PERIOD (4-7d), FLUSH (3-5d), INSEMINATION (2d), GESTATION (116d), FARROWING (2-4d), LACTATION (28d), QUARANTINE (Wk1-4)" |
| **Reasons** | 3 | BBP §1.3 | "The Reason Master is a SINGLE shared master across all 10 Triple C farms … Total: 47 confirmed reason codes." |
| **Items** | 16 | BBP §1.5 | "Items … are CREATED IN D365BC only. **NAVFarm cannot create items independently.**" |
| **GL Accounts** | 12 | BBP §1.6 | "NAVFarm does **NOT** maintain its own Chart of Accounts. COA lives entirely in D365BC." |
| **Cost Centers** | 4 | BBP §1.8 | "Dimensions & Department / Cost Centre Setup". §1.2: "Farm Code is the D365BC Cost Centre Dimension." |

### Tier B — the BBP names these in its §1 master map but never specifies them

The §1 map lists: *"Company Master, 4-level Farm Hierarchy, NOB/LOB, **No Series**, **UOM**, COA
from D365BC, Item Master sync Boolean, Breed/Line, 10 Animal Categories, 8 Stage Master, Breed
Lifecycle Stage Config, 32 KPI Parameters, 47-code Reason Master, Dimensions/Cost Centres,
**Inseminator**, **User/Role**, **Vendor**"*. Five of those get no subsection, no fields, no rules.

| Master | Rows | Evidence | Gap |
|---|---:|---|---|
| **Number Series** | 25 | §1 map "No Series" | No prefix table, no per-document sequences, no reset rules anywhere in the BBP. What is built was specified by Rishi, not the blueprint. |
| **Units of Measure** | 10 | §1 map "UOM"; client template `Unit Of Measure.xlsx` | No UOM master spec, no conversion rules. §1.3 asks for "duel UOM" on data entry without defining it. Base UOM is a BC-owned item field per §1.5. |
| **Suppliers** | 3 | §1 map "Vendor" | `vendor_master` appears exactly once in the whole BBP, as a table join in report R16. No field spec. |

### Tier C — no BBP basis; built from the client templates and the TDD tracker

| Master | Rows | Evidence | Note |
|---|---:|---|---|
| **Resources** | 4 | Client template `Resource Master Template.xlsx`; TDD tracker row 138 | The words "resource master" do not appear in BBP-1. |
| **Medicines** | 3 | — | Medicine is an **item type** in the BBP (§1.5 "feed, medicine, vaccine, semen dose…"), not a master. Withdrawal Days is a field on the BC item. The master is a NAVFarm-side profile; its withdrawal value is now displayed from the linked item rather than editable separately. |

### Nested / lookup masters

Reached through their parent's dialog rather than the sidebar: Item Type, Item Category, Species,
Location Type, Item Attribute, UOM Conversion, GL Mapping, Feed Formula, Disease, Breed Lifecycle
Stages. Of these only **Breed Lifecycle Stage Config** is named in the BBP §1 map, where §1.7 calls
it *"MOST IMPORTANT MASTER"*: "Defines for each Line × Stage × Day range: Feed Item, Feed
KG/Head/Day, ADG target, FCR target, target weight, lower/upper weight limits, vaccination
protocol."

### Named in the BBP and not built at all

**Inseminator** and **User/Role** as masters, **KPI Parameter Master** (§1.4), **Animal Category**
(§1.7, the 10 codes), and the four logistics masters in §9.1 (Vehicle, Route, Driver, Freight Rate).

---

## 2. Where the BBP contradicts itself

These are risky to sign on the 8th, because after signature each becomes a delivery obligation
under whichever reading the client later prefers. All verified in the document.

| # | Topic | The conflict |
|---|---|---|
| 1 | **Reporting currency** | §1.1 flow: "Enter Reporting Currency = ZWL". §1.1 field spec: "USD. All reports show both currencies … ZWL is treated as the foreign currency." Base currency = USD is consistent and certain. |
| 2 | **Weaner / Grower** | Used throughout as stages — KPI table rows, house types, batch types, separate WIP accounts — but absent from the eight-stage Stage Master. HERD and TRANSFER likewise appear as KPI "Stage" values. |
| 3 | **Gilt tag format** | `G[YY][WW][Seq]` in the §2.1 flow, `G[YY][BW][Seq]` in the §2.1 field spec. Neither WW nor BW/BD is defined anywhere. |
| 4 | **Batch code** | `[SowBatch]-[YY]-[WW]` (§4.1) vs `[SowBatch]-[YY]-[BD]` (§2.1). The worked example `1-26-22` uses a bare `1`, never reconciled with the `SOW-BATCH-01` master key. |
| 5 | **Farm count** | "Triple C has 10 farms" followed by eleven codes: MUL, PRT, GRS, LH, LEX, RCH, VF, LRG, SEL, TW, QRN. |
| 6 | **Useful life** | BBP-1 §1.7: "productive life (46 months from first service)". Bio Asset BBP: "Female useful life: 36 months. Male useful life: 18 months." These drive amortisation. |
| 7 | **Animal categories** | BBP-1 lists 10 with no GGP-Local. The Bio Asset BBP requires "GGP Local" and defines `Z + Z → Local GGP`. That makes 12, not 10. |
| 8 | **KPI master** | §1.4 gives 32 rows then says they are an example, that the real master is Stage × Season × Weight × Age × Breed-type, and self-reports missing KPIs ("weaner and grower mortality, Avg CDM against budgeted etc"). |
| 9 | **EV journal batch name** | Rendered three different ways in one section: `(EV-YYYY-NN)`, `EV-YYYY-SEQ`, `EV-YYYY-NNNNN`. |

**Still owed by Triple C** (named in the BBP or MOMs, never delivered): the 47 reason codes and
their per-code mandatory-weight flag, stage filter and Pig Expert mapping; breed/line codes and
their KPI values; the vaccination schedule; all numbering conventions; the D365BC event list
(§14.2: "will be shared after CRP"); and the completed master templates. Of the eight templates
issued, seven contain only the four boilerplate rows — **the client has returned real data in one
file, the Location Master, covering 2 of 6 farms.**

Also unresolved: the animal-health system is called **Pig Vision** in the 4 Aug kickoff and
**Pig Expert** throughout the 24 Aug MOM. Worth settling before either name is said aloud.

---

## 3. What is built, versus what the TDD tracker says

`TDD_Triple-C Development Testing_Tracker_V0.1.xlsx` (last modified 2026-09-04) contains **142
rows with a description, of which 137 are Master Data**. Its recorded state:

| Status | Rows |
|---|---:|
| Not Started | 98 |
| Blank (no status at all) | 44 |
| In Progress / Completed / Passed / Failed / Blocked | **0 of each** |

Every Owner, Priority, Requirement-Ref, Development-Status, test-status and Remarks cell is
empty across all 176 rows. The "Not Started" values are a formula default computed over blank
inputs, not a judgement anyone entered. Its Dashboard therefore reports **Total 139, Completed 0,
Go-Live Ready 0**.

**That is not what the code says.** As of this commit series:

- 13 masters reachable in the console, all listing real data, all create/edit paths exercised.
- API test suite **455 passing across 53 suites**; web **109 across 17**; API, web and web-e2e
  typechecks all clean.
- Scoped unique-code indexes across 19 catalogs, verified by attempting real duplicate inserts in
  both company and tenant-template scope.
- Stage master aligned to the eight BBP §1.7 stages with their durations.
- Number series with live previews and nine configured prefixes.

If the tracker is opened in the meeting it will say the project has built nothing. It needs a pass
before the 8th, or an explicit note that it has not been maintained since 31 August.

---

## 4. Known gaps in what is built

Stated plainly so nothing here is a surprise on the day.

- **Breeding, Farrowing, Semen Batch and Batches are empty (0 rows).** The pages render and the
  APIs work; no demonstration data has been loaded. Permanent sow batches and WG batches are not
  implemented.
- **Items and GL Accounts are locally editable**, which the BBP says they should not be. The
  on-screen notice states §1.5 and §1.6 and that no BC integration exists yet. Deliberate, per
  Rishi, so work is possible before the connector lands.
- **The 44 undocumented reason codes are absent by choice**, not oversight.
- Operational lifecycle-stepper screens still use the old static stages; aligning the master did
  not rewire them.
- The master-data page shell still gates on administrator type even where the API grants a
  standard user explicit master permissions.
- No BC connector, sync, mapping or freshness alerting exists. "From BC" marks intent, not a
  live source.
