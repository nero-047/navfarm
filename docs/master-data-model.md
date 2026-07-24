# Phase 3 master-data model

## Ownership and identity

Platform reference templates and company records are separate resources.
Template IDs identify reusable RAK-backed definitions. Enabling a template
creates a stable company ID; code and name remain editable labels and never
serve as transactional foreign keys.

Every company record has:

- opaque stable ID and company ID;
- unique company code and display name;
- `ACTIVE` or `INACTIVE` status;
- referencing-resource summaries;
- created/updated timestamps and actors.

Records are deactivated/reactivated, not permanently deleted. Deactivation of
a referenced record returns HTTP 409 with normalized code `resource_in_use`
and reference details.

## Implemented categories

| Resource | Principal relationships and validation |
| --- | --- |
| UOM | Code, symbol, decimal places |
| UOM conversion | Active, different source/target UOM; unique pair, item and effective date; decimal-string factor |
| Item category | Optional stable parent category |
| Item | Active category and primary UOM; optional NOB/LOB, valuation method and decimal-string standard cost |
| Attribute | Typed value, optional unit and NOB/LOB applicability |
| Breed | Required company NOB; optional LOB |
| Location | N-level parent hierarchy with cycle prevention |
| Resource | Documented resource type, cost UOM/currency and decimal-string rate |
| Operational parameter | Documented parameter type, entry type, UOM and active NOB/LOB |
| QC parameter | `NUMERIC`, `VISUAL`, `GRADE`, or `BOOLEAN`; numeric results require an active UOM |

List responses support search, active-status filter, stable code sorting, page
and page size. React receives the discriminated resource and records already
validated against that resource's strict Zod schema.

## Deliberate exclusion

The RAK slaughter-cost split sheet defines a batch configuration containing
`batch_id`, actual output items/weights, confirmed percentages and calculated
allocated/unit costs. It is not a company master. Phase 4 must model it beside
batch outputs rather than inventing a static Phase 3 master.
