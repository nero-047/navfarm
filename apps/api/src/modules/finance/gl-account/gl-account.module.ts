import { Module } from '@nestjs/common';
import { GlAccountService } from './gl-account.service';
import { GlAccountController } from './gl-account.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [GlAccountController],
  providers: [GlAccountService],
  exports: [GlAccountService],
})
export class GlAccountModule {}
