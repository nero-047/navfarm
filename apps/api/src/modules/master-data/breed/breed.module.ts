import { Module } from '@nestjs/common';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { SpeciesController } from './species.controller';
import { BreedLifecycleStageController } from './breed-lifecycle-stage.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [BreedController, SpeciesController, BreedLifecycleStageController],
  providers: [BreedService],
  exports: [BreedService],
})
export class BreedModule {}
