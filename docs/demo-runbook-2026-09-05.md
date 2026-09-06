# Demo Runbook — NAVFarm Master Data

**Status legend:** ✅ watched working in the running app · ⚠️ built, reviewed and tested but not yet
watched · ❌ known broken

Everything marked ✅ below was verified by driving the actual console on 2026-09-05 — filling forms,
pressing buttons, reading the network panel. Not by reading code.

---

## ⛔ Do this before you present

**1. Restore the Units of Measure.** Every UOM in the tenant is soft-deleted (`deleted_at`
2026-09-04 09:44). Until they are back, **Locations and Items cannot be saved** — Capacity UOM and
Primary UOM are required fields and their dropdowns are empty.

Master Data → **Units of Measure** → click **Restore** on each row. Thirteen clicks, no SQL. The
list deliberately shows inactive rows so exactly this is possible.

**2. Delete the junk location.** Code `BB`, name `uhvb`, type FARM. It sorts to the top of the
Locations list and is the first thing anyone sees.

**3. Start the servers and wait for the API.**
```bash
pnpm run dev:api
```
```bash
pnpm run dev:web
```
Wait for `NAVFarm API: http://localhost:2877/api/v1`. The console renders an empty shell if the API
is not up.

**If the API never finishes starting, check for a second copy.** Nx serialises the `serve` target,
so a second one prints `Waiting for api:serve:development in another nx process` and hangs forever
behind the first — indistinguishable from a broken API. `lsof -ti:2877` should show exactly one
process. (Do not use `pkill -f "nx serve api"`; it matches more than you intend.)

**4. Click your path once** before anyone is watching. First render after a restart compiles on
demand.

---

## The path

### 1. Master Data landing ✅
The **Master Data** nav link lands on the first master with nothing broken. (This was a bug until
this morning — it redirected to Farms, which is no longer in the sidebar.)

### 2. The sidebar — twelve masters ✅
Locations · Stages · Number Series · Animal Register · Units of Measure · Items · Breeds ·
Medicines · Suppliers · Resources · GL Accounts · Cost Centers.

Seven come from the client's own templates. Five more are named in **BBP §1** under different
words — Supplier is *Vendor*, GL Accounts is *COA from D365BC*, Cost Centers is
*Dimensions/Cost Centres*, Number Series is *No Series* — plus Medicines, which **BBP §5 Block 2**
requires for the withdrawal check.

If asked where Item Categories went: *you add one where you need one, without leaving the form.*

### 3. Sheets become tabs ✅
Each master's workbook sheet is a tab with its own list and its own Add:

- **Items** → Items · Item Attributes
- **Breeds** → Breeds · Lifecycle Stages
- **Units of Measure** → Units of Measure · UOM Conversions

Single-sheet masters (Locations, Resources, Stages, Animal Register) correctly show **no tab bar**.
Tab selection is in the route, so refresh and Back keep your place.

### 4. Item → the inline lookup ✅ **← the moment worth demoing**

1. **Items** → **Add Item**
2. The dialog opens as cards: Identification, Classification, Units & Valuation, Accounting — then
   **Item Categories**, **Item Types**, **Units of Measure**, **Feed Formulas**, each labelled
   *"Add one without leaving this form"*
3. Note the Category dropdown's options
4. Expand **Item Categories**, enter a code and name, click **Add Item Categories**
5. Scroll up — **the new category is in the dropdown**. Select it.

*Verified: adding a category took the dropdown from 9 options to 10, selectable immediately,
without closing the dialog.*

**Do not rush step 4 → 5.** There is no spinner while the dropdown refetches. Pause a beat.

**Codes already taken** — avoid: `CAT-RAW-GRAINS`, `CAT-PROTEIN-SUPP`, `CAT-FEED-PREMIX`,
`CAT-SWINE-FEEDS`, `CAT-VET-MEDS`, `CAT-VET-VACCINES`, `CAT-BIO-BREEDING`, and `CAT-CLEANING`
(added during verification). **`CAT-BEDDING` / "Bedding & Litter Materials" is free and plausible.**

A duplicate code gives a clean visible error rather than a silent second row. Note the service
**uppercases** the code.

### 5. Location — one list, typed rows ✅
**Locations** shows every location in one list with a **Type** column — FARM, SHED, PEN, STORE —
and a **Level** column. Farms, sheds and warehouses were migrated into it; warehouses appear as
STORE.

Location Type is itself an inline lookup you can add without leaving the form, and it carries
**Allowed Parent Types**, so the hierarchy is data you can edit rather than code.

### 6. Location codes ⚠️
Codes are generated hierarchically: a farm is `FARM-001`, a shed inside it `FARM-001/SHED-001`, so
the code alone says which farm it belongs to. The counter is **per parent** — farm 2's first shed
is `FARM-002/SHED-001`, not `SHED-003`.

**Not yet watched end to end** — the save path was blocked by the UOM issue above. Confirm this
yourself in pre-flight once UOMs are restored: create a farm, then a shed inside it, and check the
shed's code.

**Demo a fresh chain, not the seeded one.** Seeded farms use `FARM-APEX-01`-style codes that do not
match the generated pattern, so a child of a seeded farm starts at `SHED-001` regardless of
siblings. Nothing breaks; it just reads oddly.

**Silos sit under houses**, per BBP §1.2 — the blueprint's own example is `GRS-W2B-SILO1`. That
combination was rejected until this morning and now works.

### 7. Small screens ✅
Collapse the window or use a phone. The hamburger opens the drawer and **the twelve master sections
are in it**, grouped, with the current one highlighted. Tapping one navigates and closes the drawer.
Desktop shows one nav, never two.

*This was the reported bug. The drawer copy had been added but a pre-existing rule hid it; fixed and
verified at 375px and 1440px.*

---

## If something fails

- **A save 400s or 404s** — most likely a required lookup whose rows are inactive. Check the field's
  dropdown is not empty.
- **A dropdown does not refresh after an inline add** — close and reopen the dialog. The record
  saved; only the display is stale.
- **A page renders empty** — the API is down. Check the terminal.
- **Stutter** — memory. This machine has 8 GB; close a browser tab.

---

## Do not demo

- **Procurement and Sales.** They do not exist — no purchase order, GRN, sales order or invoice. The
  honest answer is that they are a separate programme, not a missing screen.
- **Reports.** No browsing surface; financial reports are endpoints only.
- **D365 Business Central.** No integration. Do not claim that every master has a persisted ERP
  reference or that integration is only a mapping exercise. The September 6 review found that
  claim unsupported by the code. Frontend-only BC references are being added to read-only
  record views; they are not evidence of synchronization. See `masters-review-2026-09-06.md`.
- **The other fifteen lines of business.** Taxonomy only, by decision.
- **Daily data entry, posting and correction.** Designed and specced, not built.
- **The Preseed button** (company-admin only, so you should not see it as tenant admin). It clones
  tenant rows into company scope while the list returns both, so items appear twice.

---

## If asked "what's next"

Phase B: draft → POST DAY → day lock → reversal, built to BBP §5 — the head-count balance rule,
mandatory ONCE events, and the silo balance gate. Then the reversal approval workflow, then the
seven entry blocks. Roughly 19–24 developer-days to the first production-usable state.
