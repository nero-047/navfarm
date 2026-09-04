# Demo Runbook — 5 September 2026, 20:00

**Status legend:** ✅ verified by review and tests · ⚠️ built and reviewed, **not yet watched running** · ❌ known not to work

Nothing below carries ✅ for *visual* behaviour yet. Every item is code-reviewed and test-covered;
none has been seen on screen. The click-through pass converts ⚠️ to ✅ — do it before you present.

---

## Pre-flight, ~20 minutes before

1. **Start both servers.** API on 2877, web on 3002.
   ```bash
   pnpm run dev:api
   ```
   ```bash
   pnpm run dev:web
   ```
   Wait for `NAVFarm API: http://localhost:2877/api/v1` before opening the browser. The web app
   silently renders an empty console if the API is not up yet.

2. **Sign in** at http://localhost:3002 as the tenant admin.

3. **Open the console once and click through your path** before anyone is watching. First render
   after a restart compiles on demand and is slower than every subsequent one.

4. **Confirm which database you are pointing at.** Migrations 0055–0058 are applied to the local
   MySQL tenant databases. They are **not** applied to the TiDB target in the commented-out `.env`
   block. If you switch to TiDB, run `pnpm nx run api:db-migrate-all-tenants` against it first or
   the console will fail on the new columns.

5. **Close other applications.** This machine has 8 GB and both dev servers plus a browser will
   push it into swap. A stutter mid-demo is a memory problem, not a code problem.

---

## The path

### 1. Master Data landing ⚠️
Click **Master Data** in the main nav. It lands on the first primary master.

*This was broken until this morning* — it redirected to Farms, which is no longer in the sidebar,
so nothing was highlighted. Fixed in `12aa823`. Worth clicking once in pre-flight to confirm.

### 2. The sidebar ⚠️
The sub-sidebar lists **primary masters only** — one entry per real-world entity. Lookups
(Item Category, UOM, Species, Location Type…) are no longer separate entries; they live inside
their parent's dialog.

If asked "where is Item Category?" — the answer is the story: *you add one where you need one,
without leaving the form.*

### 3. Item → the inline lookup ⚠️ **← the moment worth demoing**

1. Open **Item**, click **Add**
2. The dialog opens as collapsible cards — Identification, Units & Valuation, Classification
3. Note the **Category** dropdown's current options
4. Expand the **Item Categories** card near the bottom
5. Enter a code and name — **`CAT-BEDDING` / "Bedding & Litter Materials"**
6. Click **Add Item Category**
7. Scroll back up — **the new category is in the Category dropdown**. Select it.
8. Complete the required fields, **Save**

**Do not rush step 6→7.** There is no loading indicator while the dropdown refetches. Pause a
beat before opening it.

**Safe category codes** — these seven already exist, so avoid them: `CAT-RAW-GRAINS`,
`CAT-PROTEIN-SUPP`, `CAT-FEED-PREMIX`, `CAT-SWINE-FEEDS`, `CAT-VET-MEDS`, `CAT-VET-VACCINES`,
`CAT-BIO-BREEDING`. A duplicate gives a clean visible error rather than a silent second row — not
fatal, but not the story you want.

Note the service **uppercases** category codes. Type lowercase and it stores uppercase.

### 4. Location → the hierarchy ⚠️
Open **Location**. One list, every location, with a **Type** column — farm, shed, pen, silo.

Adding a location: the **Location Type** is itself a lookup you can add inline, exactly like
Category. Types carry a code prefix, and codes are generated hierarchically — a shed inside farm 1
becomes `FARM-001/SHED-001`, so the code alone says which farm it belongs to.

**Demo a FRESH Farm → Shed → Pen chain, not a seeded one.** The seeded farms use
`FARM-APEX-01`-style codes that do not match the generated pattern, so a child added to a seeded
farm starts at `SHED-001` even where siblings already exist. Nothing breaks; it just reads oddly.
Create a new farm live and build under it.

**Silos sit under houses**, per BBP §1.2 — the blueprint's own example is `GRS-W2B-SILO1`, farm →
house → silo. That combination was rejected until this morning and is now allowed.

### 5. Any other master ⚠️
Every primary master uses the same dialog shape. Breed, Resource, Supplier, Customer, Stage,
Animal Register, GL Account, Medicine, Disease, Feed Formula, Number Series.

If asked for one I have not named, it still opens and still saves — the pattern is configuration,
not per-page code.

---

## If something fails

- **A field 400s on save** — every field was verified against its API contract field-by-field, so
  this should not happen. If it does, cancel the dialog and move to another master; the failure is
  contained to one form.
- **The dropdown does not refresh after an inline add** — close and reopen the dialog. The value
  was saved; only the display is stale.
- **A page renders empty** — the API is not running or has crashed. Check the terminal.
- **The whole thing stutters** — memory. Close a browser tab.

---

## Do not demo

- **Procurement or Sales.** They do not exist. No purchase order, no GRN, no sales order, no
  invoice. If asked, the honest answer is that they are a separate programme, not a missing screen.
- **Reports.** No `/reports` browsing surface. Financial reports exist as endpoints only.
- **Anything D365 Business Central.** No integration exists. Every master now carries a place for
  an external ERP reference so connecting it later is a mapping exercise — that is the honest
  statement, and it is a strength, not a gap.
- **The other fifteen lines of business.** Taxonomy only, by decision.
- **Daily data entry, posting, correction.** Designed and specced, not built. That is the next
  phase, not today's.

---

## If asked "what's next"

Phase B: draft/POST DAY/day-lock and reversal, built to BBP §5 — the head-count balance rule,
mandatory ONCE events, and the silo balance gate. Then the reversal workflow, then the seven entry
blocks. Roughly 19–24 days to the first production-usable state.
