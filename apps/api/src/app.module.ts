import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { DatabaseModule } from './core/database/database.module';
import { TenantModule } from './modules/core/tenant/tenant.module';
import { CompanyModule } from './modules/core/company/company.module';
import { PlanModule } from './modules/system/plan/plan.module';
import { AuthModule } from './modules/core/auth/auth.module';
import { SetupWizardModule } from './modules/system/setup-wizard/setup-wizard.module';
import { RoleModule } from './modules/core/role/role.module';
import { LanguageModule } from './modules/system/language/language.module';
import { CurrencyModule } from './modules/system/currency/currency.module';
import { AuditLogModule } from './modules/system/audit-log/audit-log.module';
import { NotificationModule } from './modules/system/notification/notification.module';
import { UserModule } from './modules/core/user/user.module';
import { UserCompanyModule } from './modules/core/user-company/user-company.module';
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
import { FeedFormulaModule } from './modules/master-data/feed-formula/feed-formula.module';
import { GlAccountModule } from './modules/finance/gl-account/gl-account.module';
import { GlMappingModule } from './modules/finance/gl-mapping/gl-mapping.module';
import { CostCenterModule } from './modules/finance/cost-center/cost-center.module';
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
  ],
  controllers: [SystemController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*path');
  }
}
