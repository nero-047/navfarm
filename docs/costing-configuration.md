# Costing configuration

Supported selectable methods are those requested for Phase 3:

- `STANDARD`: configured standard cost by applicable scope, plus price, usage
  and output variance mappings.
- `FIFO`: consumption from the oldest eligible inventory lot/layer.
- `BIO_ASSET`: biological-asset accounts and a backend-defined measurement
  policy.

Configuration can be scoped to company, NOB or LOB with stable IDs. Phase 3
stores policy and readiness only. It does not simulate FIFO layers, fair-value
measurement, standard-cost rollups, close variance calculations or journals.

The RAK workbook contains historical `AVG`/weighted-average references, and
Phase 2 fiscal setup retains a `WAVG` compatibility value. It is intentionally
not selectable in the new Phase 3 costing resource because the Phase 3 request
specified `STANDARD`, `FIFO`, and `BIO_ASSET`.
