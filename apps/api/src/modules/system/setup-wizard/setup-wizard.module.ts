import { Module } from '@nestjs/common';
import { SetupWizardService } from './setup-wizard.service';
import { SetupWizardController } from './setup-wizard.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { MasterDataSeedService } from './seed/master-data-seed.service';

@Module({
  imports: [AuditLogModule],
  controllers: [SetupWizardController],
  providers: [SetupWizardService, MasterDataSeedService],
  exports: [SetupWizardService],
})
export class SetupWizardModule {}
