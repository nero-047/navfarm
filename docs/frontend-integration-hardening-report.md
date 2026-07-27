# Web Phase 6 frontend integration hardening report

## Architecture

Previous operational flow:

`components -> DemoStore -> GET/PUT one company demo-state blob`

Hardened flow:

`components -> DemoStore coordination -> typed operational clients -> /api/v1 company resources -> mock repository | proxy`

Temporary domain rules are isolated in `mock-domain.ts`. The same-origin API route, mock/proxy/hybrid selection and server-only upstream URL remain unchanged.

## Extracted resources

Batches, lifecycle transitions, operations, quality lots/dispositions, QR packs, resources/usages, costing snapshots, journals, variances and report summaries now have DTOs, Zod entity schemas and typed clients. The mock repository exposes resource-specific collections and meaningful entity responses for mirrored resources.

The mock-only operational bootstrap preserves seeded setup/master/audit fields and existing demo behavior. It is not a proposed production endpoint and must not be enabled as a real backend persistence mechanism.

## Files changed

- `apps/web/src/modules/farm-demo/operational-contracts.ts`
- `apps/web/src/modules/farm-demo/operational-client.ts`
- `apps/web/src/modules/farm-demo/mock-domain.ts`
- `apps/web/src/modules/farm-demo/demo-store.tsx`
- `apps/web/src/server/api/operational-repository.ts`
- `apps/web/src/server/api/mock-repository.ts`
- focused specs beside the operational client and mock domain
- the three Phase 6 documents under `docs/`

## Remaining demo-only behavior

React state still provides optimistic/synchronous demo interaction. Resource entities are mirrored through typed API paths after updates. Batch construction, QC state projection, batch aggregate updates and reporting presentation remain demo projections. They must be replaced by mutation responses once NestJS contracts are agreed.

The legacy `/demo/companies/{company}/state` handler remains for compatibility with older tests/imports, but the farm demo store no longer calls it.

## Backend prerequisites and limitations

- Confirm endpoint/DTO/error/versioning semantics in the contract matrix.
- Implement authoritative state transitions, permissions, QC, inventory, costing, journals, variances and close transactions.
- Return updated entities rather than generic success objects.
- Add idempotency, optimistic concurrency and audit metadata.
- The frontend has not been connected to or verified against NestJS.
- Full browser E2E and visual QA are intentionally deferred to the next phase.
