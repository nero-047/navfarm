# Accounting configuration

Phase 3 configures accounting references; it does not calculate cost, create a
journal, balance entries, or post results.

## Chart of accounts

Accounts carry stable ID, code/name, account type, category, normal balance,
optional parent, posting/header flag, optional currency, status, dependencies
and audit metadata. Parent accounts must be active and the hierarchy cannot
cycle. Duplicate codes and referenced deactivation return conflicts.

The UI offers tree and flat views, search, create/detail/edit routes and
permission-aware actions.

## GL mappings

Mappings are scoped optionally to a company NOB/LOB and use active account IDs.
The implemented event catalogue comes from the RAK COA/item mapping and
parameter sources:

- `GRN_IN`
- `CONSUMPTION_OUT`
- `PRODUCTION_OUTPUT`
- `MORTALITY`
- `WASTAGE`
- `PRICE_VARIANCE`
- `USAGE_VARIANCE`
- `OUTPUT_VARIANCE`

Duplicate active event/scope mappings are rejected. Debit/credit values in the
UI are previews of configuration intent only.

## Readiness

Accounting readiness requires an active COA, required GL mapping coverage and
a valid costing policy. `STANDARD` additionally requires standard costs and
variance mappings. The backend must finalize full mapping cardinality by
enabled LOB before production use.
