import { Module } from '@nestjs/common';
import { CostCenterService } from './cost-center.service';
import { CostCenterController } from './cost-center.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [CostCenterController],
  providers: [CostCenterService],
  exports: [CostCenterService],
})
export class CostCenterModule {}
