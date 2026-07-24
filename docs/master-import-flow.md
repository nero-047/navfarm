# Master import and export flow

The reusable Phase 3 workflow is:

1. choose a strict master resource;
2. download its versioned CSV template;
3. select a CSV/XLSX file in the future uploader;
4. parse and map columns only when required;
5. submit validation;
6. review valid/invalid counts and row/field errors;
7. download validation errors when provided by the backend;
8. confirm only a fully valid preview;
9. poll the import result when processing is asynchronous.

The current frontend demo implements deterministic validation/confirmation
contracts and UI for valid, partially invalid and completely invalid inputs.
It does not retain an uploaded file or claim production parsing. XLSX parsing,
virus scanning, file limits, template version negotiation, idempotency and
async job storage are Phase 4/backend prerequisites.

Exports return an explicit filename containing company, resource and date plus
CSV content metadata. The production backend should support current filters,
selected columns and CSV/XLSX streaming or asynchronous jobs.
