# NAVFarm web visual QA report

Phase 7 automated visual checks cover the dashboard, batches, QC batches and reports at desktop (1440x900), laptop (1280x800), tablet (768x1024), and mobile (390x844) sizes.

The checks wait for the rendered heading and font readiness, assert no horizontal document overflow at each capture width, then save full-page evidence to `docs/screenshots/phase7/`.

Visual review focus:

- Navy shell, white content surfaces and compact card layout remain intact.
- Tables can retain their deliberate internal horizontal scrolling; the page document itself must not overflow on mobile.
- Demo values remain marked as demo data and are not represented as live backend data.

The in-app browser connection was unavailable in this execution environment, so Playwright screenshots are the rendered visual evidence for this phase.
