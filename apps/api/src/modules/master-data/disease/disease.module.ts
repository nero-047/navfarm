import { Module } from '@nestjs/common';
import { DiseaseService } from './disease.service';
import { DiseaseController } from './disease.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [DiseaseController],
  providers: [DiseaseService],
  exports: [DiseaseService],
})
export class DiseaseModule {}
