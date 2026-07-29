import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { DatabaseModule } from './core/database/database.module';

// ── 1. PLATFORM & IDENTITY BOUNDED CONTEXT
import { TenantModule } from './modules/platform-identity/tenant/tenant.module';
import { CompanyModule } from './modules/platform-identity/company/company.module';
import { PlanModule } from './modules/platform-identity/plan/plan.module';
import { AuthModule } from './modules/platform-identity/auth/auth.module';
import { SetupWizardModule } from './modules/platform-identity/setup-wizard/setup-wizard.module';
import { RoleModule } from './modules/platform-identity/role/role.module';
import { LanguageModule } from './modules/platform-identity/language/language.module';
import { CurrencyModule } from './modules/platform-identity/currency/currency.module';
import { AuditLogModule } from './modules/platform-identity/audit-log/audit-log.module';
import { NotificationModule } from './modules/platform-identity/notification/notification.module';
import { UserModule } from './modules/platform-identity/user/user.module';
import { UserCompanyModule } from './modules/platform-identity/user-company/user-company.module';
import { TenantSubscriptionModule } from './modules/platform-identity/tenant-subscription/tenant-subscription.module';

// ── 2. MASTER DATA BOUNDED CONTEXT
import { UomModule } from './modules/master-data/uom/uom.module';
import { BreedModule } from './modules/master-data/breed/breed.module';
import { FarmModule } from './modules/master-data/farm/farm.module';
import { WarehouseModule } from './modules/master-data/warehouse/warehouse.module';
import { LocationModule } from './modules/master-data/location/location.module';
import { ShedModule } from './modules/master-data/shed/shed.module';
import { ItemCategoryModule } from './modules/master-data/item-category/item-category.module';
import { ItemModule } from './modules/master-data/item/item.module';
import { SupplierModule } from './modules/master-data/supplier/supplier.module';
import { CustomerModule } from './modules/master-data/customer/customer.module';
import { ResourceModule } from './modules/master-data/resource/resource.module';
import { DiseaseModule } from './modules/master-data/disease/disease.module';
import { MedicineModule } from './modules/master-data/medicine/medicine.module';
import { UomConversionModule } from './modules/master-data/uom-conversion/uom-conversion.module';
import { ItemAttributeModule } from './modules/master-data/item-attribute/item-attribute.module';
import { NobLobConfigModule } from './modules/master-data/nob-lob-config/nob-lob-config.module';
import { ParameterMasterModule } from './modules/master-data/parameter-master/parameter-master.module';

// ── 3. FINANCE & ACCOUNTING BOUNDED CONTEXT
import { GlAccountModule } from './modules/finance-accounting/gl-account/gl-account.module';
import { GlMappingModule } from './modules/finance-accounting/gl-mapping/gl-mapping.module';
import { CostCenterModule } from './modules/finance-accounting/cost-center/cost-center.module';
import { FinanceModule } from './modules/finance-accounting/finance/finance.module';

// ── 4. INVENTORY & LOGISTICS BOUNDED CONTEXT
import { InventoryModule } from './modules/inventory-logistics/inventory/inventory.module';

// ── 5. PRODUCTION & COSTING BOUNDED CONTEXT
import { ProductionModule } from './modules/production-costing/production/production.module';
import { CostingModule } from './modules/production-costing/costing/costing.module';
import { SlaughterSplitModule } from './modules/production-costing/slaughter-cost-split/slaughter-split.module';

// ── 6. QUALITY & TRACEABILITY BOUNDED CONTEXT
import { QualityTraceabilityModule } from './modules/quality-traceability/quality-traceability.module';
import { QcModule } from './modules/quality-traceability/qc/qc.module';

// ── 7. OPERATIONAL VERTICALS BOUNDED CONTEXT
import { PoultryModule } from './modules/verticals/poultry/poultry.module';
import { EggGradingModule } from './modules/verticals/egg-grading/egg-grading.module';
import { LivestockV2Module } from './modules/verticals/livestock-v2/livestock-v2.module';
import { AgriV2Module } from './modules/verticals/agri-v2/agri-v2.module';
import { AquacultureV2Module } from './modules/verticals/aquaculture-v2/aquaculture-v2.module';
import { FeedProductionV2Module } from './modules/verticals/feed-production-v2/feed-production-v2.module';
import { FeedFormulaModule } from './modules/verticals/feed-formula/feed-formula.module';
import { InsectFarmingModule } from './modules/verticals/insect-farming/insect-farming.module';

// ── 8. INTELLIGENCE & REPORTING BOUNDED CONTEXT
import { SchedulerKpiModule } from './modules/intelligence-reporting/scheduler-kpi/scheduler-kpi.module';
import { ReportingBiModule } from './modules/intelligence-reporting/reporting-bi/reporting-bi.module';

import { TenantMiddleware } from './common/middlewares/tenant.middleware';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { SystemController } from './system/system.controller';

@Module({
  imports: [
    // Global environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
      load: [appConfig, databaseConfig],
    }),

    // Context tracking for requests
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),

    // Global Drizzle Database connection pool
    DatabaseModule,

    // 1. Platform & Identity
    TenantModule,
    CompanyModule,
    PlanModule,
    AuthModule,
    SetupWizardModule,
    RoleModule,
    LanguageModule,
    CurrencyModule,
    AuditLogModule,
    NotificationModule,
    UserModule,
    UserCompanyModule,
    TenantSubscriptionModule,

    // 2. Master Data
    UomModule,
    BreedModule,
    FarmModule,
    WarehouseModule,
    LocationModule,
    ShedModule,
    ItemCategoryModule,
    ItemModule,
    SupplierModule,
    CustomerModule,
    ResourceModule,
    DiseaseModule,
    MedicineModule,
    UomConversionModule,
    ItemAttributeModule,
    NobLobConfigModule,
    ParameterMasterModule,

    // 3. Finance & Accounting
    GlAccountModule,
    GlMappingModule,
    CostCenterModule,
    FinanceModule,

    // 4. Inventory & Logistics
    InventoryModule,

    // 5. Production & Costing
    ProductionModule,
    CostingModule,
    SlaughterSplitModule,

    // 6. Quality & Traceability
    QualityTraceabilityModule,
    QcModule,

    // 7. Verticals
    PoultryModule,
    EggGradingModule,
    LivestockV2Module,
    AgriV2Module,
    AquacultureV2Module,
    FeedProductionV2Module,
    FeedFormulaModule,
    InsectFarmingModule,

    // 8. Intelligence & Reporting
    SchedulerKpiModule,
    ReportingBiModule,
  ],
  controllers: [SystemController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
