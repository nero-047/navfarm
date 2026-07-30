# NAVFarm Frontend Demo Presentation Guide

This is a 10–15 minute walkthrough of the local frontend demo. Use mock mode
only. The listed accounts, password `Demo123!`, MFA code `123456`, and recovery
code `NAVFARM-RECOVERY` are public demo fixtures—not real credentials. Reset
between independent scenarios with **Reset demo data** in the account menu or
login demo-account area. The development server must have mock reset enabled.

| Time | Account | Route | Action | Expected result |
| --- | --- | --- | --- | --- |
| 1 min | `system@navfarm.demo` | `/admin/dashboard` | Sign in and open Tenants, Plans, and Audit logs. | Platform scope is explicit; tenant health and catalogue data are visibly demo data. |
| 1 min | `tenant@navfarm.demo` | `/console/dashboard` | Review Companies, Team management, Usage, and open the header notification bell. | Tenant administration is distinct, has no Tenant switcher, and shows only relevant notifications. |
| 2 min | `companyadmin@navfarm.demo` | `/green-valley-poultry/overview` | Open Setup and Readiness. | Company administration works without an active workspace; policy-pending readiness notes remain non-blocking. |
| 1 min | `companyadmin@navfarm.demo` | `/green-valley-poultry/members` | Inspect Workspace Manager, then Roles & permissions. | Company roles and explicit operational workspace assignments remain separate; the dialog is keyboard closable. |
| 1 min | `multi@navfarm.demo` | `/context-selection` | Enter Poultry Operations, open the switcher, and choose Company administration or another assigned workspace. | Only Companies and Workspaces appear. Tenant/Organisation switching is absent and context changes atomically. |
| 2 min | `manager@navfarm.demo` | `/green-valley-poultry/workspaces/poultry-operations/dashboard` | Open Batches, Operations, Quality, Traceability, Resources, and Costing. | Company/workspace identity and operational role stay visible; Manager mutation controls are available. |
| 1 min | `viewer@navfarm.demo` | `/green-valley-poultry/workspaces/poultry-operations/batches` | Inspect batches and Operations. | The same workspace is readable, but New batch, Record entry, QC, and other mutation controls are absent. |
| 1 min | `multi@navfarm.demo` | `/context-selection` | Switch from Poultry Operations to Harvest Ridge Crop Production. | Supported list destinations may be preserved; record IDs never cross workspaces. |
| 1 min | `mfa@navfarm.demo` | `/login` | Sign in, enter the demo MFA code, then repeat with the recovery flow if desired. | Protected routes remain unavailable until the typed mock challenge is completed. |
| 1 min | `suspended@navfarm.demo` | `/login` | Sign in and use Sign out from the suspended state. | A specific suspended-account explanation appears; no generic or blank access page is shown. |
| 1 min | Manager → Accountant | Workspace Batches → `/login` | Sign out from Manager and sign in as Accountant. | Sign-out opens clean `/login`; Accountant lands on accounting readiness without inheriting the workspace route or showing Access Denied. |
| 1 min | `manager@navfarm.demo` | Workspace dashboard | Open the bell, mark one item read, mark all read, then press Escape. | Count changes immediately, the panel closes, and focus returns to the bell. |

Presentation notes:

- Use the header theme control to show light/dark persistence. Theme storage is
  a UI preference only and is never used for session or business state.
- At mobile width, demonstrate the focus-contained navigation drawer and the
  full-height Company/Workspace switcher plus the 390×844 notification dialog.
- Normal Sign out preserves demo mutations. **Reset demo data** restores sample
  accounts, permissions, records, and notification unread state, invalidates
  all existing sessions, and returns to clean `/login`.
- `/trace/green-valley-poultry/PACK-2026-001` is public-safe and contains no
  protected navigation or internal permission controls.
- All users, companies, workspaces, operations, accounting, QR, and trace
  values shown in this walkthrough are typed local fixtures. The demo does not
  claim production authentication, durable persistence, email delivery,
  compliance certification, authoritative costing, or a connected backend.

If a scenario contains stale mutations, use **Reset demo data** and sign in
again. If reset is unavailable, confirm the server was started with mock reset
enabled; otherwise restart the local mock server.
