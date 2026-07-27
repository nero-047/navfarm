# Operational State Machine

This document records frontend-supported behavior only. Production rules beyond this are backend responsibility or unresolved product decisions.

## Batch Lifecycle

States from `workflowStatusSchema`:

- `DRAFT`
- `APPROVED`
- `ACTIVE`
- `PAUSED`
- `QC_HOLD`
- `READY_TO_CLOSE`
- `CLOSED`
- `CANCELLED`

Transition actions from `batchTransitionActionSchema`:

- `APPROVE`
- `START`
- `PAUSE`
- `RESUME`
- `CANCEL`
- `CLOSE`

Frontend-confirmed transitions:

| From | Action/event | To | Confirmed behavior |
|---|---|---|---|
| `DRAFT` | `APPROVE` | `APPROVED` | Sets costing status to `OPEN`; WIP initialized from input quantity and standard rate. |
| allowed by mock domain | `START` | `ACTIVE` | Starts active production. |
| allowed by mock domain | `PAUSE` | `PAUSED` | Pause/cancel require reason when mock-domain rules say so. |
| `PAUSED` | `RESUME` | `ACTIVE` | Resumes production. |
| allowed by mock domain | `CANCEL` | `CANCELLED` | WIP set to zero in mock. |
| QC create | QC hold event | `QC_HOLD` | Inventory becomes `BLOCKED`; QC status `HOLD`. |
| QC disposition PASS | disposition | `READY_TO_CLOSE` | Inventory becomes `RELEASED`; QC status `PASS`. |
| close-ready batch | `CLOSE` | `CLOSED` | Costing finalized, inventory released, WIP zero, close timestamp set. |

Concurrency:

- `transitionRequestSchema.expectedStatus` is supported.
- If current status differs, backend returns 409.

## Operation Recording

`operationEntrySchema.entryType`:

- `CONSUMPTION`
- `OUTPUT`
- `OVERHEAD`
- `RESOURCE`
- `MORTALITY`
- `OBSERVATION`

Frontend-confirmed behavior:

- Operation create validates the target batch.
- Operation create may generate a journal preview.
- Demo journal entries are non-authoritative.

Inferred backend responsibility:

- Validate operation type against LOB operational parameters.
- Apply inventory, WIP and GL effects atomically.
- Attach actor and audit metadata.

Unresolved:

- Whether observations can be recorded against closed batches.
- Whether operation corrections are reversal entries or mutable edits.

## QC Hold, Pass, Fail and Disposition

States from `qualityLotSchema.status`:

- `HOLD`
- `PASS`
- `FAIL`

Frontend-confirmed behavior:

- Creating a QC lot places the batch into `QC_HOLD`.
- `PASS` makes batch `READY_TO_CLOSE`, sets inventory `RELEASED`.
- `FAIL` keeps batch in `QC_HOLD`, sets inventory `BLOCKED`, and sets costing status `CLOSE_BLOCKED`.
- `HOLD` keeps batch held.

Inferred backend responsibility:

- Enforce mandatory QC parameters by LOB.
- Prevent QR generation and close when QC is not passed.
- Record disposition actor, measured result and timestamp.

Unresolved:

- Whether failed QC can be reworked to PASS.
- Whether partial lot release is supported.
- Whether fail disposition creates wastage/mortality journals immediately.

## QR Generation Gates

Frontend-confirmed behavior:

- QR pack creation requires an existing batch.
- QR generation is blocked by mock-domain rules until eligibility is met.
- Phase 7.1 flow generates QR after QC PASS.

Inferred backend responsibility:

- Require QR-enabled module/LOB.
- Require released inventory.
- Ensure pack quantity is positive and not greater than releasable quantity.
- Persist trace payload with source batch/company identity.

Unresolved:

- Whether QR can be generated before close.
- Whether QR pack quantity decrements inventory reservations.
- QR payload signing/versioning.

## Close Rejection

Frontend-confirmed behavior:

- Close uses `POST /companies/{companyId}/batches/{batchId}/transitions` with action `CLOSE`.
- Mock close rejects non-ready batches with 422 business-rule error.
- Stale status rejects with 409 when `expectedStatus` is supplied.

Inferred backend responsibility:

- Require all blocking operations, QC, QR, costing and accounting readiness checks.
- Close atomically finalizes costing, inventory, journals and variances.

Unresolved:

- Exact accounting prerequisites for close.
- Manual override role and audit requirements.

## Successful Close

Frontend-confirmed behavior:

- Batch becomes `CLOSED`.
- `costingStatus` becomes `FINALIZED`.
- `inventoryStatus` becomes `RELEASED`.
- `wip` becomes `0`.
- `closedAt` is set.
- Response may include variance result.

## Journal, Costing and Variance Generation

Frontend-confirmed demo behavior:

- Operation recording returns journal preview data.
- `GET /costing` returns snapshots with `authoritative: false`.
- `GET /journals` returns generated journal rows with `authoritative: false`.
- `GET /variances` returns variance calculations.
- `GET /reports/summary` returns `authoritative: false`.

Inferred backend responsibility:

- Production backend is the only source of authoritative costing, journal and variance records.
- Use decimal-safe monetary and quantity math.
- Ensure journal generation is double-entry and balanced.
- Make close idempotent and concurrency-safe.

