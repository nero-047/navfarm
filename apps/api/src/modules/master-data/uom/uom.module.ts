import { Module } from '@nestjs/common';
import { UomService } from './uom.service';
import { UomController } from './uom.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [UomController],
  providers: [UomService],
  exports: [UomService],
})
export class UomModule {}
