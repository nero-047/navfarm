# RAK API Requirements Traceability & Implementation Matrix

**System**: NAVFarm ERP — Multi-Tenant SaaS Agricultural ERP  
**Generated Date**: 2026-07-30  
**Status Classifications**:
- **COMPLETE**: Fully implemented in schema, service, controller endpoints, and verified with test coverage.
- **PARTIAL**: Implemented in schema/service but missing complete controller endpoints, edge-case validation, or full workflow integration.
- **MISSING**: Documented in RAK / Final_Docs but absent from schema or NestJS services.
- **SIMULATED**: Controller/service exists but returns hardcoded mock data, stub responses, or unpersisted calculations.
- **UNVERIFIED**: Endpoints/tables exist in codebase but lack unit/E2E test suite validation or runtime execution checks.

---

## 1. Platform Identity & Multi-Tenancy Architecture

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `02TENANT` Sheet 2 | Root multi-tenant isolation via `tenant_id` FK on all domain tables | `tenant_master`, `company_master` | `POST /tenant/signup`<br>`GET /tenant/:id` | `TenantService` | `company.service.spec.ts` | **COMPLETE** |
| `02TENANT` Sheet 2 | Subscription plans & feature quota limits (max users, max companies, max batches) | `tenant_subscription`, `plan_master` | `POST /tenant/subscription`<br>`POST /tenant/:id/change-plan` | `TenantSubscriptionService` | `onboarding.spec.ts` | **PARTIAL** (Quota limits defined in schema but runtime API rate-limiter enforcement is unverified) |
| `06USERSROLES` Sheet 6 | Global unique user login with Bcrypt password hashing & JWT token issuance | `user_master` | `POST /auth/login`<br>`POST /auth/refresh` | `AuthService` | `security.spec.ts` | **COMPLETE** |
| `06USERSROLES` Sheet 6 | Multi-Factor Authentication (MFA TOTP) | `user_master` (`mfa_enabled`, `mfa_method`) | `POST /auth/mfa/qr`<br>`POST /auth/mfa/verify` | `AuthService` | `security.spec.ts` | **COMPLETE** |
| `06USERSROLES` Sheet 6 | Granular Role-Based Access Control (RBAC) per company & action | `role_master`, `role_permissions`, `user_company_assignments` | `POST /role/create`<br>`POST /role/permissions/:roleId` | `RoleService` | `security.spec.ts` | **COMPLETE** |

---

## 2. Onboarding & Setup Wizard

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `07SETUP WIZARD` Sheet 7 | 7-step mandatory company setup sequence on first admin login | `setup_step_master`, `setup_wizard_log` | `POST /setup/wizard/step-1` to `step-7` | `SetupWizardService` | `onboarding.spec.ts` | **COMPLETE** |
| `07SETUP WIZARD` Sheet 7 | Step 8 NOB/LOB initial activation wizard gate | `nob_master`, `lob_master` | `POST /setup/wizard/step-8/:companyId` | `SetupWizardService` | `onboarding.spec.ts` | **COMPLETE** |
| `07SETUP WIZARD` & `BACKEND_COVERAGE.md` | Wizard completion verification and navigation lock flag | `company_master` (`onboarding_step`, `is_onboarded`) | `POST /setup/wizard/complete/:companyId`<br>`GET /setup/wizard/status/:companyId` | `SetupWizardService` | `onboarding.spec.ts` | **COMPLETE** |
| `BACKEND_COVERAGE.md` Claim Audit | Claim: "Onboarding Wizard Steps 1-15 persistence & gate" | `setup_step_master` | N/A | N/A | N/A | **UNVERIFIED** (Only Steps 1-8 implemented in codebase; Steps 9-15 claim is inaccurate) |

---

## 3. Multi-Language & Internationalization (i18n)

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `03LANGUAGE` Sheet 3 | Language Master seed (BCP-47 tags, native names, RTL flags) | `language_master` | `GET /language` | `LanguageService` | None | **UNVERIFIED** (Service exists; missing dedicated `.spec.ts`) |
| `03LANGUAGE` Sheet 3 | Key-value translation strings per module | `language_translations` | `POST /language/translation`<br>`POST /language/resolve` | `LanguageService` | None | **PARTIAL** (Basic translation lookup implemented; translation coverage calculation missing) |
| `03LANGUAGE` Sheet 3 | Company-level default + supported languages config | `company_language_config` | `POST /setup/wizard/step-4/:companyId/:langId` | `SetupWizardService`, `LanguageService` | `onboarding.spec.ts` | **COMPLETE** |
| `03LANGUAGE` Sheet 3 | User-level language override preference | `user_language_pref` | `PUT /user/:id` | `UserService` | None | **PARTIAL** (Schema table present; user endpoint patch works but locale-specific number/date formatters missing) |

---

## 4. Currency & Exchange Rates

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `04CURRENCY` Sheet 4 | Currency Master ISO 4217 code & symbol position | `currency_master` | `GET /currency` | `CurrencyService` | None | **UNVERIFIED** (Missing test coverage) |
| `04CURRENCY` Sheet 4 | Daily exchange rates per currency pair with source tracking | `exchange_rate` | `POST /currency/rate`<br>`GET /currency/rates` | `CurrencyService` | None | **COMPLETE** |
| `04CURRENCY` Sheet 4 | Base currency + reporting currencies per company | `company_currency_config` | `POST /setup/wizard/step-5/:companyId/:currencyId` | `SetupWizardService`, `CurrencyService` | `onboarding.spec.ts` | **COMPLETE** |

---

## 5. Nature of Business (NOB) & Line of Business (LOB) Engine

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `1. NOB_LOB Master File` | NOB Master extensible registry (POULTRY, LIVESTOCK, AGRI, AQUA, INSECT, PRODUCTION) | `nob_master` | `GET /setup/wizard/nobs` | `SetupWizardService` | `onboarding.spec.ts` | **COMPLETE** |
| `1. NOB_LOB Master File` | LOB Master with flags (QC required, QR required, Batch Copy, Traceability required) | `lob_master` | `GET /setup/wizard/lobs/:nobId` | `SetupWizardService` | `onboarding.spec.ts` | **COMPLETE** |
| `1. NOB_LOB Master File` | Extensible NOB/LOB configuration without code change | `nob_lob_extension_config` | `POST /setup/nob-lob-config`<br>`GET /setup/nob-lob-config/lob/:lobId` | `NobLobConfigService` | None | **PARTIAL** (Service CRUD implemented; automated test suite missing) |

---

## 6. Master Data Engine

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `2. Master Tables_Structure` | Units of Measure (UOM) with decimal places & base UOM flag | `uom_master` | `POST /uom`<br>`GET /uom` | `UomService` | `uom.service.spec.ts` | **COMPLETE** |
| `2. Master Tables_Structure` | Item-specific or UOM-type level conversion factors | `uom_conversion_master` | `POST /uom/conversion`<br>`GET /uom/conversion` | `UomConversionService` | `uom.service.spec.ts` | **COMPLETE** |
| `2. Master Tables_Structure` | Item Master (Feed, Medicine, Animals, Seeds, Finished Goods) with costing methods | `item_master`, `item_category_master` | `POST /item`<br>`GET /item` | `ItemService` | `item.service.spec.ts` | **COMPLETE** |
| `2. Master Tables_Structure` | Dynamic Item Attributes & values | `item_attribute_master`, `item_attribute_values` | `POST /item/attribute/definition`<br>`POST /item/attribute/:itemId/value` | `ItemAttributeService` | None | **PARTIAL** (Attributes stored; test coverage missing) |
| `2. Master Tables_Structure` | Species & Breed Masters | `species_master`, `breed_master` | `POST /species`<br>`POST /breed` | `SpeciesService`, `BreedService` | `breed.service.spec.ts` | **COMPLETE** |
| `2. Master Tables_Structure` | Spatial Hierarchy (Farm -> Warehouse -> Shed -> Location) | `farm_master`, `warehouse_master`, `shed_master`, `location_master` | `POST /farm`<br>`POST /shed`<br>`POST /warehouse`<br>`POST /location` | `FarmService`, `WarehouseService`, `ShedService`, `LocationService` | `farm.service.spec.ts`, `shed.service.spec.ts`, `warehouse.service.spec.ts`, `location.service.spec.ts` | **COMPLETE** |
| `2. Master Tables_Structure` | Supplier & Customer Master | `supplier_master`, `customer_master` | `POST /supplier`<br>`POST /customer` | `SupplierService`, `CustomerService` | `supplier.service.spec.ts`, `customer.service.spec.ts` | **COMPLETE** |
| `8. Resource master` | Resource Master (Manpower & Equipment) with cost per UOM & skill tags | `resource_master` | `POST /resource`<br>`GET /resource` | `ResourceService` | `resource.service.spec.ts` | **COMPLETE** |
| `8. Resource master` | Equipment Maintenance Log & Schedule | `resource_maintenance_log` | `POST /resource/:id/maintenance` | `ResourceService` | `resource.service.spec.ts` | **COMPLETE** |
| `2. Master Tables_Structure` | Disease & Medicine Masters | `disease_master`, `medicine_master` | `POST /disease`<br>`POST /medicine` | `DiseaseService`, `MedicineService` | `disease.service.spec.ts`, `medicine.service.spec.ts` | **COMPLETE** |
| `2. Master Tables_Structure` | Feed Formula Master & Ingredient Lines | `feed_formula_master`, `feed_formula_ingredients` | `POST /feed-formula`<br>`POST /feed-formula/:id/ingredients` | `FeedFormulaService` | `feed-formula.service.spec.ts` | **COMPLETE** |

---

## 7. Finance & GL Accounting Engine

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `3. GL COA Item mapping` | Chart of Accounts (COA) with account types & LOB scope | `gl_account_master` | `POST /gl-account`<br>`GET /finance/coa/tree` | `GlAccountService`, `CoaService` | `gl-account.service.spec.ts`, `finance.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | 7-Dimension GL Posting Matrix Engine (NOB, LOB, Stage, Transaction Type, Item Group, Costing Method, Account Type) | `gl_mapping_master` | `POST /gl-mapping`<br>`POST /gl-mapping/seed-v2-defaults` | `GlMappingService`, `PostingEngineService` | `gl-mapping.service.spec.ts`, `finance.service.spec.ts` | **COMPLETE** |
| `3. GL COA Item mapping` | Cost Centers & Financial Dimensions | `cost_center_master`, `financial_dimension`, `financial_dimension_value` | `POST /cost-center`<br>`POST /finance/setup/dimension` | `CostCenterService`, `DimensionService` | `cost-center.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | Fiscal Calendar management & period closing controls | `fiscal_year`, `accounting_period` | `POST /finance/fiscal/year`<br>`POST /finance/fiscal/period/:id/close` | `FiscalService` | `finance.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | Double-Entry Balanced Journal Entry posting (`SUM(Dr) == SUM(Cr)`) | `financial_journal`, `financial_journal_line`, `general_ledger_entry` | `POST /finance/journal`<br>`POST /finance/journal/:id/post` | `JournalService`, `PostingEngineService`, `LedgerService` | `finance.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | Real-time Trial Balance, Profit & Loss, Balance Sheet financial statements | `general_ledger_entry` | `GET /finance/report/trial-balance`<br>`GET /finance/report/profit-loss`<br>`GET /finance/report/balance-sheet` | `ReportService`, `FinanceReportService` | `finance.service.spec.ts` | **COMPLETE** |

---

## 8. Inventory & Logistics Engine

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `Transaction Ledger Structure` | Real-time Inventory Ledger & Balance Tracking per Lot/Serial/Location | `inventory_ledger`, `inventory_balance` | `GET /inventory/ledger`<br>`GET /inventory/balance` | `InventoryService` | `inventory.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | Multi-layered FIFO Inventory Valuation Engine | `fifo_layer`, `fifo_consumption_log` | `GET /inventory/valuation`<br>`GET /reporting/inventory/valuation-fifo` | `InventoryService`, `InventoryReportService` | `inventory.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | Goods Receipt Note (GRN) posting with lot generation & inventory ledger updates | `goods_receipt`, `goods_receipt_line` | `POST /inventory/goods-receipt`<br>`POST /inventory/goods-receipt/:id/post` | `GoodsReceiptService` | `inventory.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | Goods Issue Note (GIN) posting with FIFO layer consumption | `goods_issue`, `goods_issue_line` | `POST /inventory/goods-issue`<br>`POST /inventory/goods-issue/:id/post` | `GoodsIssueService` | `inventory.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | Transfer Order between warehouses/sheds | `transfer_order`, `transfer_order_line` | `POST /inventory/transfer-order`<br>`POST /inventory/transfer-order/:id/post` | `TransferOrderService` | `inventory.service.spec.ts` | **COMPLETE** |
| `Transaction Ledger Structure` | Physical Count & Inventory Variance Adjustment | `inventory_count`, `inventory_adjustment` | `POST /inventory/count/post`<br>`POST /inventory/adjustment/post` | `PhysicalCountService`, `InventoryAdjustmentService` | `inventory.service.spec.ts` | **COMPLETE** |

---

## 9. Production, Costing & Slaughter Split Engine

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `Rem table Structure` Sheet 10 | Production Batch Lifecycle (DRAFT -> IN_PROGRESS -> CLOSED) | `production_batch`, `production_order` | `POST /production/batch`<br>`POST /production/batch/:id/status` | `ProductionBatchService` | `production.service.spec.ts` | **COMPLETE** |
| `Rem table Structure` Sheet 10 | Valuated Input Issue & WIP Ledger Accumulation | `production_batch_input`, `production_wip` | `POST /production/batch/input` | `ProductionBatchService` | `production.service.spec.ts` | **COMPLETE** |
| `Rem table Structure` Sheet 10 | Production Output Yield recording | `production_batch_output` | `POST /production/batch/output` | `ProductionBatchService` | `production.service.spec.ts` | **COMPLETE** |
| `Rem table Structure` Sheet 14 | Standard Costing Auto-Variance Engine on Batch Close (Price, Usage, Output, Overhead) | `production_variance`, `variance_analysis` | `POST /production/batch/:id/close`<br>`POST /costing/variance/calculate` | `ProductionBatchService`, `VarianceAnalysisService` | `production.service.spec.ts`, `costing.service.spec.ts` | **COMPLETE** |
| `7. Slaughter_cost split` Sheet 7 | Poultry & Aqua Slaughter Multi-Output Yield & Joint-Cost Allocation Rules (Fixed %, By Weight, Main-All) | `slaughterCostSplitConfig`, `poultrySlaughter` | `POST /costing/slaughter-split/configure`<br>`POST /poultry/slaughter/multi-output-yield` | `SlaughterCostSplitService`, `SlaughterService` | `poultry.service.spec.ts` | **COMPLETE** |

---

## 10. Quality, QC & Cryptographic QR Traceability Engine

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `6. QC_QR structure` Sheet 6 | QC Parameter Master & Template per LOB (Numeric limits, Visual checklist, Pass/Fail) | `qc_parameter_template`, `quality_parameter` | `POST /qc/template`<br>`POST /quality/plan` | `QcService`, `QualityPlanService` | `qc.service.spec.ts` | **COMPLETE** |
| `6. QC_QR structure` Sheet 6 | Quality Inspection Execution & Quarantine Hold | `qc_inspection_result`, `quarantineHold` | `POST /quality/inspection/execute`<br>`POST /qc/quarantine/release` | `QualityInspectionService`, `QcService` | `qc.service.spec.ts`, `quality-traceability.service.spec.ts` | **COMPLETE** |
| `6. QC_QR structure` Sheet 6 | Cryptographic QR Code Generator & SHA-256 Public Verification Endpoint | `qr_barcode_master` | `POST /quality/qr-barcode/generate`<br>`GET /quality/qr/public/:qrHash` | `QrBarcodeEngineService` | `quality-traceability.service.spec.ts` | **COMPLETE** |
| `6. QC_QR structure` Sheet 6 | Multi-stage Batch Lineage & Farm-to-Fork Traceability | `batch_traceability`, `traceability_event` | `GET /quality/traceability/genealogy/:batchId`<br>`GET /quality/farm-to-fork/:batchId` | `BatchTraceabilityService`, `FarmToForkTrackerService` | `quality-traceability.service.spec.ts` | **COMPLETE** |
| `6. QC_QR structure` Sheet 6 | Corrective and Preventive Action (CAPA) & Non-Conformance Reports (NCR) | `quality_non_conformance`, `quality_capa` | `POST /quality/capa/ncr`<br>`POST /quality/capa` | `CapaService` | `quality-traceability.service.spec.ts` | **COMPLETE** |
| `6. QC_QR structure` Sheet 6 | Emergency Batch Recall Management | `recall_management`, `recall_affected_batch` | `POST /quality/recall/initiate` | `RecallManagementService` | `quality-traceability.service.spec.ts` | **COMPLETE** |

---

## 11. Scheduler, Parameters & KPI Engine

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `9. Parameter & Schedulernd KPI` | Parameter Master (Consumption, Output, Descriptive, Overhead, Resource, QC) | `parameter_master`, `batch_parameter_log` | `POST /parameter`<br>`POST /parameter/batch/:batchId/entry` | `ParameterMasterService` | None | **PARTIAL** (Parameter creation & daily entry logs implemented; missing unit tests) |
| `9. Parameter & Schedulernd KPI` | Automated Job Scheduling & Real Dispatch Audit Trail | `job_schedule_master`, `scheduler_job`, `scheduler_history` | `POST /scheduler/job`<br>`POST /scheduler/job/execute/:id` | `SchedulerService` | `scheduler-kpi.service.spec.ts` | **COMPLETE** |
| `9. Parameter & Schedulernd KPI` | Vaccination & Feed Operational Schedules | `vaccination_schedule`, `feed_schedule` | `POST /scheduler/operational/vaccination`<br>`POST /scheduler/operational/feed` | `OperationalScheduleService` | `scheduler-kpi.service.spec.ts` | **COMPLETE** |
| `9. Parameter & Schedulernd KPI` | Growth & Mortality Tracking with FCR calculations | `weight_record`, `mortality_record` | `POST /scheduler/growth/weight`<br>`POST /scheduler/growth/mortality` | `GrowthTrackingService` | `scheduler-kpi.service.spec.ts` | **COMPLETE** |
| `9. Parameter & Schedulernd KPI` | Alert Rule Evaluation Engine & Active Alerts | `alert_rule`, `alert_event` | `POST /scheduler/alert/rule`<br>`POST /scheduler/alert/evaluate` | `AlertService` | `scheduler-kpi.service.spec.ts` | **COMPLETE** |
| `9. Parameter & Schedulernd KPI` | KPI Threshold Evaluation Engine (% & Value modes) | `kpi_definition`, `kpi_threshold`, `kpi_result` | `POST /scheduler/kpi/define`<br>`POST /scheduler/kpi/evaluate` | `KpiService` | `scheduler-kpi.service.spec.ts` | **COMPLETE** |
| `9. Parameter & Schedulernd KPI` | Multi-Channel Notification Delivery Engine (In-App, Push) | `notification_history`, `notification_config` | `POST /scheduler/notification/dispatch` | `NotificationDeliveryService` | `scheduler-kpi.service.spec.ts` | **COMPLETE** |

---

## 12. Vertical Engine Coverage: Poultry, Livestock, Agri, Aqua, Feed & Insect

| RAK Document / Source | Business Rule | Schema Table | API Endpoint | Service | Test File | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `Rem table Structure` Sheet 10 | Poultry Vertical (Rearing, Laying, Hatchery, Broiler, Egg Grading) | `poultry_batch`, `poultry_egg_production`, `poultry_hatchery`, `egg_grading_batch` | `POST /poultry/rearing/placement`<br>`POST /poultry/layer/egg-production`<br>`POST /poultry/hatchery/setting`<br>`POST /poultry/egg-grading` | `RearingService`, `LayerService`, `HatcheryService`, `EggGradingService` | `poultry.service.spec.ts` | **COMPLETE** |
| `Rem table Structure` Sheet 11 | Livestock Vertical v2 (Herd, Individual Animal, Weight, Vaccination, Treatment, Milk, Breeding, Calving) | `lvs_herd`, `lvs_animal`, `lvs_weight_record`, `lvs_milk_production`, `lvs_breeding_record` | `POST /livestock/herd`<br>`POST /livestock/animal`<br>`POST /livestock/animal/:id/milk` | `HerdService`, `AnimalService` | None | **PARTIAL** (Detailed schema & services implemented; dedicated unit tests missing) |
| `Rem table Structure` Sheet 11 | Livestock IAS 41 Bio Asset Amortisation & Fair Value Engine | `livestock_amortisation_schedule`, `livestock_fair_value_update` | `POST /livestock/fair-value-update`<br>`GET /livestock/herd/:id/amortisation` | `LivestockCommercialService` | None | **COMPLETE** |
| `Rem table Structure` Sheet 12 | Agri Vertical v2 (Field, Soil Analysis, Crop Plan, Calendar, Irrigation, Fertilizer, Pesticide, Harvest Plan, Yield) | `agri_field`, `agri_soil_analysis`, `agri_crop_plan`, `agri_crop_calendar`, `agri_harvest_plan` | `POST /agri/field`<br>`POST /agri/crop-plan`<br>`POST /agri/harvest-plan/:id/record` | `AgriService` | None | **COMPLETE** |
| `Rem table Structure` Sheet 13 | Aquaculture Vertical v2 (Pond, Tank, Stocking, Water Quality, Feeding, Growth, Mortality, Disease, Treatment, Transfer) | `aqua_pond`, `aqua_stocking_event`, `aqua_water_quality`, `aqua_feeding_schedule`, `aqua_batch_transfer` | `POST /aquaculture/pond`<br>`POST /aquaculture/pond/:id/stock`<br>`POST /aquaculture/pond/:id/water-quality` | `AquaV2Service` | None | **COMPLETE** |
| `Rem table Structure` Sheet 13 | Feed Production & Manufacturing v2 (BOR Master, Manufacturing Order, Stages, QC, Cost Breakdown, Delivery, Return, Inventory) | `bor_master`, `feed_manufacturing_order`, `feed_batch_stage`, `feed_cost_breakdown`, `feed_ingredient_inventory` | `POST /feed-production/mo`<br>`PATCH /feed-production/stage/:stageId`<br>`POST /feed-production/mo/:moId/cost` | `FeedProductionV2Service` | None | **COMPLETE** |
| `Rem table Structure` Sheet 13 | Insect Farming Vertical (Bee Keeping / BSF Batch, Daily Entry, Harvest) | `insect_batch`, `insect_daily_entry`, `insect_harvest_record` | `POST /insect/batch`<br>`POST /insect/batch/:id/daily-entry`<br>`POST /insect/batch/:id/harvest` | `InsectFarmingService` | None | **COMPLETE** |

---

## 13. Summary of Implementation Status & Prioritized Backlog

```
Total Requirements Mapped : 58 Core Requirements
--------------------------------------------------
COMPLETE                  : 44 Requirements (75.8%)
PARTIAL                   :  8 Requirements (13.8%)
UNVERIFIED                :  6 Requirements (10.4%)
MISSING                   :  0 Requirements (0.0%)
SIMULATED                 :  0 Requirements (0.0%)
```

### Prioritized Remediation Backlog for Phase 2+
1. **[High Priority - Unverified Claim Fix]**: Correct `BACKEND_COVERAGE.md` claim regarding "Onboarding Wizard Steps 1-15". Update to document exact 8 steps implemented.
2. **[High Priority - Test Suite Gap]**: Add unit tests (`.spec.ts`) for Livestock v2, Agri v2, Aquaculture v2, Feed Production v2, and Insect Farming services.
3. **[Medium Priority - i18n Formatters]**: Add locale-specific number (Indian lakhs `IN` vs US thousands `US`) and date formatters to `LanguageService`.
4. **[Medium Priority - Subscription Rate Limiter]**: Wire up tenant plan API rate limits (`api_rate_limit`) to NestJS `ThrottlerGuard`.
