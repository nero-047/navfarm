# NOB and LOB configuration

The RAK NOB/LOB workbook is represented in two layers:

1. Platform templates: Poultry, Livestock, Agriculture, Aquaculture, Insect
   Farming, and Feed & Processing plus their documented LOB templates.
2. Company configuration: enabled NOBs and LOBs with stable company IDs,
   editable code/name, lifecycle, dependencies and audit metadata.

NOBs and LOBs are not interchangeable. A company LOB must reference both an
active company NOB and an LOB template belonging to that NOB's platform
template. The selected costing method must be one of that LOB's allowed
`STANDARD`, `FIFO`, or `BIO_ASSET` values.

Company completeness requires at least one active NOB and one active LOB.
Referenced company NOBs/LOBs cannot be deactivated. The active UI is
`/{company}/settings/business-structure` (also linked from
`/{company}/masters/nobs` and `/lobs`).

`/setup/wizard/nobs` and `/setup/wizard/lobs` remain compatibility handlers
only for inactive legacy components. Active platform and company pages no
longer consume them.
