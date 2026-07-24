# Phase 4 API prerequisites

Phase 4 starts at the operational boundary: migrate batches and daily
operations off `/demo/companies/{slug}/state` while preserving the stable
Phase 3 references below.

## Stable identifiers required by future APIs

| Future domain | Required stable references |
| --- | --- |
| Batch | `companyId`, `companyNobId`, `companyLobId`, `locationId`, optional `breedId`, costing configuration ID/version, scheduler ID/version |
| Daily operation | `batchId`, operational `parameterId`, entry-type code/ID, `itemId`, `uomId`, optional `resourceId`, source location/lot IDs |
| Inventory | `itemId`, base `uomId`, optional conversion ID/version, location ID, lot/layer ID, valuation method |
| QC | `batchId`/quality lot ID, `qcParameterId`, result type, `uomId`, inspector user ID, hold/pass/fail status |
| Costing | `batchId`, costing scope/config ID, account IDs and GL mapping ID/version, item/lot/layer IDs |
| Slaughter/output | slaughter `batchId`, output `itemId`, output type, UOM, split configuration/line IDs and confirmed decimal percentages |
| Traceability | batch, source batch, item/lot, quality lot, output/pack and public-code IDs |

## Backend behavior to settle before migration

- opaque ID format and tenant/company row-level isolation;
- optimistic concurrency/version fields and idempotency keys;
- per-LOB required masters, mappings and QC applicability;
- entry-type catalogue and allowed direction/inventory/cost behavior;
- FIFO layer selection, standard-cost effective dating and BIO_ASSET policy;
- journal generation, balancing, period controls, reversals and audit events;
- batch status transitions, approvals, pause/resume/close and readiness loss;
- inventory lot/serial numbering and unit-conversion effective dating;
- slaughter split validation (confirmed percentages total 100) and output rules;
- import file storage/scanning, template versions and asynchronous jobs;
- pagination/filter/sort conventions already demonstrated by Phase 3.

No Phase 4 endpoint should accept a NOB/LOB/item/UOM/location/account name or
code as its foreign key. Codes are human-readable attributes; stable IDs are
the references.
