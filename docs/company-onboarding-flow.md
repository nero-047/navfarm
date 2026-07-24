# Company onboarding flow

The active flow is `/{company}/setup`. `/onboarding` remains a compatibility
redirect, and the old wizard source remains available for reference.

## Setup areas and readiness

| Area | Workspace ready | Operations ready |
| --- | --- | --- |
| Profile, addresses, contacts, localization, fiscal, modules, administrator, team | Required (steps 1–9) | Prerequisite |
| Chart of accounts / GL | Not required | Required |
| NOB / LOB business structure | Not required | Required |
| Essential masters | Not required | Required |
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

Operational pages remain visible before operations readiness, but batches and
daily operations are placed in read-only mode with actionable blocker links.
