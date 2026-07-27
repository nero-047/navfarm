# Unresolved Product Decisions

These items are intentionally not decided in Phase 8.

## Workspace vs Operational vs Accounting Readiness

Known:

- Workspace readiness allows the company shell/setup workspace.
- Operational readiness gates batches, operations, QC, QR and resources.
- Accounting readiness is exposed through `/accounting/readiness`.

Unresolved:

- Whether accounting readiness is strictly required for all operational writes or only for close/finalization.
- Whether some LOBs may operate without Finance enabled.

## Mandatory Onboarding Steps

Known:

- The frontend models a 15-step onboarding flow.
- Foundational profile/address/contact/localization/fiscal/modules/admin steps are mandatory for workspace readiness.
- COA, NOB/LOB and essential masters affect operations readiness.

Unresolved:

- Final mandatory step numbering and optional/required flags for every industry.
- Whether team, notifications and reports are required before production use.

## Tenant Admin Configuration Permissions

Known:

- Tenant Admin may manage tenant/company setup and master-data configuration.
- Tenant Admin may validate master-data imports.
- Tenant Admin does not automatically gain batch, QC, QR release, financial mutation or close permissions.

Unresolved:

- Whether Tenant Admin can directly edit company accounting config without explicit company finance role.
- Whether Tenant Admin can override readiness blockers.

## Tenant Summary Visibility vs Company Detail Access

Known:

- Tenant console shows company summaries.
- Company detail requires company membership or tenant-admin setup authority in the mock.

Unresolved:

- Exact fields visible at tenant summary level for non-company members.
- Whether tenant billing/viewer roles can inspect setup exceptions without company membership.

## Batch-Close Accounting Requirements

Known:

- Close sets WIP to zero and finalizes costing in the demo.
- Close is rejected when mock-domain gates fail.

Unresolved:

- Exact journal posting requirements before close.
- Whether close requires COA/GL completeness, period open status and inventory valuation approval.
- Who may reopen/reverse a close, if anyone.

## QC Failure and Disposition Rules

Known:

- QC `FAIL` blocks close in the demo.
- QC `PASS` releases inventory.

Unresolved:

- Rework flow after FAIL.
- Partial pass/fail lot handling.
- Required evidence/attachments for disposition.
- Accounting treatment for failed material.

## QR Generation Eligibility

Known:

- QR generation is shown after QC PASS in the Phase 7 flow.
- QR quantity must be positive.

Unresolved:

- Whether QR generation requires closed batch or only released inventory.
- Whether QR packs reserve or consume output quantity.
- Payload signing, expiration and public trace fields.

## Costing Finalization Timing

Known:

- Demo costing/journals/variances are non-authoritative until backend.
- Close finalizes costing in demo behavior.

Unresolved:

- Whether costing snapshots are continuously authoritative before close.
- Whether variance generation happens at close, period close or both.
- BIO_ASSET valuation policy and measurement timing.

