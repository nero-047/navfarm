# Unresolved Product Decisions

These items remain intentionally unresolved after Demo Completion Milestone 3.
Milestone 1 settled the frontend mock policy that tenant is session
established, the visible selector switches Company/Workspace only, memberships
and permissions are explicit, and company/tenant roles do not authorize
workspace mutations. Milestone 2 settled the frontend mock ownership and route
boundary for Company Members, Roles, Settings and Readiness. Milestone 3
settled the frontend demo convention that a Workspace is a company-owned,
addressable operational partition with one configured NOB and one or more
enabled LOBs. That convention drives routing, labels, module availability and
typed mock responses; it is not a claim that the durable backend domain model
has been approved.

## Durable Workspace, NOB and LOB Relationship

Known:

- The documented product hierarchy is
  `Tenant -> Company -> Workspace -> NOB/LOB -> Operations`.
- The Milestone 3 frontend gives each workspace exactly one configured NOB and
  an explicit list of enabled LOBs.
- The switcher exposes Company administration and assigned Workspaces; it never
  exposes Tenant as a selectable option.
- Operational endpoints and browser state are partitioned by the complete
  tenant/company/workspace tuple.

Unresolved:

- Whether the durable Workspace represents a site, branch, operational
  partition, legal sub-entity, NOB container, or another business concept.
- Whether a production workspace may contain more than one NOB.
- Whether LOB enablement belongs directly to Workspace, through a separate
  Workspace/LOB assignment, or through a site/location model.
- Workspace lifecycle, archival, transfer, member migration and cross-workspace
  reporting rules.

The frontend must keep workspace, NOB and LOB identifiers distinct until those
decisions are signed off.

## Workspace vs Operational vs Accounting Readiness

Known:

- Workspace readiness allows the company shell/setup workspace.
- Operational readiness gates batches, operations, QC, QR and resources.
- Accounting readiness is exposed through `/accounting/readiness`.

Unresolved:

- Whether accounting readiness is strictly required for all operational writes or only for close/finalization.
- Whether some LOBs may operate without Finance enabled.
- Industry-specific readiness requirements and responsible owners beyond the
  documented shared mock checks.

The company readiness aggregate labels these rules `POLICY_PENDING`; it does
not count them as blockers.

## Custom company roles

Known:

- The mock exposes the standard company-role and workspace-role catalogues
  separately.
- Standard company-role assignment occurs through Company Members.
- `CUSTOM` remains in the compatibility enum with no default permissions.

Unresolved:

- Final custom-role catalogue, permission-combination constraints, naming,
  delegation, audit and lifecycle rules.
- Whether custom roles may include workspace permissions or only company
  permissions.
- Durable backend endpoints and versioning for custom role definitions.

The frontend displays custom roles as planned and never pretends to persist a
custom definition.

## Workspace-specific terminology

Known:

- The presentation registry supports `POULTRY`, `AGRICULTURE`, `PIGGERY`,
  `DAIRY`, `AQUACULTURE`, `FEED_PROCESSING`, and `OTHER`.
- Registry labels and module availability do not change DTO identity or
  authorization.

Unresolved:

- Approved industry-specific names beyond the neutral “Production cycles” and
  existing poultry “Batches” wording.
- Whether individual workspace types require additional navigation modules or
  specialized readiness rules.

## Mandatory Onboarding Steps

Known:

- The functional document defines a 15-step onboarding flow, while the current
  frontend exposes 13 named setup routes.
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

The settled interim rule is narrower: Tenant Admin may administer workspaces
and company setup only through explicit tenant/company permissions and receives
no automatic workspace operational access.

## Session transport and tenant selection

Known:

- The frontend contract and mock use a same-origin HTTP-only cookie.
- Tenant is part of the authenticated isolation tuple and is not a visible
  selector option; a Company choice supplies its authorized tenant ID to the
  atomic context request.

Unresolved:

- Whether production implements this contract directly or provides a
  server-side adapter over the reference backend's JWT/refresh model.
- The canonical backend tenancy/database strategy for a user with explicit
  company memberships in more than one tenant.

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
