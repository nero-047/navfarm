import { Module } from '@nestjs/common';
import { AnimalService } from './animal.service';
import { AnimalController } from './animal.controller';
import { AnimalMedicationLogService } from './animal-medication-log.service';
import { AnimalMedicationLogController } from './animal-medication-log.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [AnimalController, AnimalMedicationLogController],
  providers: [AnimalService, AnimalMedicationLogService],
  exports: [AnimalService, AnimalMedicationLogService],
})
export class AnimalModule {}
