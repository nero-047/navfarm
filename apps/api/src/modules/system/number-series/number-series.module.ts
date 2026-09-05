import { Module } from '@nestjs/common';
import { NumberSeriesService } from './number-series.service';
import { NumberSeriesController } from './number-series.controller';
import { OperationalAreaModule } from '../../core/operational-area/operational-area.module';

@Module({
  imports: [OperationalAreaModule],
  controllers: [NumberSeriesController],
  providers: [NumberSeriesService],
  exports: [NumberSeriesService],
})
export class NumberSeriesModule {}
