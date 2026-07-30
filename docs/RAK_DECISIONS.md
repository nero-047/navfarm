# RAK Business Decisions & Architectural Conflicts Log

**Document Purpose**: Record and analyze open business decisions, document discrepancies, costing conflicts, onboarding step variations, and language requirements across all RAK Excel sheets, wireframes, and backend code.

---

## 1. Onboarding & Setup Wizard Step Sequence Conflict

### Description
There is a structural conflict in the number and definition of mandatory onboarding steps between RAK documents, wireframe PDFs, code implementation, and system documentation.

### Conflict Matrix
- **RAK Excel (`07SETUP WIZARD`)**: Specifies **7 mandatory seed setup steps**:
  1. `STEP COMPANY PROFILE` (Company name, type, registration, logo)
  2. `STEP ADDRESS` (Registered & farm addresses, GPS coordinates)
  3. `STEP CONTACTS` (Owner, Farm Manager, Accountant)
  4. `STEP LANGUAGE` (Default company language)
  5. `STEP CURRENCY` (Base accounting currency)
  6. `STEP TIMEZONE` (Timezone, country, state)
  7. `STEP FISCAL` (Fiscal year start month, accounting standard, valuation method)
- **NestJS Codebase (`setup-wizard.controller.ts`)**: Implements **8 explicit wizard steps**:
  - Steps 1-7 match RAK Excel.
  - **Step 8**: `POST /setup/wizard/step-8/:companyId` (NOB/LOB initial activation selection).
- **`BACKEND_COVERAGE.md`**: Erroneously claims "Onboarding Wizard (Steps 1-15 persistence & gate)".

### Status & Resolution Recommendation
- **Decision**: Formally standardize the Onboarding Wizard to **8 Steps** (Steps 1-7 core profile + Step 8 NOB/LOB activation gate).
- **Action**: Correct `BACKEND_COVERAGE.md` to remove the unverified claim of "Steps 1-15".

---

## 2. Biological Asset Costing & Valuation (IAS 41 vs Standard Costing)

### Description
RAK documents describe two different costing methodologies for biological assets depending on the Nature of Business (NOB) and Line of Business (LOB):
1. **Standard Costing with Auto-Variance**: Applied to short-cycle commercial batches (e.g. Broiler `PLT_CB`, Commercial Piggery, Commercial Crops). Standard cost targets are predefined, and 4 variance types (Price, Usage, Output, Overhead) are posted upon batch closure.
2. **IAS 41 Biological Asset Valuation**: Applied to long-cycle multi-stage assets (e.g. Dairy Cattle `LVS_COW`, Breeder Pigs `LVS_BREEDING`, Fruit Trees `AGRI_FRUIT`, Fish Ponds `AQUA_FISH`). Costs accumulate into a non-current asset (NCA) during the premature stage, convert to mature stage upon maturity, and undergo monthly amortisation plus periodic Fair Value adjustments (`FAIR_VALUE_ADJUST`).

### Conflict / Ambiguity
- In RAK document `1. NOB_LOB Master File.xlsx`, `nob_master.default_costing_method` was set to fixed defaults (e.g., `STANDARD` for Poultry, `BIO_ASSET` for Livestock). However, in `Final_Docs/1. NOB_LOB Master File.xlsx`, `nob_master.default_costing_method` states `TO BE DEFINE IN THE LOB`, indicating costing methods must be scoped at the **LOB level**, not the NOB level.

### Status & Resolution Recommendation
- **Decision**: Costing methods are strictly defined per **LOB** via `allowed_costing_methods` (e.g. `PLT_LAYING` allows both `STANDARD` and `FIFO`; `LVS_BREEDING` allows `BIO_ASSET`, `STANDARD`, `FIFO`, and `AVG`).
- **Action**: Verified against `nob_lob_extension_config` table and `SlaughterCostSplitService`.

---

## 3. Slaughter Yield & Joint-Cost Split Behavior

### Description
Slaughter operations in Poultry (`PLT_SLAUGHTER`) and Aquaculture (`AQUA_SLAUGHTER`) take 1 live animal/fish input and yield multiple output items (e.g. Carcass 75%, Offal 11%, Wings 12%, Waste 2%).

### Decision Matrix for Cost Split Methods
RAK Document `7. Slaughter_cost split.xlsx` defines 3 joint-cost split methods:
- **Method A (`FIXED_PCT`)**: Costs allocated to main product and by-products based on fixed predefined percentages (e.g. 75% Carcass, 11% Offal, 12% Wings).
- **Method B (`BY_WEIGHT`)**: Costs allocated proportionally based on actual output weight of each yield line.
- **Method C (`MAIN_ALL`)**: Main product receives 100% of input batch cost; by-products are valued at Net Realisable Value (NRV) or zero cost.

### Status & Resolution Recommendation
- **Decision**: Support all 3 methods dynamically per slaughter batch via `slaughterCostSplitConfig`. System offers historical percentage suggestions (`suggested_by_system`), which users can override (`user_confirmed`).
- **Action**: Verified implementation in `slaughter-split.controller.ts` and `SlaughterCostSplitService`.

---

## 4. Multi-Language & Internationalization (i18n) Rules

### Description
RAK Document `03.Language` mandates comprehensive internationalization rules:
- **Default Language**: English (`en`).
- **Company Default**: Admin sets company default UI language during onboarding Step 4 (`company_language_config`).
- **User Preference**: Individual user can override company default language (`user_language_pref`).
- **RTL Support**: Script flags (`is_rtl = TRUE` for Arabic, Urdu) trigger Right-to-Left layout.
- **Number & Date Formatting**:
  - `number_format`: `IN` (Indian lakhs/crores, e.g. `1,00,000.00`) vs `US` (thousands, e.g. `100,000.00`) vs `EU` (`100.000,00`).
  - `decimal_separator`: `.` or `,`.
  - `thousands_separator`: `,` or `.`.

### Conflict / Ambiguity
- Database schema stores `number_format`, `date_format`, `decimal_separator`, and `thousands_separator` in `language_master`. However, backend DTOs and API responses currently emit raw ISO numeric values without locale formatting helpers.

### Status & Resolution Recommendation
- **Decision**: Keep API responses in unformatted raw IEEE floating/decimal numeric format (`DECIMAL(18,4)`) for clean SDK integration, while embedding locale format metadata in `/language/resolve` for client-side rendering.

---

## 5. Summary of Unresolved Business Decisions & Action Items

| ID | Topic | Decision | Action Item |
| --- | --- | --- | --- |
| **DEC-01** | Onboarding Steps | Standardize on 8 Steps | Update `BACKEND_COVERAGE.md` to correct claims. |
| **DEC-02** | Costing Scoping | LOB-level costing configuration | Retain `allowed_costing_methods` in `lob_master`. |
| **DEC-03** | Joint-Cost Allocation | Support FIXED_PCT, BY_WEIGHT, and MAIN_ALL | Standardize `SlaughterCostSplitService`. |
| **DEC-04** | Locale Formatting | Raw numbers in API; format metadata in i18n endpoint | Maintain raw decimal responses in API envelope. |
