import { Module } from '@nestjs/common';
import { CostingMethodService } from './costing-method.service';
import { CostingMethodController } from './costing-method.controller';

@Module({
  controllers: [CostingMethodController],
  providers: [CostingMethodService],
  exports: [CostingMethodService],
})
export class CostingMethodModule {}
