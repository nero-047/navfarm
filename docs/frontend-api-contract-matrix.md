# NAVFarm frontend API contract matrix

Status: Web Phase 6 frontend proposal. These contracts are not evidence of backend implementation. Browser requests remain same-origin under `/api/v1`.

| Module | Screen/workflow | Method | Proposed path | Path parameters | Query parameters | Request DTO | Response DTO | Permission | Validation / expected errors | Pagination/filtering/sorting | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Batches | Batch list | GET | `/companies/{companyId}/batches` | companyId | status, lob, risk, cursor, limit, sort | - | `WorkflowBatch[]` or paged result | `operations.view` | 401, 403, 404 | Required for production | Existing mock; proposed proxy; backend required |
| Batches | Create batch dialog | POST | `/companies/{companyId}/batches` | companyId | - | `NewBatchInput` | `WorkflowBatch` | `operations.create` | Positive quantities; configured LOB/cost method; 409 duplicate; 422 invalid | - | Typed client; backend required |
| Batches | Detail | GET | `/companies/{companyId}/batches/{batchId}` | companyId, batchId | - | - | `WorkflowBatch` | `operations.view` | 404 batch; 403 company scope | - | Proposed |
| Lifecycle | Approve/start/pause/resume/cancel/close | POST | `/companies/{companyId}/batches/{batchId}/transitions` | companyId, batchId | - | `TransitionRequest` | `TransitionResult` | `operations.create`; close additionally finance/QC policy | Expected status/version, reason for pause/cancel; 409 stale/invalid state; 422 readiness | - | Typed client; mock rules isolated; backend required |
| Operations | Daily operations list | GET | `/companies/{companyId}/operations` | companyId | batchId, type, from, to, cursor, limit | - | `OperationEntry[]` or paged result | `operations.view` | 401, 403, 404 | Required | Existing mock resource |
| Operations | Record consumption/output/overhead/resource/mortality/observation | POST | `/companies/{companyId}/operations` | companyId | - | `NewOperationInput` + idempotency key | `OperationEntry` including authoritative journal reference | `operations.create` | Inventory, UOM, batch state, quantity, expected version; 409/422 | - | Typed client; mock journal only; backend required |
| QC | Quality lots | GET | `/companies/{companyId}/quality-lots` | companyId | batchId, status, cursor, limit | - | `QualityLot[]` or paged result | `quality.view` | 401, 403 | Required | Existing mock resource |
| QC | Create hold lot | POST | `/companies/{companyId}/quality-lots` | companyId | - | `CreateQualityLot` | `QualityLot` | `quality.manage` | Active batch, configured parameter; 409 existing open lot; 422 | - | Typed client; backend required |
| QC | Pass/fail disposition | POST | `/companies/{companyId}/quality-lots/{qualityLotId}/disposition` | companyId, qualityLotId | - | `QualityDispositionRequest` | Updated `QualityLot` plus release effects in future DTO | `quality.manage` | Result required; immutable completed disposition; 409/422 | - | Typed client; mock behavior preserved; backend required |
| QR | Pack list | GET | `/companies/{companyId}/qr-packs` | companyId | batchId, cursor, limit | - | `QrPack[]` | `traceability.view` | 401, 403 | Required | Existing mock resource |
| QR | Generate pack | POST | `/companies/{companyId}/qr-packs` | companyId | - | `CreateQrPack` + idempotency key | `QrPack` | `traceability.manage` | QC pass, released inventory, available quantity; 409/422 | - | Typed client; backend required |
| Resources | Resource list/create | GET/POST | `/companies/{companyId}/resources` | companyId | type, status, cursor, limit | Create resource DTO | `DemoResourceRecord[]` / entity | `resources.view/manage` | Nonnegative rate; valid allocation; 409 code conflict; 422 | Required | Existing mock resource |
| Resources | Record usage | POST | `/companies/{companyId}/resource-usages` | companyId | - | Resource ID, batch ID, quantity + idempotency key | `ResourceUsage` | `operations.create` | Active resource/batch, quantity, rate/version; 409/422 | - | Typed client; backend required |
| Costing | Cost snapshot | GET | `/companies/{companyId}/costing` | companyId | batchId, asOf | - | `CostingSnapshot[]` | `finance.view` | 403, 404, 422 unsupported method | Filter by batch | Mock derived and marked non-authoritative |
| Journals | Journal list | GET | `/companies/{companyId}/journals` | companyId | batchId, sourceOperationId, cursor, limit | - | `JournalEntry[]` | `finance.view` | 403, 404 | Required | Mock derived and marked non-authoritative |
| Variances | Variance list | GET | `/companies/{companyId}/variances` | companyId | batchId, type | - | Batch-keyed variance DTO (current client has `VarianceResult[]`) | `finance.view` | Only STANDARD batches; 403/409/422 | Filter/sort required | Client/schema exists; response needs backend review |
| Reports | Operational summary | GET | `/companies/{companyId}/reports/summary` | companyId | from, to, lob, costingMethod | - | `OperationalReport` | `reports.view` | 403, 422 range | Filtering required | Client/schema exists; backend required |
| Mock bootstrap | Initialize/reset demo only | POST/PUT | `/companies/{companyId}/operational-bootstrap` | companyId | - | Seeded `DemoState` | `DemoState` | demo company manage | Disabled in production real-backend mode; 400/403/409 | - | Mock-only compatibility adapter |

## Operational action inventory

| Screen/component | Previous store method | Input | Returned/updated data | Previous browser calculation/validation | Backend-authoritative requirement | Permission | API resource |
|---|---|---|---|---|---|---|---|
| Batch dialog | `createBatch` | LOB, method, quantities, source, BOR, split | New batch + audit | Code, standards, status, expected usage/overhead | Resolve configuration, uniqueness, standards and opening WIP | `operations.create` | batches |
| Batch table/status dialog | `approveBatch` | batch ID | Approved batch | Lock method/rates; opening WIP | Approval eligibility, inventory issue, accounting period | `operations.create` | transitions |
| Status dialog | `transitionBatch` | ID, action, reason | Updated status | Transition graph and required reason | State machine, optimistic version, audit | `operations.create` | transitions |
| Operation dialog | `recordOperation` | entry type, qty, UOM, rate, expected, notes | Operation, batch totals, journal | WIP, usage/output/overhead, journal, risk | Inventory, cost, journal, scheduler/KPI and concurrency | `operations.create` | operations/journals |
| Quality dialog | `createQualityLot` | batch, parameter | HOLD lot + batch hold | Lot code, HOLD propagation | QC plan, sampling, inventory hold | `quality.manage` | quality-lots |
| Disposition dialog | `setQualityDisposition` | lot, PASS/FAIL, result | Lot and release/block state | Release, close readiness | Approval authority, immutable result, inventory release | `quality.manage` | disposition |
| QR dialog | `generateQrPack` | batch, quantity | QR pack | QC gate, payload and code | Released quantity, serial uniqueness, signed public payload | `traceability.manage` | qr-packs |
| Resource dialog | `addResource` | resource fields | Resource | ID only | Unique code, valid rate/UOM/location | `resources.manage` | resources |
| Operation dialog | resource entry through `recordOperation` | resource cost/qty | Usage, WIP, journal | Cost and WIP | Allocation, rate effective date, journal | `operations.create` | resource-usages |
| Batch table/status dialog | `closeBatch` | batch ID | Closed batch + variances | QC/output gates, four variances, WIP zero | Atomic readiness, variance journals, locked period | operations + finance close policy | transitions/costing/variances |
| Dashboard/detail/reports | `calculateVariance` | batch | Variance result | Price/usage/output/overhead formula | Cost version, rounding, posting period | `finance.view` | variances |
| Reports page | derived from `state` | filters implicit | Totals/KPIs | Aggregations | Authoritative query/as-of semantics | `reports.view` | reports |

All mutations must use the standard API error envelope, provide request IDs, and return the resulting typed entity or transition result. A generic `{ "success": true }` is not sufficient for these operational contracts.
