# Phase 2 assumptions and retained compatibility

## Assumptions

- The backend is not yet implemented; Phase 2 defines same-origin
  `/api/v1/*` contracts and proxy-compatible responses without claiming
  production persistence.
- Tenant/company IDs are opaque strings. Slugs are navigation identifiers,
  not authorization evidence.
- A system administrator can inspect all scopes. Tenant administrators require
  tenant membership; company editors additionally require company access.
- Workspace readiness uses setup steps 1–9. COA/GL, NOB/LOB, and essential
  masters form a separate operations-readiness gate.
- Only UI preferences may use localStorage. Auth, tenant, company, setup, and
  operational demo data use the API boundary.
- Pricing, taxes/GST, payment gateways and retries, proration, invoicing,
  overage charging, and grace periods are undefined and are not simulated.
- Final backend validation rules remain pending for legal registration
  formats, address/postal formats by country, fiscal calendars beyond the
  day-1-to-28 demo constraint, chart-of-account templates, GL completeness,
  and the minimum master records needed by each LOB.
- Dashboard trend summaries, usage numbers, storage availability, display
  names, brand colour, website, invitation expiry, and activity copy are
  demo fields shaped by the existing application experience where the RAK
  documents do not prescribe a value or calculation.

## Retained functionality and replacements

| Existing capability | Status or replacement |
| --- | --- |
| Legacy `/organization`, `/tenant-admin`, `/operator` routes | Retained as documented redirects |
| Legacy onboarding wizard | Source retained; active flow replaced by `/{company}/setup` |
| Legacy setup-step API handlers | Retained for compatibility; active onboarding uses company setup resources |
| Legacy NOB/LOB admin calls | Still active in admin masters; recorded as a migration gap |
| Existing company operations pages | Retained; readiness guard makes only gated areas read-only |
| Browser-stored auth/data | Replaced by HTTP-only session and `/api/v1` repositories |

Mock, proxy, and development-only hybrid behavior remain as documented in
`docs/api-modes.md`. Hybrid fallback is allowlisted and does not mask
authentication, authorization, validation, network, timeout, or server errors.
