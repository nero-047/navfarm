# NAVFarm web visual QA report

Phase 7.1 automated visual checks cover manager dashboard, batches, reports, QC, QR traceability, resources, tenant dashboard and onboarding profile. The required 1440x900, 1280x800, 768x1024 and 390x844 viewports are represented in `docs/screenshots/presentation/`.

The checks wait for font readiness, assert no horizontal document overflow at each capture width, ensure key actions remain reachable, and save full-page evidence to `docs/screenshots/presentation/`.

Visual review focus:

- Navy shell, white content surfaces and compact card layout remain intact.
- Tables can retain their deliberate internal horizontal scrolling; the page document itself must not overflow on mobile.
- Demo values remain marked as demo data and are not represented as live backend data.

Eleven Phase 7.1 presentation PNGs were generated: manager dashboard; batches desktop/mobile; mobile batch dialog; reports; QC; traceability; resources; tenant dashboard; onboarding desktop/mobile. The mobile dialog capture was visually inspected and has visible controls without clipping or overlap. Playwright screenshots are the rendered visual evidence for this phase.
