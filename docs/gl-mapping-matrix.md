# GL mapping matrix

| Event | Debit-side intent | Credit-side intent | Phase 3 fields |
| --- | --- | --- | --- |
| `GRN_IN` | Inventory | GRN/clearing or payable | inventory, consumption/clearing |
| `CONSUMPTION_OUT` | Batch WIP or consumption expense | Inventory | inventory, consumption |
| `PRODUCTION_OUTPUT` | Finished output inventory | Batch WIP/output | inventory, output |
| `MORTALITY` | Mortality expense | Biological/live inventory or WIP | wastage/mortality, inventory |
| `WASTAGE` | Wastage expense | Inventory/WIP | wastage/mortality, inventory |
| `PRICE_VARIANCE` | Price variance as sign requires | Standard input/WIP as sign requires | variance |
| `USAGE_VARIANCE` | Usage variance as sign requires | WIP as sign requires | variance |
| `OUTPUT_VARIANCE` | Output variance as sign requires | Output/WIP as sign requires | variance |

The matrix documents configuration slots, not journal rules. Sign, balancing,
posting date, fiscal period, dimensions, taxes and reversal behavior remain
backend responsibilities.

Mapping uniqueness is `(company, eventType, companyNobId, companyLobId,
ACTIVE)`. Every referenced account must be active. Mapping completeness is
reported against documented events and will need LOB-specific requirement
rules from the backend.
