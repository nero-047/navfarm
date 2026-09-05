# NAVFarm master-data inventory

## Scope and terminology

The current web configuration contains 26 master screens: 12 primary sidebar
entries, 3 workbook tabs, 7 supporting lookup screens, and 4 legacy/direct-route
screens. These counts describe implemented UI/API surfaces, not a claim that
every field and every business rule is complete.

Tenant catalogs are draft templates. Companies own independent copies.
Operational areas use the company's shared catalog filtered to their one LOB.
Only piggery business fixtures should be populated for the current presentation;
generic references such as units, accounts and currency still remain necessary.

## Twelve primary masters

| Screen | What it represents | Why it is needed |
|---|---|---|
| Locations | Farm, shed/house, pen, store, quarantine and silo hierarchy | Assign animals, batches and stock to physical places; capacity and biosecurity |
| Stages | Configured lifecycle stages and transitions | Consistent piggery workflow, duration and stage rules |
| Number Series | Prefix, increment, formatting and manual-entry policy | Unique, predictable master/document identities |
| Animal Register | Individual pigs, tags, parentage, stage, acquisition and position | Individual livestock traceability; these are operational records, not template animals to clone |
| Units of Measure | KG, HEAD, DOSE, LITRE, HOUR and other units | Consistent quantities, capacities, consumption and costs |
| Items | Feed, ingredients, medicine, vaccines, livestock/output and overhead items | Inventory and costing identity; links to classification, tracking and accounts |
| Breeds | Breed identity and production/reproduction benchmarks | Standards and comparisons for animals and batches; Location is optional |
| Medicines | Medicine profile extending an Item | Composition, dosage guidance, route and withdrawal metadata; stock stays in Items |
| Suppliers | Purchasing counterparties | Feed, livestock, medicine and service procurement |
| Resources | Labour, equipment, vehicles and utilities | Resource rates, capacity and production cost allocation |
| GL Accounts | Chart of accounts | Accounting destinations for automated journals |
| Cost Centers | Departments, farms and cost responsibility hierarchy | Attribute costs and analyze responsibility |

## Workbook tabs and supporting masters

| Screen | Where available | Purpose |
|---|---|---|
| Item Attributes | Items tab | Configurable attribute definitions and item-specific values |
| Breed Lifecycle Stages | Breeds tab | Breed/stage/period feed, growth, output, mortality and KPI standards |
| UOM Conversions | Units of Measure tab | Convert entry units to base units, including item-specific factors |
| Location Types | Location dialog supporting card | Allowed parent types, hierarchy behavior and location-code prefix |
| Item Categories | Item dialog supporting card | Business classification and category hierarchy |
| Item Types | Item dialog supporting card | Configurable type codes such as raw material, feed and living asset |
| Species | Breed dialog supporting card | Biological classification; distinct from breed name and animal category |
| Diseases | Medicine dialog supporting card | Disease reference, severity and reporting metadata |
| Feed Formulas | Item dialog supporting card | Recipe/BOM, output item, batch size and ingredient quantities |
| GL Mappings | GL Account dialog supporting card | Map business entry types and items to debit/credit accounts |

Supporting cards now open their management lists in a dialog above the current
form instead of opening a browser tab. Parent form state is retained. Creating a
lookup saves that lookup independently, even if the parent is later cancelled.

## Legacy/direct-route masters

| Screen | Current position | Reason |
|---|---|---|
| Farms | API and direct master route; omitted from primary sidebar | Legacy operational compatibility; new user-facing hierarchy is Locations |
| Sheds | API and direct master route; omitted from primary sidebar | Legacy housing references mirrored from Locations |
| Warehouses | API and direct master route; omitted from primary sidebar | Legacy inventory references; stores/silos belong in Locations |
| Customers | API and direct master route; omitted from reduced sidebar | Sales counterparties; navigation was reduced by prior user approval, not because customer data is unnecessary |

## Batch and related operational records

The company-setup workbook explicitly names `batch master` in its permission
example and shows `batchmaster` as the parent of inventory ledgers. The functional
document describes batch-header creation and the production lifecycle. No
standalone Batch workbook exists in the supplied Master Templates folder.

| Related entity | Application implementation | Why it is separate from the primary master sidebar |
|---|---|---|
| Batch Master / Batch Header | Batches page and real `/batch` API; database `batch_header` | A production cohort/cycle references masters and accumulates operational history |
| Batch standards | Batch standard and consumption-line tables | Batch-specific standards/snapshots used by production and costing |
| Batch entries and stage logs | Batch data-entry, records and stage workflows | Events change quantities, stages and cost; not reusable lookup definitions |
| Breeding/Farrowing records | Piggery breeding APIs and screens | Mating, pregnancy, farrowing, weaning and semen events; the Animal workbook includes a Breeding Record sheet |
| Parameters | Settings → Parameters and API | Consumption/output/expense rules and KPI definitions |
| Schedulers and lines | Schedulers screen and API | Apply timing, recurring entries, standard quantities and thresholds to batches |
| QC Parameters | Settings → QC and API | Reusable quality limits and test definitions |
| QC results and QR codes | QC/traceability APIs and screens | Batch/stock inspections and traceability instances |
| Inventory, receipts/issues/transfers | Inventory screens and APIs | Operational stock transactions and resulting ledgers |
| Journals and bio-asset ledgers | Finance/bio-asset APIs and screens | Financial results of operations, not master definitions |

## Organization and system configuration

Implemented configuration also includes tenant/company records, company
addresses and contacts, fiscal/module setup, operational areas and their settings,
NOB/LOB taxonomy, costing methods, users, roles and assignments, countries/states,
languages/translations, currencies/exchange rates, timezones, notification settings,
setup steps/progress and audit logs. These live in organization, settings or system
surfaces, not as 12 more piggery sidebar masters. Do not delete authentication or
shared taxonomy merely to make the demo piggery-only.

## Clarifications and remaining gaps

- Number Series controls whether manual entry is permitted. Where both are
  permitted, creation offers an explicit serial/manual choice. Without a
  configured series, applicable reference masters use a manual code.
- Breed Location is optional; location-based generated Breed codes require a
  location, otherwise the breed code is entered manually.
- Storage Location = SILO reveals and requires capacity/reorder fields. A silo
  location is attached through Parent Location; it is not a disconnected master.
- Silo tracking settings are configuration; they do not by themselves prove a
  complete stock-cover forecasting/alert implementation.
- The full approved 47-code reason catalog is still missing. Do not fabricate it.
- `Triple-C_Report Field_Template_V0.1` is deferred report design, not a current
  master-data implementation checklist.

## Source evidence

- `Master Templates/Location Master Template_18Aug26.xlsx`, Location Master Template,
  B1:O4: hierarchy fields, Storage Location STORE/SILO and silo requirements.
- `Master Templates/Breed Master Template.xlsx`, Breed Master A1:R4 and
  Breed lifecycle stages A1:AC4: breed and stage standard definitions.
- `Master Templates/Item Master Template.xlsx`, Item Master Template and Item Attribute.
- `Master Templates/Unit Of Measure.xlsx`, Unit Of Measure and UOM Conversion.
- `Master Templates/Stage Master Template.xlsx`, STAGE MASTER and Example.
- `Master Templates/Resource Master Template.xlsx`, Resource.
- `Master Templates/Animal Register Master Template.xlsx`, Animal Register and Breeding Record.
- `rak docs/Final_Docs/2. Master Tables_Structure.xlsx`, rows 3–152: canonical master tables.
- `rak docs/Final_Docs/0.NAVFarm_company setup & db structure.xlsx`, 06.USERS ROLES F47
  and Sheet1 E2: explicit Batch Master references.
- `rak docs/NAVFarm Wireframes Functional Doc.pdf`, master loading and batch-header workflows.
- Implementation: `apps/web/src/modules/master-data/configs.ts` and corresponding
  API controllers; `apps/api/src/modules/production/batch/batch.controller.ts`.

## Demo reset boundary

Before reset, linked demo data includes 39 animals, 5 batches, 307 batch
transactions, 12 inventory ledger rows, 10 journal headers/20 lines, 4 breeding
records, 2 farrowing records, 4 receipts and 2 issues. A masters-only wipe would
break dependencies or be rejected by foreign keys. The user explicitly authorized
clearing dependent data. The reset was committed on 5 September 2026 to local
`tenant_devco` only, after a full transactional rehearsal and SQL backup.

Recovery backup: `/private/tmp/navfarm-piggery-reset.dIZWwJ/tenant_devco-before-reset-no-gtid.sql`.
This is a temporary-directory backup; retain a durable copy before system cleanup
if the old demo dataset will be needed later. Restore only with the API stopped
and after backing up any newer changes; restoration overwrites this database.

Accounts, roles, companies, operational areas/assignments and shared taxonomy were
preserved. Foreign-key checks stayed enabled, and every declared relationship
touching reset tables was checked before commit. No other database was reset.

Each company now has 12 locations (one farm, three houses, six pens, one store,
one silo), 16 items, four breeds, 11 stages, 12 breed-stage standards, 10 units,
three conversions, three medicine profiles, three suppliers, four resources,
12 GL accounts, nine GL mappings, four cost centers and supporting lookup data.
Tenant reference templates and company copies have independent identities.
All 26 master-list APIs returned HTTP 200 for both companies after reset.

Animals, batches, breeding events, stock movements, QC results, schedulers and
journals now start empty. Master-data seeding does not fabricate operational or
posted accounting history. Feed recipes, health metadata and benchmarks are
explicitly illustrative test data, not approved farm or veterinary standards.

Validation: 376 API tests passed; API, web and browser-test type checks passed;
12 focused Chromium UI tests passed. Remaining product gaps above still apply.
