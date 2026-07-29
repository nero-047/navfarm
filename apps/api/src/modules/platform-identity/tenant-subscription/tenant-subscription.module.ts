import { Module } from '@nestjs/common';
import { TenantSubscriptionController } from './tenant-subscription.controller';
import { TenantSubscriptionService } from './tenant-subscription.service';

@Module({
  controllers: [TenantSubscriptionController],
  providers: [TenantSubscriptionService],
  exports: [TenantSubscriptionService],
})
export class TenantSubscriptionModule {}
