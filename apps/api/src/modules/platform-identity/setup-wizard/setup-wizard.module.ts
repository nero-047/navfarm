import { Module } from '@nestjs/common';
import { SetupWizardService } from './setup-wizard.service';
import { SetupWizardController } from './setup-wizard.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';
import { OnboardingAccessGuard } from '../../../common/guards/onboarding-access.guard';

@Module({
  imports: [AuditLogModule, AuthModule],
  controllers: [SetupWizardController],
  providers: [SetupWizardService, OnboardingAccessGuard],
  exports: [SetupWizardService],
})
export class SetupWizardModule {}
