# Phase 3 assumptions

- RAK `Final_Docs` copies of workbooks 0–2 are current where duplicates exist.
- Platform template catalogues are system-owned and read-only in this frontend
  checkpoint; backend template mutation governance is not documented.
- `STANDARD`, `FIFO`, and `BIO_ASSET` are the Phase 3 costing methods. Historic
  `AVG`/`WAVG` references are recorded but not added to the new selector.
- Company code uniqueness is enforced per resource in the mock. Production
  collation, case sensitivity and effective dating remain backend decisions.
- Decimal-safe values are strings. Locale formatting is presentation-only.
- Operations readiness requires active NOB/LOB, UOM, items/categories,
  locations, accounts, GL mappings, costing, operational parameters and
  applicable QC parameters. Exact per-LOB minimum counts remain a backend
  configuration rule.
- The seeded Green Valley poultry company is fully configured; BlueWater is
  partial; Harvest Ridge has empty masters. Seeds are process memory and reset
  on server restart or the development-only reset endpoint.
- CSV validation scenarios are contract demonstrations, not real uploaded-file
  persistence or parsing.
- Slaughter split belongs to Phase 4 because the RAK schema is batch/output
  dependent.
- Active company operational state remains at
  `/demo/companies/{slug}/state` until Phase 4 as explicitly allowed.
