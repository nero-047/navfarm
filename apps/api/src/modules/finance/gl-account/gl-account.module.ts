import { Module } from '@nestjs/common';
import { GlAccountService } from './gl-account.service';
import { GlAccountController } from './gl-account.controller';

@Module({
  controllers: [GlAccountController],
  providers: [GlAccountService],
  exports: [GlAccountService],
})
export class GlAccountModule {}
