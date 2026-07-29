# Company onboarding flow

The active flow is `/{company}/setup`. `/onboarding` remains a compatibility
redirect, and the old wizard source remains available for reference.

Company onboarding establishes the legal/configuration layer. It does not
create operational authority. After company setup, a tenant administrator
creates one or more workspaces, selects NOB/LOB/modules, assigns workspace
members, and completes each workspace's operational readiness.

## Setup areas and readiness

| Area | Workspace ready | Operations ready |
| --- | --- | --- |
| Profile, addresses, contacts, localization, fiscal, company modules, administrator, team | Required company foundation | Prerequisite |
| Chart of accounts / GL | Not required | Required from Phase 3 accounts, mappings and costing |
| NOB / LOB business structure | Not required | Required from active company NOB/LOB resources |
| Essential masters | Not required | Required from active Phase 3 master records |
| Notifications | Optional | Optional |
| Review and completion | Reports both readiness levels | Completes only when both are ready |

This split resolves a source-document ambiguity temporarily: the narrative
describes steps 1–9 as the workspace gate, while the setup table also marks
COA and NOB/LOB mandatory. The centralized readiness policy makes the decision
visible and replaceable when the backend contract is finalized.

Every page loads and saves a typed resource through `/api/v1`. Users can save,
save and exit, or save and continue. Progress is restored from the mock
repository after refresh. Invalid mandatory or fiscal data returns normalized,
field-addressable API errors. Users without company management permission see
the same flow read-only.

Operational routes are canonical under
`/{company}/workspaces/{workspace}/...`. A workspace remains blocked until its
own NOB/LOB, locations, masters, parameters and memberships are ready. Tenant
Admin may configure that workspace but gains no operational role implicitly.
Legacy company operational routes redirect only after resolving accessible
workspace cardinality.

The three Phase 3 readiness steps now link to their canonical workspaces.
Legacy setup summaries remain response-compatible for inactive clients but
cannot make operations ready. Setup review recalculates from Phase 3 state.

## Company readiness aggregate

`/{company}/readiness` is the company-level aggregate and is not an alias for
accounting readiness. It reports company foundation, the documented setup
catalogue, shared masters, accounting, workspace creation, workspace
membership, NOB/LOB configuration, and each workspace's operational readiness.
Every section links to its responsible route.

Percentages are displayed only when the current mock resource supports one.
Known blockers remain blocking; missing first-workspace/member actions are
recommended, and unresolved accounting/industry policy is labelled
`POLICY_PENDING`. The detailed accounting checks remain at
`/{company}/accounting/readiness`.

After setup creates a Workspace, operational entry is through its canonical
Dashboard. Workspace Settings displays its owner Company, status, configured
NOB, enabled LOBs/modules, member count and readiness. Authorized Company or
Tenant administrators follow the explicit configuration link to
`/{company}/workspaces/{workspace}`; an operational Manager does not acquire
that company-level configuration authority. The application switcher is the
primary route back to Company administration and clears workspace context
atomically.

Milestone 4 does not change the documented onboarding steps, mandatory flags,
readiness math, or workspace creation rules. It normalizes the responsive and
theme presentation of those existing routes. Company readiness continues to
describe `POLICY_PENDING` notes as non-blocking demo decisions, and Company
administration continues to require no active workspace.
