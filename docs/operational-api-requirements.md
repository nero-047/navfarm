# Operational API requirements

This document assigns future authority to NestJS. Current frontend calculations in `mock-domain.ts` are temporary demo behavior and are never production truth.

## Batch lifecycle

The backend owns the transition graph, company/LOB readiness, inventory availability, locked costing method/rates, required pause/cancel reasons, period locks and optimistic concurrency. Transition requests must include an expected status or version and return the updated batch. Stale requests return `409 CONFLICT`.

Approval opens WIP and may issue input inventory. Start, pause, resume and cancel must be audited. Close must be atomic with costing and journals; retries cannot double-post.

## QC and release

Creating a required QC lot places affected inventory/batch output on hold. Only authorized QC users may dispose it. PASS may release inventory; FAIL blocks close and QR. The backend defines whether retest/reversal is allowed, who may override, and whether multi-parameter QC requires every parameter to pass.

## QR

QR generation requires released, traceable output and sufficient unallocated quantity. Pack codes are unique and immutable. Public payloads should use an opaque/signed identifier rather than exposing internal IDs or trusting browser JSON.

## Costing, journals and variances

NestJS owns STANDARD, FIFO and BIO_ASSET calculations, effective cost versions, WIP, rounding and close-time values. Journals must be balanced, immutable and derived from configured entry types and GL mappings. STANDARD close owns price, usage, output and overhead variances; FIFO and BIO_ASSET must not receive standard-cost variance postings.

Frontend DTOs include `authoritative: false` for current mock costing and journal projections. Real responses must be authoritative and should include calculation/posting IDs and timestamps.

## Batch close

At minimum: eligible status, required output, completed QC, released/allocated inventory, complete operational entries, configured GL mappings, valid accounting period and no unresolved blocking exceptions. Close, cost finalization, variance creation, journals and WIP settlement must be one transaction.

## Idempotency and concurrency

Create operation, QR pack, resource usage, disposition and close require an idempotency key. Store the key per company/user/operation and replay the original response. Mutable entities need a version/ETag; update and transition requests use `If-Match` or an explicit expected version. Return `409` with current entity/version on conflict.

## Audit

Record actor, tenant/company, permission decision, request ID, idempotency key, before/after status, reason, source device/time, server time and resulting accounting/inventory IDs. Do not accept browser-computed audit amounts as authoritative.

## Expected errors

- `400`: malformed transport/request
- `401`: no/expired session
- `403`: permission or company-scope denial
- `404`: resource not found
- `409`: stale version, duplicate key, illegal transition or idempotency conflict
- `422`: domain validation/readiness failure with field/blocker details
- `503`: dependency unavailable without claiming the mutation succeeded

## Unresolved business questions

1. The functional document says steps 1-9 are mandatory but later marks NOB/LOB step 12 mandatory. Which readiness rule wins?
2. Can QC FAIL be reversed or only superseded by a new lot?
3. Does PASS require all parameters, a weighted plan, or an approver?
4. Which roles can close, reopen or cancel a batch?
5. Are negative output and mortality corrections allowed after posting?
6. What are rounding precision, currency precision and variance materiality thresholds?
7. How are FIFO layer corrections and BIO_ASSET fair-value remeasurements represented?
8. Is QR quantity reserved at generation, printing or dispatch?
9. Which report timezone and accounting “as of” rules apply?
10. What is the required retention/reversal policy for journals and operational audit?
