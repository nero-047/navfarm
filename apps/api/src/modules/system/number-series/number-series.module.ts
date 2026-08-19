import { Module } from '@nestjs/common';
import { NumberSeriesService } from './number-series.service';
import { NumberSeriesController } from './number-series.controller';

@Module({
  controllers: [NumberSeriesController],
  providers: [NumberSeriesService],
  exports: [NumberSeriesService],
})
export class NumberSeriesModule {}
