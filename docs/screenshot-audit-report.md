# NAVFarm screenshot audit

## Audit method

The Phase 9 audit reviewed every PNG in `docs/screenshots/phase2/`,
`docs/screenshots/phase3/`, `docs/screenshots/phase7/` and
`docs/screenshots/presentation/`. The inventory at audit time was 14, 15, 10
and 11 images respectively (50 historical/evidence images).

Each image was checked against its filename and visible route content, account
and role, company/workspace context, load completion, blocking overlays and
errors, document overflow, and access to the expected action. Playwright also
waits for fonts, removes loading placeholders, rejects dialogs and common error
states, and asserts document-level horizontal overflow before Phase 9 captures.

Historical evidence remains in its original directory even when it is not
presentation-grade. Only images that independently satisfy all presentation
criteria are copied to `presentation-final`.

## Rejected images and replacements

| Rejected image | Reason | Replacement result |
| --- | --- | --- |
| `phase2/company-onboarding-redirect-desktop.png` | Captured the empty Setup shell before redirect content loaded. | Replaced in place with the fully loaded `Review & completion` outcome for the Onboarding Administrator. |
| `phase2/company-onboarding-redirect-mobile.png` | Captured the redirect before the destination was established. | Replaced in place with the loaded mobile `Review & completion` outcome; no horizontal overflow. |
| `presentation/manager-dashboard-1440x900.png` | Showed the login page even though its filename claimed a manager dashboard. | Replaced in place with the authenticated Farm Manager dashboard in Green Valley Poultry / Poultry Operations. |
| `presentation/onboarding-profile-390x844.png` | Used a full-page image whose height did not match the declared 390x844 viewport. | Replaced in place with a true 390x844 Company profile viewport after the Onboarding Administrator route and action were verified. |

The mobile Resources & KPIs capture was also regenerated after changing the KPI
scheduler from a clipping table to responsive cards below the `sm` breakpoint.
The capture scrolls the scheduler into view and passes the 390px document
overflow assertion.

## Directory disposition

| Directory | Review disposition |
| --- | --- |
| `phase2/` | 14 reviewed. Retained as onboarding/tenant evidence; the two rejected redirect captures were replaced. Mobile full-page legacy captures are not promoted because the visible header abbreviates the account identity. |
| `phase3/` | 15 reviewed. Correct master-data/accounting screens and loaded states; retained as historical regression evidence. Mobile full-page legacy captures are not promoted. |
| `phase7/` | 10 reviewed. Correct operational screen names and loaded demo data; retained as historical regression evidence. Legacy full-page viewport naming and pre-workspace-route context prevent promotion. |
| `presentation/` | 11 reviewed. The four Phase 9 replacements and KPI scheduler regression are retained here. Other images remain valid scenario evidence, but only the explicit final manifest below is approved for presentation. |

## Approved presentation-final manifest

All files below have exact 1440x900 dimensions, no loading/error/overlay state,
no document overflow, visible account/role, and visible company/workspace
context where operational:

| File | Visible proof |
| --- | --- |
| `manager-dashboard-green-valley-poultry-operations-1440x900.png` | Farm Manager, Green Valley Poultry, Poultry Operations, Executive dashboard and report action. |
| `multi-workspace-legacy-dashboard-selector-1440x900.png` | Multi-company Manager, Green Valley Poultry, and both accessible workspace choices after a legacy dashboard request. |
| `tenant-admin-workspace-list-green-valley-1440x900.png` | Tenant Administrator, Green Valley Poultry, workspace readiness summaries and Create workspace action. |
| `tenant-admin-workspace-detail-poultry-operations-1440x900.png` | Tenant Administrator, Green Valley Poultry / Poultry Operations, readiness, enabled modules and Save workspace action. |
| `tenant-admin-workspace-membership-poultry-operations-1440x900.png` | Tenant Administrator, Green Valley Poultry / Poultry Operations, current members and reachable Add member action. |

The curated files are in `docs/screenshots/presentation-final/`. No mobile image
was copied into that directory because the compact shell visually abbreviates
the signed-in identity; those screenshots remain regression evidence instead of
being misrepresented as fully self-contained presentation proof.
