# Client master template audit — every field, checked

Prepared 2026-09-06, ahead of the M2 Blueprint Sign-off on 2026-09-08.
Source: the seven templates in `OneDrive_1_04-09-2026/Master Templates/`.
Checked against `apps/api/src/core/database/schema.ts`, the live `tenant_devco`
database, the API DTOs, and `apps/web/src/modules/master-data/configs.ts`.

## Result

**169 template fields. 164 present. 5 gaps.**

| Template (sheet) | Fields | Present | Gaps |
|---|---:|---:|---:|
| Unit Of Measure | 3 | 3 | 0 |
| Unit Of Measure — UOM Conversion | 4 | 4 | 0 |
| Item Master | 26 | 26 | 0 |
| Item Master — Item Attribute | 9 | 8 | 1 |
| Resource Master | 15 | 15 | 0 |
| Stage Master | 14 | 14 | 0 |
| Animal Register | 39 | 38 | 1 |
| Breed Master | 17 | 16 | 1 |
| Breed Master — Breed Lifecycle | 28 | 26 | 2 |
| Location Master | 14 | 14 | 0 |
| **Total** | **169** | **164** | **5** |

Names differ constantly between the templates and our columns — "Base UOM" is
`uom_primary`, "Nos. of Teats" is `no_of_teats`, "Next Service Date" is
`next_maintenance_date`, "Monthly Amortisation" is `amortisation_monthly`.
Every one of those was matched by concept, not by string, because an exact-name
grep produced four false "missing" calls earlier in this project.

---

## The 5 gaps

### 1. Animal Register — "Age at Entry Weeks" — genuinely absent
Template: mandatory NO. There is no column, and nothing computes it: a search
across the API and web source for `age_at_entry`, `age_in_weeks` and `entry_age`
returns nothing. It is **derivable** from `dob` and `entry_date`, which we both
hold, so this is a display/computed-field decision rather than missing data.
**Cheapest honest fix:** compute it for display; do not store it.

### 2. Breed Master — "Residual Value Amount" vs our `residual_value_pct`
The template asks for an **amount**. We store a **percentage**
(`breed_master.residual_value_pct`, decimal 5,2). These are not the same field
and cannot be silently reconciled — a 5,2 decimal cannot even hold a dollar
residual.

Note `animal_register.residual_value` **is** an amount (decimal 18,4), so the
amount exists per animal but not per breed. The Bio Asset BBP gives a formula —
"expected weight 150 kg multiplied by 2.05, resulting in 307.50" — which is an
amount, supporting the template. **This one needs a client answer, not a guess.**

### 3 & 4. Breed Lifecycle sheet — "CATEGORY" and "Teats"
Neither exists on `breed_lifecycle_stages`.

- **Teats** exists as `animal_register.no_of_teats`, i.e. per animal. The
  template puts it on the *lifecycle* sheet, which reads as a per-stage
  **standard** (BBP §6 makes teat count ≥ 15 a hard block on gilt selection, so a
  standard to check against is plausible). Marked mandatory YES in the template.
- **CATEGORY** — column 3 of the lifecycle sheet, mandatory blank. Its meaning is
  not clear from the template alone; it may be the animal category (GGP/GP/PS).
  **UNCERTAIN — worth asking rather than assuming.**

### 5. Item Attribute — "Blocked"
We have `is_active` and `status`, not `is_blocked`. Functionally the same control,
and the UI exposes it as a toggle. Inconsistent with `item_master.is_blocked` and
`breed_master.is_blocked`, which do use that name. **Cosmetic; no data is lost.**

---

## In the database but not on the form

Everything the templates ask for is reachable on a form **except one**:

- **`breed_lifecycle_stages.resource_requirements`** — the template asks for
  "Resource Requirements", the column exists, and there is **no field for it in
  the Breed Lifecycle form**. A user cannot fill a field the client asked for.
  This is the only true form gap and it is a one-line config addition.

The other unexposed columns are ours, not the templates': `is_active` and
`status` everywhere (driven by the row toggle rather than a form field, by
design), plus `item.posting_group` / `qr_trigger_event` /
`is_biological_costing_method`, `stage.icon_code` / `sort_order` / `is_system`,
`breed.species` / `premature_years`, and `location.gps_latitude` /
`gps_longitude` / `current_count` / `is_quarantine_zone` / `last_cleaned_date` /
`last_disinfected_date`. No template asks for any of them.

---

## Where we exceed the templates

Worth knowing before anyone calls it scope creep — each of these is either
BBP-driven or was requested directly:

- **UOM**: `uom_type`, `decimal_places`, `is_base_uom` — the template asks only
  for id, code and name. `is_base_uom` is what the UOM Conversion sheet means by
  "Always converts TO base UOM".
- **UOM Conversion**: `effective_from` / `effective_to` (time-bounded factors) and
  `conversion_code`.
- **Location**: GPS coordinates, quarantine flag, cleaning and disinfection dates —
  GPS is BBP §1.2.
- **Resource**: a full maintenance block (`asset_make`, `asset_model`,
  `asset_serial_no`, `purchase_date`, `warranty_expiry_date`,
  `maintenance_frequency_days`, `last_maintenance_date`,
  `maintenance_cost_per_service`, `maintenance_vendor`).
- **Animal**: `disposal_value`, `gain_loss_on_disposal`, `operational_area_id`,
  `ear_tag_image_url`.
- **Stage**: `stage_sequence`, `scheduler_auto_create`.

---

## Confidence

High on presence/absence: every field was checked against the live database as
well as the schema file, and matched by concept rather than by name. The two
places I would not act without asking the client are **CATEGORY** on the
lifecycle sheet, whose meaning the template does not give, and **Residual Value
Amount vs percentage**, where the template and our schema genuinely disagree
about what the number is.

Not covered here: the templates' *example values* and validation rules
(dropdown value lists, conditional-mandatory logic). This audit answers "does the
field exist", not "does it accept exactly what the client will type".

---

## Currency configuration — resolved and outstanding (added 2026-09-06)

Rishi: residual value is **a rate that computes the amount**, not a stored
figure; currency belongs in company config as a base and a local currency, and
entries are in base currency only.

**Resolved.** `breed_master.residual_value_pct` stays a rate — no change needed,
and no amount column should be added to the breed.

**Fixed.** Two tables held the base currency and had drifted apart:
`company_master.base_currency_id` said USD while `company_currency_config` still
flagged INR as both base and reporting. They now agree on USD, base and
reporting, matching BBP-1 §1.1 ("USD. All financial values stored in USD").
Note the app reads `company_master.base_currency_id` (`useCompanyCurrency`), so
the config table was the stale one and nothing on screen was wrong — but two
sources for one fact is a defect waiting to surface.

**Outstanding, and BBP-mandatory:**

1. **No exchange-rate field exists anywhere in the schema.** BBP-1 §1.1 requires
   "Exchange Rate (USD/ZWL) | Decimal(6) | Manual entry by Finance. Alert fires
   if not updated in 7 days", marked mandatory. A search across every column in
   the tenant database for `exchange`, `fx` and `conversion_rate` returns
   nothing. Without it the reporting-currency requirement cannot be met.
2. **ZWL is not in `currency_master`.** It holds exactly two rows, INR and USD.
   The BBP treats ZWL as the foreign currency against USD, so it has to exist
   before any rate can be recorded against it.
3. **Note the BBP contradicts itself on reporting currency** — the §1.1
   flowchart says ZWL, the §1.1 field spec says USD. Set to USD here, following
   the field spec, but see §2 #1 of the evidence pack.

One nuance worth confirming with the client: the documents describe the residual
rate as a **price per kilogram** — the Bio Asset BBP's "expected weight 150 kg
multiplied by 2.05, resulting in 307.50" and the 20 Aug MOM's "Sale Price per Kg
(e.g. $2.50)". Our column is a **percentage** (`decimal(5,2)`). Both are rates
that compute an amount, but they are not the same rate, and a per-kg rate is
itself currency-denominated.
