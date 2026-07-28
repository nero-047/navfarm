# NAVFarm web visual QA report

Phase 9 automated visual checks cover the workspace-aware manager dashboard, mobile Resources & KPIs scheduler, tenant workspace list/detail, legacy multi-workspace selector, and onboarding redirect/profile outcomes. Approved presentation evidence is isolated in `docs/screenshots/presentation-final/`.

The checks wait for the expected route and heading, font readiness, loading-state removal and action visibility. They reject dialogs, known error states and document-level horizontal overflow. Final evidence uses the declared viewport dimensions rather than misleading full-page images named after a viewport.

Visual review focus:

- Navy shell, white content surfaces and compact card layout remain intact.
- Tables can retain deliberate internal horizontal scrolling; the page document itself must not overflow on mobile. The Resources KPI scheduler uses mobile cards below the `sm` breakpoint so status and action content do not clip.
- Demo values remain marked as demo data and are not represented as live backend data.

The four rejected images were replaced in place: the onboarding redirect now shows the fully loaded review screen at desktop and mobile, the manager dashboard shows the authenticated Green Valley/Poultry Operations workspace, and the mobile onboarding profile is a true 390x844 viewport with its primary action visible. The image-by-image disposition and final approved manifest are recorded in `docs/screenshot-audit-report.md`.

Five 1440x900 images passed the stricter self-contained presentation criteria
and are present in `docs/screenshots/presentation-final/`. Mobile captures remain
audited regression evidence because the compact header abbreviates the visible
account identity; they were deliberately not copied into the final set.
