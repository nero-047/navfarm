import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { DatabaseModule } from './core/database/database.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CompanyModule } from './modules/company/company.module';
import { PlanModule } from './modules/plan/plan.module';
import { AuthModule } from './modules/auth/auth.module';
import { SetupWizardModule } from './modules/setup-wizard/setup-wizard.module';
import { RoleModule } from './modules/role/role.module';
import { LanguageModule } from './modules/language/language.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UserModule } from './modules/user/user.module';
import { UserCompanyModule } from './modules/user-company/user-company.module';
import { UomModule } from './modules/uom/uom.module';
import { BreedModule } from './modules/breed/breed.module';
import { FarmModule } from './modules/farm/farm.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { LocationModule } from './modules/location/location.module';
import { ShedModule } from './modules/shed/shed.module';
import { ItemCategoryModule } from './modules/item-category/item-category.module';
import { ItemModule } from './modules/item/item.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ResourceModule } from './modules/resource/resource.module';
import { DiseaseModule } from './modules/disease/disease.module';
import { MedicineModule } from './modules/medicine/medicine.module';
import { FeedFormulaModule } from './modules/feed-formula/feed-formula.module';
import { GlAccountModule } from './modules/gl-account/gl-account.module';
import { GlMappingModule } from './modules/gl-mapping/gl-mapping.module';
import { CostCenterModule } from './modules/cost-center/cost-center.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ProductionModule } from './modules/production/production.module';
import { PoultryModule } from './modules/poultry/poultry.module';
import { CostingModule } from './modules/costing/costing.module';
import { QcModule } from './modules/qc/qc.module';
import { QualityTraceabilityModule } from './modules/quality-traceability/quality-traceability.module';
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
    FeedFormulaModule,
    GlAccountModule,
    GlMappingModule,
    CostCenterModule,
    InventoryModule,
    FinanceModule,
    ProductionModule,
    PoultryModule,
    CostingModule,
    QcModule,
    QualityTraceabilityModule,
  ],
  controllers: [SystemController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*path');
  }
}
